import { createClient } from "@/lib/supabase/server";
import { sendNotification } from "@/lib/notifications";
import { redirect } from "next/navigation";

export async function POST(request: Request) {
  const formData = await request.formData();
  const bookingId = String(formData.get("bookingId") ?? "");

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select(`
      id,
      customer_id,
      status,
      provider:provider_profiles (
        contact_email,
        business_name
      )
    `)
    .eq("id", bookingId)
    .eq("customer_id", user.id)
    .in("status", ["pending", "confirmed"])
    .single();

  if (!booking) {
    redirect("/customer?error=booking-cannot-be-cancelled");
  }

  const { data: updatedBooking, error } = await supabase
    .from("bookings")
    .update({ status: "rejected" })
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

  const provider = Array.isArray(booking.provider)
    ? booking.provider[0]
    : booking.provider;

  if (provider?.contact_email) {
    await sendNotification({
      to: provider.contact_email,
      subject: "Booking cancelled",
      html: `<p>A customer has cancelled their appointment.</p>`,
      text: "A customer cancelled their appointment."
    });
  }

  redirect("/customer?success=booking-cancelled");
}
