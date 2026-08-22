"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendNotification } from "@/lib/notifications";

export async function createBookingAction(formData: FormData) {
  const { user, profile } = await requireRole(["customer"]);

  const providerId = String(formData.get("providerId") ?? "");
  const appointmentDate = String(formData.get("appointmentDate") ?? "");
  const issueDescription = String(formData.get("issueDescription") ?? "");

  const servicePreference = String(
    formData.get("servicePreference") ?? ""
  );

  const attachment = formData.get("attachment") as File | null;

  const supabase = await createClient();

  let attachmentUrl: string | null = null;

  if (attachment && attachment.size > 0) {
    const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

    const allowedMimeTypes = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf"
    ]);

    if (attachment.size > MAX_ATTACHMENT_SIZE) {
      throw new Error("Attachment must be 10 MB or smaller.");
    }

    if (!allowedMimeTypes.has(attachment.type)) {
      throw new Error(
        "Invalid attachment type. Please upload a JPG, PNG, WEBP, or PDF file."
      );
    }

    const extensionByMimeType: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "application/pdf": "pdf"
    };

    const extension = extensionByMimeType[attachment.type];
    const fileName = `${crypto.randomUUID()}.${extension}`;

    const arrayBuffer = await attachment.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("booking-attachments")
      .upload(fileName, buffer, {
        contentType: attachment.type,
        upsert: false
      });

    if (uploadError) {
      throw new Error("Attachment upload failed.");
    }

    const { data } = supabase.storage
      .from("booking-attachments")
      .getPublicUrl(fileName);

    attachmentUrl = data.publicUrl;
  }

  const { error } = await supabase.from("bookings").insert({
    customer_id: user.id,
    provider_id: providerId,
    appointment_date: appointmentDate,
    issue_description: issueDescription,
    service_preference: servicePreference,
    attachment_url: attachmentUrl,
    status: "pending"
  });

  if (error) {
    redirect(
      `/providers/${providerId}?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  const { data: provider } = await supabase
    .from("provider_profiles")
    .select("business_name, contact_email")
    .eq("user_id", providerId)
    .single();

  if (provider?.contact_email) {
    await sendNotification({
      to: provider.contact_email,
      subject: "New booking request",
      html: `
        <p>${profile.full_name} requested an appointment for ${appointmentDate}.</p>
        <p>${issueDescription}</p>
      `,
      text: `${profile.full_name} requested an appointment for ${appointmentDate}. ${issueDescription}`
    });
  }

  redirect("/customer?success=booking-created");
}

export async function testProviderAction() {
  console.log("Provider action works");
}

export async function updateBookingStatusAction(
  formData: FormData
) {
  const { user } = await requireRole(["provider"]);

  const bookingId = String(
    formData.get("bookingId") ?? ""
  );

  const status = String(
    formData.get("status") ?? ""
  );

  if (!bookingId) {
    throw new Error("Booking ID is required.");
  }

  if (
    status !== "confirmed" &&
    status !== "rejected"
  ) {
    throw new Error("Invalid booking status.");
  }

  const supabase = await createClient();

  const { data: booking, error: bookingError } =
    await supabase
      .from("bookings")
      .select("id, provider_id, status")
      .eq("id", bookingId)
      .eq("provider_id", user.id)
      .single();

  if (bookingError || !booking) {
    throw new Error(
      "Booking not found or access denied."
    );
  }

  if (booking.status !== "pending") {
    throw new Error(
      "Only pending bookings can be accepted or rejected."
    );
  }

  const { error } = await supabase
    .from("bookings")
    .update({
      status,
    })
    .eq("id", bookingId)
    .eq("provider_id", user.id)
    .eq("status", "pending");

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/provider");
  revalidatePath("/customer");
}

export async function sendQuoteAction(
  formData: FormData
) {
  const { user } = await requireRole(["provider"]);

  const bookingId = String(
    formData.get("bookingId") ?? ""
  );

  const servicePrice = Number(
    formData.get("servicePrice") ?? 0
  );

  const calloutFee = Number(
    formData.get("calloutFee") ?? 0
  );

  const estimatedTime = String(
    formData.get("estimatedTime") ?? ""
  );

  const warranty = String(
    formData.get("warranty") ?? ""
  );

  const quoteNotes = String(
    formData.get("quoteNotes") ?? ""
  );

  if (!bookingId) {
    throw new Error("Booking ID is required.");
  }

  if (!Number.isFinite(servicePrice) || servicePrice <= 0) {
    throw new Error("Service Price must be greater than R0.");
  }

  if (!Number.isFinite(calloutFee) || calloutFee < 0) {
    throw new Error("Call-out Fee cannot be negative.");
  }

  const total = servicePrice + calloutFee;

  const supabase = await createClient();

  const { data: booking, error: bookingError } =
    await supabase
      .from("bookings")
      .select("id, provider_id, status, quote_status")
      .eq("id", bookingId)
      .eq("provider_id", user.id)
      .single();

  if (bookingError || !booking) {
    throw new Error(
      "Booking not found or access denied."
    );
  }

  if (booking.status !== "confirmed") {
    throw new Error(
      "A quote can only be sent for a confirmed booking."
    );
  }

  if (booking.quote_status === "quote_sent") {
    throw new Error(
      "A quote has already been sent for this booking."
    );
  }

  const { data: updatedBooking, error } =
    await supabase
      .from("bookings")
      .update({
        quote_service_price: servicePrice,
        quote_callout_fee: calloutFee,
        quote_estimated_time: estimatedTime,
        quote_warranty: warranty,
        quote_total: total,
        quote_notes: quoteNotes,
        quote_status: "quote_sent",
        quote_sent_at: new Date().toISOString()
      })
      .eq("id", bookingId)
      .eq("provider_id", user.id)
      .eq("status", "confirmed")
      .neq("quote_status", "quote_sent")
      .select("id")
      .maybeSingle();

  if (error || !updatedBooking) {
    throw new Error(
      error?.message ??
        "Quote could not be sent from the current booking state."
    );
  }

  revalidatePath("/provider");
  revalidatePath("/dashboard/provider");
  revalidatePath("/customer");
}

export async function markJobComplete(
  formData: FormData
) {
  const { user } = await requireRole(["provider"]);

  const bookingId = String(
    formData.get("bookingId") ?? ""
  );

  if (!bookingId) {
    throw new Error("Booking ID is required.");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("bookings")
    .update({
      status: "completed",
      completed_at: new Date().toISOString()
    })
    .eq("id", bookingId)
    .eq("provider_id", user.id)
    .eq("status", "in_progress");

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/provider");
  revalidatePath("/customer");
}