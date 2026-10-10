"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { approveQuoteAndCreatePayment } from "@/lib/payments";
import { createPayfastCheckout } from "@/lib/payfast/checkout";
import { sendNotification } from "@/lib/notifications";
import { createNotification } from "@/lib/create-notification";

export async function updateQuoteStatus(
  formData: FormData
) {
  const { user } = await requireRole(["customer"]);

  const bookingId = String(
    formData.get("bookingId") ?? ""
  );

  const decision = String(
    formData.get("decision") ?? ""
  );

  if (!bookingId) {
    throw new Error("Booking ID is required.");
  }

  if (
    decision !== "approve" &&
    decision !== "reject"
  ) {
    throw new Error("Invalid quote decision.");
  }

  const supabase = await createClient();

  const { data: booking, error: bookingError } =
    await supabase
      .from("bookings")
      .select(
        "id, customer_id, provider_id, status, quote_status, quote_total"
      )
      .eq("id", bookingId)
      .eq("customer_id", user.id)
      .single();

  if (bookingError || !booking) {
    throw new Error(
      "Booking not found or access denied."
    );
  }

  if (booking.quote_status !== "quote_sent") {
    throw new Error(
      "This quote is no longer awaiting customer approval."
    );
  }

  if (decision === "reject") {
    const { error } = await supabase
      .from("bookings")
      .update({
        quote_status: "quote_rejected"
      })
      .eq("id", bookingId)
      .eq("customer_id", user.id)
      .eq("quote_status", "quote_sent");

    if (error) {
      throw new Error(error.message);
    }

    await createNotification(
      booking.provider_id,
      "Quote declined",
      "The customer declined your quote. Review the booking before taking further action.",
      "quote_updates"
    );

    const { data: provider } = await supabase
      .from("provider_profiles")
      .select("contact_email")
      .eq("user_id", booking.provider_id)
      .maybeSingle();

    if (provider?.contact_email) {
      await sendNotification({
        to: provider.contact_email,
        subject: "Customer declined your quote",
        html: "<p>The customer has declined your quote. Sign in to review the booking.</p>",
        text: "The customer has declined your quote. Sign in to review the booking."
      }, "quote_updates");
    }

    revalidatePath("/customer");
    revalidatePath("/provider");

    return;
  }

  if (booking.status !== "confirmed") {
    throw new Error(
      "Only confirmed bookings can have their quote approved."
    );
  }

  if (
    !Number.isFinite(Number(booking.quote_total)) ||
    Number(booking.quote_total) <= 0
  ) {
    throw new Error(
      "This quote does not have a valid payment amount."
    );
  }

  await approveQuoteAndCreatePayment(bookingId);

  await createNotification(
    booking.provider_id,
    "Quote approved",
    "The customer approved your quote. Payment is now required before work can begin.",
    "quote_updates"
  );

  const { data: provider } = await supabase
    .from("provider_profiles")
    .select("contact_email")
    .eq("user_id", booking.provider_id)
    .maybeSingle();

  if (provider?.contact_email) {
    await sendNotification({
      to: provider.contact_email,
      subject: "Your quote was approved",
      html: "<p>The customer approved your quote. Payment is now required before work can begin.</p>",
      text: "The customer approved your quote. Payment is now required before work can begin."
    }, "quote_updates");
  }

  await createNotification(
    user.id,
    "Payment required",
    "Your quote was approved. Complete payment to allow the provider to begin work.",
    "payment_updates"
  );

  const { data: customerProfile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .maybeSingle();

  if (customerProfile?.email) {
    await sendNotification({
      to: customerProfile.email,
      subject: "Payment required for your approved quote",
      html: "<p>Your quote was approved. Complete payment from your customer dashboard to allow the provider to begin work.</p>",
      text: "Your quote was approved. Complete payment from your customer dashboard to allow the provider to begin work."
    }, "payment_updates");
  }

  revalidatePath("/customer");
  revalidatePath("/provider");
}

export async function startPayfastCheckout(
  formData: FormData
) {
  await requireRole(["customer"]);

  const paymentId = String(
    formData.get("paymentId") ?? ""
  );

  if (!paymentId) {
    throw new Error("Payment ID is required.");
  }

  return createPayfastCheckout(paymentId);
}

export async function confirmCompletedJob(
  formData: FormData
) {
  const { user } = await requireRole(["customer"]);

  const bookingId = String(
    formData.get("bookingId") ?? ""
  );

  if (!bookingId) {
    throw new Error("Booking ID is required.");
  }

  const supabase = await createClient();

  const { data: booking, error: bookingError } =
    await supabase
      .from("bookings")
      .select("id, customer_id, provider_id, status")
      .eq("id", bookingId)
      .eq("customer_id", user.id)
      .single();

  if (bookingError || !booking) {
    throw new Error(
      "Booking not found or access denied."
    );
  }

  if (booking.status !== "completed") {
    throw new Error(
      "This booking is not ready to be closed."
    );
  }

  const { error } = await supabase
    .from("bookings")
    .update({
      status: "closed",
      customer_confirmed_at:
        new Date().toISOString()
    })
    .eq("id", bookingId)
    .eq("customer_id", user.id)
    .eq("status", "completed");

  if (error) {
    throw new Error(error.message);
  }

  await createNotification(
    booking.provider_id,
    "Job completion confirmed",
    "The customer confirmed that the job is complete.",
    "completion_updates"
  );

  const { data: provider } = await supabase
    .from("provider_profiles")
    .select("contact_email")
    .eq("user_id", booking.provider_id)
    .maybeSingle();

  if (provider?.contact_email) {
    await sendNotification({
      to: provider.contact_email,
      subject: "Customer confirmed job completion",
      html: "<p>The customer confirmed that the job is complete.</p>",
      text: "The customer confirmed that the job is complete."
    }, "completion_updates");
  }

  revalidatePath("/customer");
  revalidatePath("/provider");
}

export async function createReview(
  formData: FormData
) {
  const { user } = await requireRole(["customer"]);

  const bookingId = String(
    formData.get("bookingId") ?? ""
  );

  const rating = Number(
    formData.get("rating") ?? 0
  );

  const reviewText = String(
    formData.get("review") ?? ""
  ).trim();

  if (!bookingId) {
    throw new Error("Booking ID is required.");
  }

  if (
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    throw new Error(
      "Rating must be between 1 and 5."
    );
  }

  const supabase = await createClient();

  const { data: booking, error: bookingError } =
    await supabase
      .from("bookings")
      .select(
        "id, customer_id, provider_id, status"
      )
      .eq("id", bookingId)
      .eq("customer_id", user.id)
      .single();

  if (bookingError || !booking) {
    throw new Error(
      "Booking not found or access denied."
    );
  }

  if (booking.status !== "closed") {
    throw new Error(
      "You can only review a closed booking."
    );
  }

  const { data: existingReview } =
    await supabase
      .from("reviews")
      .select("id")
      .eq("booking_id", bookingId)
      .maybeSingle();

  if (existingReview) {
    throw new Error(
      "This booking has already been reviewed."
    );
  }

  const { error } = await supabase
    .from("reviews")
    .insert({
      booking_id: booking.id,
      customer_id: booking.customer_id,
      provider_id: booking.provider_id,
      rating,
      review_text: reviewText || null
    });

  if (error) {
    throw new Error(error.message);
  }

  const reviewSummary = reviewText
    ? `A customer gave you ${rating}/5 stars: ${reviewText}`
    : `A customer gave your service ${rating}/5 stars.`;

  await createNotification(
    booking.provider_id,
    "New customer review",
    reviewSummary
  );

  const { data: providerProfile } = await supabase
    .from("provider_profiles")
    .select("contact_email")
    .eq("user_id", booking.provider_id)
    .maybeSingle();

  if (providerProfile?.contact_email) {
    const escapedReview = reviewText
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

    const reviewMessage = reviewText
      ? `The customer rated your service ${rating}/5 stars and wrote: "${reviewText}"`
      : `The customer rated your service ${rating}/5 stars.`;

    await sendNotification({
      to: providerProfile.contact_email,
      subject: `You received a ${rating}-star customer review`,
      html: `<p>A customer reviewed a completed booking.</p><p><strong>Rating:</strong> ${rating}/5 stars</p>${escapedReview ? `<p><strong>Review:</strong> ${escapedReview}</p>` : "<p>The customer left a rating without written feedback.</p>"}`,
      text: reviewMessage
    });
  }

  revalidatePath("/customer");
  revalidatePath("/provider");
  revalidatePath(
    `/providers/${booking.provider_id}`
  );
}