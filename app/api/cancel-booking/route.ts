import { createClient } from "@/lib/supabase/server";
import { sendNotification } from "@/lib/notifications";
import { redirect } from "next/navigation";

export async function POST(request: Request) {
  const formData = await request.formData();
  const bookingId = String(formData.get("bookingId"));

  const supabase = await createClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select(`
      id,
      provider:provider_profiles (
        contact_email,
        business_name
      )
    `)
    .eq("id", bookingId)
    .single();

  if (!booking) {
    redirect("/customer");
  }

  // Update status
  await supabase
    .from("bookings")
    .update({ status: "rejected" })
    .eq("id", bookingId);

  // Notify provider
  if (booking.provider?.contact_email) {
    await sendNotification({
      to: booking.provider.contact_email,
      subject: "Booking cancelled",
      html: `<p>A customer has cancelled their appointment.</p>`,
      text: "A customer cancelled their appointment."
    });
  }

  redirect("/customer");
}