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

console.log("providerId =", providerId);
console.log("appointmentDate =", appointmentDate);
console.log("issueDescription =", issueDescription);
console.log("servicePreference =", servicePreference);

const attachment = formData.get("attachment") as File | null;

console.log("attachment =", attachment);
console.log("attachment name =", attachment?.name);
console.log("attachment size =", attachment?.size);

  const supabase = await createClient();

  let attachmentUrl: string | null = null;

  if (attachment && attachment.size > 0) {
  console.log("Attachment found:", attachment.name);
  console.log("Attachment size:", attachment.size);

  const fileName = `${Date.now()}-${attachment.name}`;

const arrayBuffer = await attachment.arrayBuffer();
const buffer = Buffer.from(arrayBuffer);

const { error: uploadError } = await supabase.storage
  .from("booking-attachments")
  .upload(
    fileName,
    buffer,
    {
      contentType: attachment.type
    }
  );

  if (uploadError) {
    console.error("UPLOAD ERROR:", uploadError);
  } else {
    const { data } = supabase.storage
      .from("booking-attachments")
      .getPublicUrl(fileName);

    attachmentUrl = data.publicUrl;

    console.log("UPLOAD SUCCESS:", attachmentUrl);
  }
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

export async function markJobComplete(
  formData: FormData
) {
  const bookingId = String(
    formData.get("bookingId") ?? ""
  );

  const supabase = await createClient();

  const { error } = await supabase
    .from("bookings")
    .update({
      status: "completed",
      completed_at: new Date().toISOString()
    })
    .eq("id", bookingId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/provider");
  revalidatePath("/customer");
}