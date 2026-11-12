"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  escapeNotificationHtml,
  sendNotification,
} from "@/lib/notifications";

export async function updateProviderApprovalAction(formData: FormData) {
  await requireRole(["admin"]);

  const providerId = String(formData.get("providerId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  const validStatuses = ["pending", "approved", "rejected"] as const;

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(providerId) ||
    !validStatuses.includes(status as (typeof validStatuses)[number])
  ) {
    redirect("/admin?error=invalid-provider-details");
  }

  const supabase = createAdminClient();

  const { data: provider, error: fetchError } = await supabase
    .from("provider_profiles")
    .select("user_id, business_name, contact_email")
    .eq("user_id", providerId)
    .maybeSingle();

  if (fetchError || !provider) {
    redirect("/admin?error=provider-not-found");
  }

  const { data: updatedProvider, error } = await supabase
    .from("provider_profiles")
    .update({
      approval_status: status,
      is_active: status === "approved",
      approved_at:
        status === "approved" ? new Date().toISOString() : null,
    })
    .eq("user_id", providerId)
    .select("user_id")
    .maybeSingle();

  if (error || !updatedProvider) {
    redirect(
      `/admin?error=${encodeURIComponent(
        error?.message ?? "Provider approval could not be updated."
      )}`
    );
  }

  if (provider.contact_email) {
    const businessName = provider.business_name || "your business";
    const safeBusinessName = escapeNotificationHtml(businessName);
    const safeStatus = escapeNotificationHtml(status);

    await sendNotification({
      to: provider.contact_email,
      subject: `Provider profile ${status}`,
      html: `<p>Your provider profile for ${safeBusinessName} is now ${safeStatus}.</p>`,
      text: `Your provider profile for ${businessName} is now ${status}.`,
    });
  }

  redirect("/admin?success=provider-updated");
}


export async function toggleProviderStatusAction(formData: FormData) {
  await requireRole(["admin"]);

  const providerId = String(formData.get("providerId") ?? "").trim();

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(providerId)
  ) {
    redirect("/admin?error=invalid-provider-details");
  }

  const supabase = createAdminClient();

  const { data: provider, error: fetchError } = await supabase
    .from("provider_profiles")
    .select("user_id, approval_status, is_active")
    .eq("user_id", providerId)
    .maybeSingle();

  if (fetchError || !provider) {
    redirect("/admin?error=provider-not-found");
  }

  const nextIsActive = !provider.is_active;

  if (nextIsActive && provider.approval_status !== "approved") {
    redirect("/admin?error=provider-must-be-approved-first");
  }

  const { data: updatedProvider, error } = await supabase
    .from("provider_profiles")
    .update({ is_active: nextIsActive })
    .eq("user_id", providerId)
    .select("user_id")
    .maybeSingle();

  if (error || !updatedProvider) {
    redirect(
      `/admin?error=${encodeURIComponent(
        error?.message ?? "Provider status could not be updated."
      )}`
    );
  }

  redirect("/admin?success=provider-status-updated");
}


export async function cancelBookingAction(
  formData: FormData
) {
  await requireRole(["admin"]);

  const supabase = await createClient();

  const bookingId = String(
    formData.get("bookingId") ?? ""
  );

  const { data: updatedBooking, error } = await supabase
    .from("bookings")
    .update({
      status: "cancelled"
    })
    .eq("id", bookingId)
    .in("status", ["pending", "confirmed"])
    .select("id")
    .maybeSingle();

  if (error || !updatedBooking) {
    redirect(
      `/admin?error=${encodeURIComponent(
        error?.message ?? "Booking cannot be cancelled from its current status."
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

  const { data: updatedBooking, error } = await supabase
    .from("bookings")
    .update({
      status: "confirmed",
    })
    .eq("id", bookingId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error || !updatedBooking) {
    redirect(
      `/admin?error=${encodeURIComponent(
        error?.message ?? "Booking cannot be confirmed from its current status."
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

  const { data: updatedBooking, error } = await supabase
    .from("bookings")
    .update({
      status: "in_progress",
    })
    .eq("id", bookingId)
    .eq("status", "confirmed")
    .select("id")
    .maybeSingle();

  if (error || !updatedBooking) {
    redirect(
      `/admin?error=${encodeURIComponent(
        error?.message ?? "Booking cannot be started from its current status."
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

  const { data: updatedBooking, error } = await supabase
    .from("bookings")
    .update({
      status: "completed",
    })
    .eq("id", bookingId)
    .eq("status", "in_progress")
    .select("id")
    .maybeSingle();

  if (error || !updatedBooking) {
    redirect(
      `/admin?error=${encodeURIComponent(
        error?.message ?? "Booking cannot be completed from its current status."
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

  const { data: updatedBooking, error } = await supabase
    .from("bookings")
    .update({
      status: "closed"
    })
    .eq("id", bookingId)
    .eq("status", "completed")
    .select("id")
    .maybeSingle();

  if (error || !updatedBooking) {
    redirect(
      `/admin?error=${encodeURIComponent(
        error?.message ?? "Booking cannot be resolved from its current status."
      )}`
    );
  }

  redirect(
    `/admin/bookings/${bookingId}?success=booking-resolved`
  );
}
