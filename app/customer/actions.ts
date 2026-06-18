"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateQuoteStatus(
  formData: FormData
) {
  const bookingId = String(
  formData.get("bookingId") ?? ""
);

const decision = String(
  formData.get("decision") ?? ""
);

console.log("BOOKING ID:", bookingId);
console.log("DECISION:", decision);

  const supabase = await createClient();

  const updateData =
  decision === "approve"
    ? {
        quote_status: "quote_approved",
        quote_approved_at: new Date().toISOString(),
        status: "in_progress"
      }
    : {
        quote_status: "quote_rejected"
      };

  const { data, error } = await supabase
  .from("bookings")
  .update(updateData)
  .eq("id", bookingId)
  .select();

console.log("BOOKING ID:", bookingId);
console.log("DECISION:", decision);
console.log("RESULT:", data);
console.log("ERROR:", error);

  console.log("SUPABASE ERROR:", error);

if (error) {
  throw new Error(error.message);
}

  revalidatePath("/customer");
}

export async function confirmCompletedJob(
  formData: FormData
) {
  const bookingId = String(
    formData.get("bookingId") ?? ""
  );

  const supabase = await createClient();

  const { error } = await supabase
    .from("bookings")
    .update({
      status: "closed",
      customer_confirmed_at:
        new Date().toISOString()
    })
    .eq("id", bookingId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/customer");
  revalidatePath("/provider");
}
export async function createReview(
  formData: FormData
) {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const bookingId = String(
    formData.get("bookingId") ?? ""
  );

  const providerId = String(
    formData.get("providerId") ?? ""
  );

  const rating = Number(
    formData.get("rating") ?? 0
  );

  const reviewText = String(
    formData.get("review") ?? ""
  );

  const { error } = await supabase
    .from("reviews")
    .insert({
      booking_id: bookingId,
      customer_id: user.id,
      provider_id: providerId,
      rating,
      review_text: reviewText
    });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/customer");
}