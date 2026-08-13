"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendNotification } from "@/lib/notifications";

export async function updateProviderApprovalAction(formData: FormData) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const providerId = String(formData.get("providerId") ?? "");
  const status = String(formData.get("status") ?? "");

  const { data: provider } = await supabase
    .from("provider_profiles")
    .select("business_name, contact_email")
    .eq("user_id", providerId)
    .single();

  const { error } = await supabase
    .from("provider_profiles")
    .update({
  approval_status: status,
  is_active: status === "approved",
  approved_at:
    status === "approved"
      ? new Date().toISOString()
      : null
})
    .eq("user_id", providerId);

  if (error) {
    redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }

  if (provider?.contact_email) {
    await sendNotification({
      to: provider.contact_email,
      subject: `Provider profile ${status}`,
      html: `<p>Your provider profile for ${provider.business_name} is now ${status}.</p>`,
      text: `Your provider profile for ${provider.business_name} is now ${status}.`
    });
  }

  redirect("/admin?success=provider-updated");
}

export async function toggleProviderStatusAction(
  formData: FormData
) {
  await requireRole(["admin"]);

  const supabase = await createClient();

  const providerId = String(
    formData.get("providerId") ?? ""
  );

  const isActive =
    String(formData.get("isActive")) ===
    "true";

  const { error } = await supabase
    .from("provider_profiles")
    .update({
      is_active: !isActive
    })
    .eq("user_id", providerId);

  if (error) {
    redirect(
      `/admin?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  redirect(
    "/admin?success=provider-status-updated"
  );
}

export async function cancelBookingAction(
  formData: FormData
) {
  await requireRole(["admin"]);

  const supabase = await createClient();

  const bookingId = String(
    formData.get("bookingId") ?? ""
  );

  const { error } = await supabase
    .from("bookings")
    .update({
      status: "cancelled"
    })
    .eq("id", bookingId);

  if (error) {
    redirect(
      `/admin?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  redirect(
    "/admin?success=booking-cancelled"
  );
}

export async function confirmBookingAction(
  formData: FormData
) {
  await requireRole(["admin"]);

  const supabase = await createClient();

  const bookingId = String(
    formData.get("bookingId") ?? ""
  );

  const { error } = await supabase
    .from("bookings")
    .update({
      status: "confirmed",
    })
    .eq("id", bookingId);

  if (error) {
    redirect(
      `/admin?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  redirect(
    `/admin/bookings/${bookingId}?success=booking-confirmed`
  );
}

export async function startBookingAction(
  formData: FormData
) {
  await requireRole(["admin"]);

  const supabase = await createClient();

  const bookingId = String(
    formData.get("bookingId") ?? ""
  );

  const { error } = await supabase
    .from("bookings")
    .update({
      status: "in_progress",
    })
    .eq("id", bookingId);

  if (error) {
    redirect(
      `/admin?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  redirect(
    `/admin/bookings/${bookingId}?success=booking-started`
  );
}

export async function completeBookingAction(
  formData: FormData
) {
  await requireRole(["admin"]);

  const supabase = await createClient();

  const bookingId = String(
    formData.get("bookingId") ?? ""
  );

  const { error } = await supabase
    .from("bookings")
    .update({
      status: "completed",
    })
    .eq("id", bookingId);

  if (error) {
    redirect(
      `/admin?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  redirect(
    `/admin/bookings/${bookingId}?success=booking-completed`
  );
}

export async function markBookingResolvedAction(
  formData: FormData
) {
  await requireRole(["admin"]);

  const supabase = await createClient();

  const bookingId = String(
    formData.get("bookingId") ?? ""
  );

  const { error } = await supabase
    .from("bookings")
    .update({
      status: "closed"
    })
    .eq("id", bookingId);

  if (error) {
    redirect(
      `/admin?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  redirect(
  `/admin/bookings/${bookingId}?success=booking-resolved`
);
}


