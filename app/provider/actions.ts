"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendNotification } from "@/lib/notifications";

export async function saveProviderProfileAction(formData: FormData) {
  const { user } = await requireRole(["provider"]);
  const supabase = await createClient();
  const selectedService = String(formData.get("services") ?? "");

  const payload = {
    user_id: user.id,
    business_name: String(formData.get("businessName") ?? ""),
    services: selectedService ? [selectedService] : [],
    location: String(formData.get("location") ?? ""),
    contact_email: String(formData.get("contactEmail") ?? ""),
    contact_phone: String(formData.get("contactPhone") ?? ""),
    bio: String(formData.get("bio") ?? ""),
    approval_status: "pending"
  };

  const { error } = await supabase.from("provider_profiles").upsert(payload);

  if (error) {
    redirect(`/provider?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/provider/submitted" as const);
}

export async function updateBookingStatusAction(formData: FormData) {
  const { user } = await requireRole(["provider"]);
  const supabase = await createClient();
  const bookingId = String(formData.get("bookingId") ?? "");
  const status = String(formData.get("status") ?? "");

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, customer_id, appointment_date, issue_description")
    .eq("id", bookingId)
    .eq("provider_id", user.id)
    .single();

  const { error } = await supabase
    .from("bookings")
    .update({
      status
    })
    .eq("id", bookingId)
    .eq("provider_id", user.id);

  if (error) {
    redirect(`/provider?error=${encodeURIComponent(error.message)}`);
  }

  const { data: customerProfile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", booking?.customer_id)
    .single();

  if (customerProfile?.email && booking) {
    await sendNotification({
      to: customerProfile.email,
      subject: `Your booking was ${status === "confirmed" ? "confirmed" : "updated"}`,
      html: `<p>${customerProfile?.full_name ?? "Customer"}, your booking on ${booking.appointment_date} is now ${status}.</p>`,
      text: `${customerProfile?.full_name ?? "Customer"}, your booking on ${booking.appointment_date} is now ${status}.`
    });
  }

  redirect("/provider?success=booking-updated");
}
