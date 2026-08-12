import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProviderPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // ✅ CHECK USER FIRST (VERY IMPORTANT)
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth?next=/providers/${id}`);
  }

  // ✅ NOW SAFE TO FETCH BOOKINGS
  let bookings: any[] = [];

  const { data: bookingData } = await supabase
    .from("bookings")
    .select(`
      id,
      appointment_date,
      issue_description,
      status,
      provider_id,
      provider:provider_profiles (
        business_name,
        location,
        contact_email
      )
    `)
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  bookings = bookingData ?? [];

  // 👉 you can now use bookings below in your UI

  return (
    <section className="section">
      <h1>Provider Page</h1>

      <div className="card">
        {bookings.length ? (
          bookings.map((booking) => (
            <div key={booking.id} className="card">
              <strong>{booking.provider?.business_name}</strong>
              <p>{booking.issue_description}</p>
              <span>{booking.appointment_date}</span>
            </div>
          ))
        ) : (
          <p>No bookings yet.</p>
        )}
      </div>
    </section>
  );
}