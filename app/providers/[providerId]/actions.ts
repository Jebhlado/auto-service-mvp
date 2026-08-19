"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendNotification } from "@/lib/notifications";
import { createNotification } from "@/lib/create-notification";

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

  await createNotification(
    providerId,
    "New Booking",
    `${profile.full_name} submitted a new booking request.`
  );

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
}
