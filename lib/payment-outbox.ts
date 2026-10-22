import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getPlatformSettings, isInAppNotificationEnabled } from "@/lib/platform-settings";
import { sendNotification } from "@/lib/notifications";

type OutboxRow = { id: string; payment_id: string; attempts: number; claim_token: string };

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function createPaymentInAppNotification(
  userId: string,
  title: string,
  message: string,
  eventKey: string,
): Promise<void> {
  const settings = await getPlatformSettings();
  if (!isInAppNotificationEnabled(settings, "payment_updates")) return;

  const supabase = createAdminClient();
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    event_key: eventKey,
  });

  // A duplicate event key means the notification already exists; all other
  // database failures must keep the outbox item retryable.
  if (error?.code === "23505") return;
  if (error) throw new Error(`Could not create in-app payment notification: ${error.message}`);
}

async function processClaimedOutbox(paymentId?: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data: rows, error: claimError } = await supabase.rpc(
    "claim_payment_processing_outbox",
    { p_payment_id: paymentId ?? null },
  );
  if (claimError) throw new Error(`Could not claim payment outbox item: ${claimError.message}`);
  const row = (rows as OutboxRow[] | null)?.[0];
  if (!row) return false;
  if (!row.claim_token) {
    throw new Error("Claimed outbox item is missing its ownership token.");
  }

  try {
    const { data: payment, error: paymentError } = await supabase
      .from("payments").select("id, booking_id, customer_id, provider_id, amount")
      .eq("id", row.payment_id).single();
    if (paymentError || !payment) throw new Error(`Could not load payment: ${paymentError?.message ?? "not found"}`);

    const { data: booking, error: bookingError } = await supabase
      .from("bookings").select("id, status").eq("id", payment.booking_id).single();
    if (bookingError || !booking) throw new Error(`Could not load booking: ${bookingError?.message ?? "not found"}`);

    if (booking.status === "confirmed") {
      const { data: updated, error: updateError } = await supabase
        .from("bookings").update({ status: "in_progress" })
        .eq("id", booking.id).eq("status", "confirmed").select("id").maybeSingle();
      if (updateError) throw new Error(`Could not start booking: ${updateError.message}`);
      if (!updated) {
        const { data: latest, error: latestError } = await supabase
          .from("bookings").select("status").eq("id", booking.id).single();
        if (latestError || !latest || !["in_progress", "completed", "closed"].includes(latest.status)) {
          throw new Error("Booking status changed unexpectedly after payment confirmation.");
        }
      }
    } else if (!["in_progress", "completed", "closed"].includes(booking.status)) {
      throw new Error(`Booking is in unexpected status "${booking.status}" after payment confirmation.`);
    }

    const amount = Number(payment.amount);
    if (!Number.isFinite(amount)) throw new Error("Payment amount is invalid.");

    await createPaymentInAppNotification(payment.customer_id, "Payment confirmed",
      `Your payment of R${amount.toFixed(2)} has been confirmed.`,
      `payment-confirmed:${payment.id}:customer`);

    const { data: customer } = await supabase.from("profiles").select("email")
      .eq("id", payment.customer_id).maybeSingle();
    if (customer?.email) {
      const result = await sendNotification({
        to: customer.email, subject: "Mechanic Connect payment confirmed",
        html: `<p>Your payment of R${amount.toFixed(2)} has been confirmed. You can view the latest booking status from your customer dashboard.</p>`,
        text: `Your payment of R${amount.toFixed(2)} has been confirmed. You can view the latest booking status from your customer dashboard.`,
      }, "payment_updates", `payment-confirmed:${payment.id}:customer-email`);
      if (!result.sent && !result.skipped) throw new Error("Customer payment confirmation email was not sent.");
    }

    await createPaymentInAppNotification(payment.provider_id, "Payment received",
      `The customer's payment of R${amount.toFixed(2)} has been confirmed. The booking is now ready to proceed.`,
      `payment-confirmed:${payment.id}:provider`);

    const { data: provider } = await supabase.from("provider_profiles").select("contact_email")
      .eq("user_id", payment.provider_id).maybeSingle();
    if (provider?.contact_email) {
      const result = await sendNotification({
        to: provider.contact_email, subject: "Customer payment confirmed",
        html: `<p>The customer's payment of R${amount.toFixed(2)} has been confirmed. Sign in to AutoCare Connect to view the booking and continue the job.</p>`,
        text: `The customer's payment of R${amount.toFixed(2)} has been confirmed. Sign in to AutoCare Connect to view the booking and continue the job.`,
      }, "payment_updates", `payment-confirmed:${payment.id}:provider-email`);
      if (!result.sent && !result.skipped) throw new Error("Provider payment confirmation email was not sent.");
    }

    const { data: completed, error: completeError } = await supabase
      .from("payment_processing_outbox")
      .update({
        status: "processed",
        processed_at: new Date().toISOString(),
        locked_until: null,
        claim_token: null,
        last_error: null,
      })
      .eq("id", row.id)
      .eq("claim_token", row.claim_token)
      .gt("locked_until", new Date().toISOString())
      .select("id")
      .maybeSingle();

    if (completeError) throw new Error(`Could not mark outbox item processed: ${completeError.message}`);
    if (!completed) {
      throw new Error("Outbox claim expired or was replaced; completion was not applied.");
    }
    return true;
  } catch (error) {
    const attempts = Math.max(1, row.attempts || 1);
    const delaySeconds = Math.min(3600, 30 * 2 ** Math.min(attempts - 1, 7));
    const message = errorMessage(error).slice(0, 2000);
    const { data: retried, error: retryError } = await supabase
      .from("payment_processing_outbox")
      .update({
        status: "pending",
        available_at: new Date(Date.now() + delaySeconds * 1000).toISOString(),
        locked_until: null,
        claim_token: null,
        last_error: message,
      })
      .eq("id", row.id)
      .eq("claim_token", row.claim_token)
      .gt("locked_until", new Date().toISOString())
      .select("id")
      .maybeSingle();

    if (retryError || !retried) {
      console.error("Could not reschedule outbox item or claim was lost", {
        outboxId: row.id,
        error: retryError?.message ?? "Claim expired or was replaced",
      });
    }
    console.error("Payment outbox processing failed", { outboxId: row.id, paymentId: row.payment_id, error: message });
    throw error;
  }
}

export async function processPaymentOutbox(paymentId?: string): Promise<boolean> {
  return processClaimedOutbox(paymentId);
}

export async function processPaymentOutboxBatch(limit = 25): Promise<{ processed: number; failed: number }> {
  let processed = 0;
  let failed = 0;
  for (let i = 0; i < Math.max(1, Math.min(limit, 100)); i += 1) {
    try {
      if (!(await processClaimedOutbox())) break;
      processed += 1;
    } catch {
      failed += 1;
    }
  }
  return { processed, failed };
}
