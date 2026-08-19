"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";

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
      .select("id, customer_id, quote_status")
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

  const updateData =
    decision === "approve"
      ? {
          quote_status: "quote_approved",
          quote_approved_at:
            new Date().toISOString(),
          status: "in_progress"
        }
      : {
          quote_status: "quote_rejected"
        };

  const { error } = await supabase
    .from("bookings")
    .update(updateData)
    .eq("id", bookingId)
    .eq("customer_id", user.id)
    .eq("quote_status", "quote_sent");

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/customer");
  revalidatePath("/provider");
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
      .select("id, customer_id, status")
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

  revalidatePath("/customer");
  revalidatePath("/provider");
  revalidatePath(
    `/providers/${booking.provider_id}`
  );
}