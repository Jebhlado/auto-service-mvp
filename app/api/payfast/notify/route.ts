import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPayfastConfig } from "@/lib/payfast/config";
import {
  generatePayfastSignatureFromParameterString
} from "@/lib/payfast/signature";

const PAYFAST_IP_RANGES = [
  { base: "197.97.145.144", prefix: 28 },
  { base: "41.74.179.192", prefix: 27 },
  { base: "102.216.36.0", prefix: 28 },
  { base: "102.216.36.128", prefix: 28 },
  { base: "144.126.193.139", prefix: 32 }
];

function ipv4ToNumber(ip: string): number | null {
  const parts = ip.split(".");

  if (parts.length !== 4) {
    return null;
  }

  const numbers = parts.map(Number);

  if (
    numbers.some(
      (part) =>
        !Number.isInteger(part) ||
        part < 0 ||
        part > 255
    )
  ) {
    return null;
  }

  return (
    ((numbers[0] << 24) >>> 0) +
    ((numbers[1] << 16) >>> 0) +
    ((numbers[2] << 8) >>> 0) +
    (numbers[3] >>> 0)
  ) >>> 0;
}

function isIpInCidr(
  ip: string,
  base: string,
  prefix: number
): boolean {
  const ipNumber = ipv4ToNumber(ip);
  const baseNumber = ipv4ToNumber(base);

  if (
    ipNumber === null ||
    baseNumber === null
  ) {
    return false;
  }

  if (prefix === 32) {
    return ipNumber === baseNumber;
  }

  const mask =
    (0xffffffff << (32 - prefix)) >>> 0;

  return (
    (ipNumber & mask) ===
    (baseNumber & mask)
  );
}

function isValidPayfastIp(ip: string): boolean {
  return PAYFAST_IP_RANGES.some(
    ({ base, prefix }) =>
      isIpInCidr(ip, base, prefix)
  );
}

function getRequestIp(
  request: NextRequest
): string | null {
  const forwardedFor =
    request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor
      .split(",")[0]
      .trim();
  }

  const realIp =
    request.headers.get("x-real-ip");

  return realIp?.trim() || null;
}

function buildItNParameterString(
  data: Record<string, string>
): string {
  return Object.entries(data)
    .filter(
      ([key, value]) =>
        key !== "signature" &&
        value !== ""
    )
    .map(
      ([key, value]) =>
        `${key}=${encodeURIComponent(
          value.trim()
        )
          .replace(/%20/g, "+")
          .replace(/[!'()*~]/g, (character) =>
            `%${character
              .charCodeAt(0)
              .toString(16)
              .toUpperCase()}`
          )}`
    )
    .join("&");
}

async function validateWithPayfast(
  parameterString: string
): Promise<boolean> {
  const config = getPayfastConfig();

  const validationUrl = config.sandbox
    ? "https://sandbox.payfast.co.za/eng/query/validate"
    : "https://www.payfast.co.za/eng/query/validate";

  const response = await fetch(
    validationUrl,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded"
      },
      body: parameterString,
      cache: "no-store"
    }
  );

  if (!response.ok) {
    return false;
  }

  const result = (
    await response.text()
  ).trim();

  return result === "VALID";
}

