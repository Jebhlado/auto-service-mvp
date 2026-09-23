import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getPayfastConfig } from "./config";
import { generatePayfastSignature } from "./signature";

export type PayfastCheckout = {
  action: string;
  fields: Record<string, string>;
};

export async function createPayfastCheckout(
  paymentId: string
): Promise<PayfastCheckout> {
  if (!paymentId) {
    throw new Error("Payment ID is required.");
  }

  const supabase = await createClient();

  const {
    data: {
      user
    }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in.");
  }

  const { data: payment, error: paymentError } =
    await supabase
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
        booking:bookings(
          id,
          issue_description,
          appointment_date
        )
      `
      )
      .eq("id", paymentId)
      .eq("customer_id", user.id)
      .single();

  if (paymentError || !payment) {
    throw new Error(
      "Payment not found or access denied."
    );
  }

  if (payment.status !== "pending") {
    throw new Error(
      "This payment is no longer awaiting payment."
    );
  }

  const { data: customer, error: customerError } =
    await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

  if (customerError || !customer) {
    throw new Error("Customer profile not found.");
  }

  const {
  data: payfastMerchantId,
  error: providerPaymentError
} = await supabase.rpc(
  "get_payfast_merchant_id_for_payment",
  {
    p_payment_id: payment.id
  }
);

if (
  providerPaymentError ||
  !payfastMerchantId
) {
  throw new Error(
    "This provider does not have a PayFast payment account configured."
  );
}

  const amount = Number(payment.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(
      "This payment does not have a valid amount."
    );
  }

  const config = getPayfastConfig();

  const appBaseUrl =
    process.env.APP_BASE_URL?.replace(/\/$/, "");

  if (!appBaseUrl) {
    throw new Error(
      "Missing required environment variable: APP_BASE_URL"
    );
  }

  const booking = Array.isArray(payment.booking)
    ? payment.booking[0]
    : payment.booking;

  const fields: Record<string, string> = {
    merchant_id: config.merchantId,
    merchant_key: config.merchantKey,

    return_url: `${appBaseUrl}/customer?payment=success`,
    cancel_url: `${appBaseUrl}/customer?payment=cancelled`,
    notify_url: `${appBaseUrl}/api/payfast/notify`,

    name_first: customer.full_name.trim().split(/\s+/)[0],
    name_last: customer.full_name.trim().split(/\s+/).slice(1).join(" "),
    email_address: customer.email,

    m_payment_id: payment.id,
    amount: amount.toFixed(2),
    item_name: `AutoCare Connect Booking ${payment.booking_id}`,
    item_description:
      booking?.issue_description ??
      "Automotive service booking"
  };

  const setup = JSON.stringify({
  split_payment: {
    merchant_id: payfastMerchantId,
    percentage: 85
  }
});

fields.setup = setup;

const signature = generatePayfastSignature(
  fields,
  config.passphrase,
  ["setup"]
);

fields.signature = signature;

  return {
    action: config.processUrl,
    fields
  };
}