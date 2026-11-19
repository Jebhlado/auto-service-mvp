import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendNotification } from "@/lib/notifications";
import { createNotification } from "@/lib/create-notification";
import { redirect } from "next/navigation";
import { getPlatformSettings } from "@/lib/platform-settings";

export async function POST(request: Request) {
  const formData = await request.formData();
  const bookingId = String(formData.get("bookingId") ?? "");

  const settings = await getPlatformSettings();
  if (!settings.booking_rules.customer_cancellation_enabled) {
    redirect("/customer?error=customer-cancellation-disabled");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: booking } = await supabase
  .from("bookings")
  .select("id, customer_id, provider_id, status")
  .eq("id", bookingId)
  .eq("customer_id", user.id)
  .in("status", ["pending", "confirmed"])
  .single();

  if (!booking) {
    redirect("/customer?error=booking-cannot-be-cancelled");
  }

  const { data: updatedBooking, error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .eq("customer_id", user.id)
    .in("status", ["pending", "confirmed"])
    .select("id")
    .maybeSingle();

  if (error || !updatedBooking) {
    redirect(
      `/customer?error=${encodeURIComponent(
        error?.message ?? "Booking cannot be cancelled from its current status."
      )}`
    );
  }

  await createNotification(
    booking.provider_id,
    "Booking cancelled",
    "A customer cancelled their appointment. Review the booking in your dashboard.",
    "booking_updates"
  );

  const adminClient = createAdminClient();

const { data: provider } = await adminClient
  .from("provider_profiles")
  .select("contact_email")
  .eq("user_id", booking.provider_id)
  .maybeSingle();

if (provider?.contact_email) {
  await sendNotification({
    to: provider.contact_email,
    subject: "Booking cancelled",
    html: "<p>A customer has cancelled their appointment.</p>",
    text: "A customer cancelled their appointment."
  }, "booking_updates");
}

  redirect("/customer?success=booking-cancelled");
}