export async function POST(
  request: NextRequest
) {
  /*
   * PayFast expects the notify URL to respond with HTTP 200.
   * We still return non-200 for invalid/untrusted notifications
   * so they can be investigated rather than treated as successful.
   */

  try {
    const rawBody = await request.text();

    if (!rawBody) {
      return new NextResponse(
        "Empty notification",
        { status: 400 }
      );
    }

    const params = new URLSearchParams(
      rawBody
    );

    const data: Record<string, string> = {};

    for (const [key, value] of params.entries()) {
      data[key] = value;
    }

    const suppliedSignature =
      data.signature;

    if (!suppliedSignature) {
      return new NextResponse(
        "Missing signature",
        { status: 400 }
      );
    }

    /*
     * ---------------------------------------------------------
     * 1. Verify request came from PayFast infrastructure
     * ---------------------------------------------------------
     */

    const requestIp =
      getRequestIp(request);

    if (
      !requestIp ||
      !isValidPayfastIp(requestIp)
    ) {
      console.error(
        "PayFast ITN rejected: invalid source IP",
        {
          requestIp
        }
      );

      return new NextResponse(
        "Invalid source",
        { status: 403 }
      );
    }

    /*
     * ---------------------------------------------------------
     * 2. Verify merchant ID
     * ---------------------------------------------------------
     */

    const config = getPayfastConfig();

    if (
      data.merchant_id !==
      config.merchantId
    ) {
      return new NextResponse(
        "Invalid merchant",
        { status: 400 }
      );
    }

    /*
     * ---------------------------------------------------------
     * 3. Verify ITN signature
     * ---------------------------------------------------------
     *
     * PayFast's ITN signature is calculated from the
     * notification variables, excluding "signature",
     * in the order received, followed by the passphrase.
     */

    const parameterString =
      buildItNParameterString(data);

    const expectedSignature =
  generatePayfastSignatureFromParameterString(
    parameterString,
    config.passphrase
  );

    if (
      expectedSignature.toLowerCase() !==
      suppliedSignature.toLowerCase()
    ) {
      console.error(
        "PayFast ITN rejected: invalid signature"
      );

      return new NextResponse(
        "Invalid signature",
        { status: 400 }
      );
    }

    /*
     * ---------------------------------------------------------
     * 4. Validate required payment fields
     * ---------------------------------------------------------
     */

    const paymentId =
      data.m_payment_id;

    const payfastPaymentId =
      data.pf_payment_id;

    const paymentStatus =
      data.payment_status;

    const amountGross =
      Number(data.amount_gross);

    if (
      !paymentId ||
      !payfastPaymentId ||
      !paymentStatus ||
      !Number.isFinite(amountGross)
    ) {
      return new NextResponse(
        "Invalid payment notification",
        { status: 400 }
      );
    }

    /*
     * ---------------------------------------------------------
     * 5. Load our payment
     * ---------------------------------------------------------
     */

    const supabase =
      createAdminClient();

    const {
      data: payment,
      error: paymentError
    } = await supabase
      .from("payments")
      .select(
        `
          id,
          booking_id,
          customer_id,
          provider_id,
          amount,
          currency,
          status,
          payfast_payment_id
        `
      )
      .eq("id", paymentId)
      .single();

    if (
      paymentError ||
      !payment
    ) {
      console.error(
        "PayFast ITN rejected: payment not found",
        {
          paymentId,
          paymentError
        }
      );

      return new NextResponse(
        "Payment not found",
        { status: 404 }
      );
    }

    /*
     * ---------------------------------------------------------
     * 6. Verify amount
     * ---------------------------------------------------------
     */

    const expectedAmount =
      Number(payment.amount);

    if (
      !Number.isFinite(expectedAmount) ||
      Math.abs(
        expectedAmount - amountGross
      ) > 0.01
    ) {
      console.error(
        "PayFast ITN rejected: amount mismatch",
        {
          paymentId,
          expectedAmount,
          amountGross
        }
      );

      return new NextResponse(
        "Amount mismatch",
        { status: 400 }
      );
    }

    /*
     * ---------------------------------------------------------
     * 7. Ask PayFast to validate the notification
     * ---------------------------------------------------------
     */

    const serverValidation =
      await validateWithPayfast(
        parameterString
      );

    if (!serverValidation) {
      console.error(
        "PayFast ITN rejected: PayFast validation failed",
        {
          paymentId
        }
      );

      return new NextResponse(
        "PayFast validation failed",
        { status: 400 }
      );
    }

    /*
     * ---------------------------------------------------------
     * 8. Handle duplicate ITNs safely
     * ---------------------------------------------------------
     */

    if (
      payment.status === "paid"
    ) {
      /*
       * The same ITN can be delivered more than once.
       * If the payment is already paid, do not attempt
       * paid -> paid because that is not a valid state
       * transition.
       */

      if (
        payment.payfast_payment_id &&
        payment.payfast_payment_id !==
          payfastPaymentId
      ) {
        console.error(
          "PayFast ITN rejected: PayFast payment ID mismatch",
          {
            paymentId,
            existing:
              payment.payfast_payment_id,
            received:
              payfastPaymentId
          }
        );

        return new NextResponse(
          "Payment ID mismatch",
          { status: 400 }
        );
      }

      return new NextResponse(
        "OK",
        { status: 200 }
      );
    }

    /*
     * ---------------------------------------------------------
     * 9. Only COMPLETE payments can become paid
     * ---------------------------------------------------------
     */

    if (
      paymentStatus !== "COMPLETE"
    ) {
      /*
       * PayFast can send CANCELLED notifications.
       * We do not mark a payment as paid for those.
       */

      if (
        paymentStatus === "CANCELLED"
      ) {
        if (
          payment.status === "pending" ||
          payment.status === "processing"
        ) {
          const {
            error: transitionError
          } = await supabase.rpc(
            "transition_payment",
            {
              p_payment_id:
                payment.id,
              p_to_status:
                "cancelled",
              p_reason:
                "PayFast payment cancelled",
              p_metadata: {
                payfast_payment_id:
                  payfastPaymentId,
                payment_status:
                  paymentStatus
              }
            }
          );

          if (transitionError) {
            console.error(
              "Failed to cancel PayFast payment",
              transitionError
            );

            return new NextResponse(
              "Payment update failed",
              { status: 500 }
            );
          }
        }
      }

      return new NextResponse(
        "OK",
        { status: 200 }
      );
    }

    /*
     * ---------------------------------------------------------
     * 10. Store PayFast transaction information
     * ---------------------------------------------------------
     */

    const {
      error: paymentUpdateError
    } = await supabase
      .from("payments")
      .update({
        payfast_payment_id:
          payfastPaymentId,
        payfast_reference:
          paymentId,
        metadata: {
          payfast: {
            merchant_id:
              data.merchant_id,
            pf_payment_id:
              payfastPaymentId,
            payment_status:
              paymentStatus,
            amount_gross:
              data.amount_gross,
            amount_fee:
              data.amount_fee ?? null,
            amount_net:
              data.amount_net ?? null,
            received_at:
              new Date().toISOString()
          }
        }
      })
      .eq("id", payment.id);

    if (paymentUpdateError) {
      console.error(
        "Failed to store PayFast payment information",
        paymentUpdateError
      );

      return new NextResponse(
        "Payment update failed",
        { status: 500 }
      );
    }

    /*
     * ---------------------------------------------------------
     * 11. pending -> processing
     * ---------------------------------------------------------
     */

    if (
      payment.status === "pending"
    ) {
      const {
        error: processingError
      } = await supabase.rpc(
        "transition_payment",
        {
          p_payment_id:
            payment.id,
          p_to_status:
            "processing",
          p_reason:
            "PayFast payment notification received",
          p_metadata: {
            payfast_payment_id:
              payfastPaymentId
          }
        }
      );

      if (processingError) {
        console.error(
          "Failed to transition payment to processing",
          processingError
        );

        return new NextResponse(
          "Payment transition failed",
          { status: 500 }
        );
      }
    }

    /*
     * ---------------------------------------------------------
     * 12. processing -> paid
     * ---------------------------------------------------------
     */

    const {
      error: paidError
    } = await supabase.rpc(
      "transition_payment",
      {
        p_payment_id:
          payment.id,
        p_to_status:
          "paid",
        p_reason:
          "PayFast payment confirmed",
        p_metadata: {
          payfast_payment_id:
            payfastPaymentId,
          amount_gross:
            data.amount_gross,
          amount_fee:
            data.amount_fee ?? null,
          amount_net:
            data.amount_net ?? null
        }
      }
    );

    if (paidError) {
      console.error(
        "Failed to transition payment to paid",
        paidError
      );

      return new NextResponse(
        "Payment confirmation failed",
        { status: 500 }
      );
    }

    /*
     * ---------------------------------------------------------
     * 13. Payment is now confirmed.
     *
     * Only NOW do we move the booking from confirmed
     * to in_progress.
     * ---------------------------------------------------------
     */

    const {
      data: booking,
      error: bookingError
    } = await supabase
      .from("bookings")
      .select(
        "id, status"
      )
      .eq(
        "id",
        payment.booking_id
      )
      .single();

    if (
      bookingError ||
      !booking
    ) {
      console.error(
        "Payment is paid but booking could not be loaded",
        {
          bookingId:
            payment.booking_id,
          bookingError
        }
      );

      /*
       * Payment is already confirmed.
       * Do not return a fake payment failure.
       * The booking can be reconciled separately.
       */
      return new NextResponse(
        "OK",
        { status: 200 }
      );
    }

    if (
      booking.status === "confirmed"
    ) {
      const {
        error: bookingUpdateError
      } = await supabase
        .from("bookings")
        .update({
          status: "in_progress"
        })
        .eq(
          "id",
          booking.id
        )
        .eq(
          "status",
          "confirmed"
        );

      if (bookingUpdateError) {
        console.error(
          "Payment confirmed but booking could not be started",
          bookingUpdateError
        );

        return new NextResponse(
          "OK",
          { status: 200 }
        );
      }
    }

    /*
     * ---------------------------------------------------------
     * 14. ITN successfully processed
     * ---------------------------------------------------------
     */

    console.log(
      "PayFast ITN processed successfully",
      {
        paymentId:
          payment.id,
        bookingId:
          payment.booking_id,
        payfastPaymentId,
        amountGross
      }
    );

    return new NextResponse(
      "OK",
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "PayFast ITN processing error",
      error
    );

    return new NextResponse(
      "Internal server error",
      { status: 500 }
    );
  }
}