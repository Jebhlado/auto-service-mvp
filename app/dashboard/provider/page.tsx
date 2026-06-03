import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { updateBookingStatusAction } from "@/app/provider/actions";

export default async function ProviderDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      *,
      customer:profiles!bookings_customer_id_fkey (
        full_name,
        phone
      )
    `)
    .eq("provider_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <div className="eyebrow">
            Provider Dashboard
          </div>

          <h1>Your Booking Requests</h1>

          <p className="muted">
            Manage incoming customer requests and update booking status.
          </p>
        </div>
      </div>

      <div className="card stack-md">
        {bookings?.length ? (
          bookings.map((booking) => (
            <article
              key={booking.id}
              className="card stack-sm"
            >
              <div className="split-row">
                <strong>
                  {booking.customer?.full_name ??
                    "Customer"}
                </strong>

                <span
                  className={`status-chip ${
                    booking.status === "confirmed"
                      ? "status-confirmed"
                      : booking.status === "rejected"
                      ? "status-rejected"
                      : "status-pending"
                  }`}
                >
                  {booking.status}
                </span>
              </div>

              <span>
                Phone:{" "}
                {booking.customer?.phone ??
                  "Not provided"}
              </span>

              <span>
                Appointment Date:{" "}
                {booking.appointment_date}
              </span>

              <p>
                {booking.issue_description}
              </p>

              {booking.status === "pending" ? (
                <div className="inline-actions">
                  <form
                    action={
                      updateBookingStatusAction
                    }
                  >
                    <input
                      type="hidden"
                      name="bookingId"
                      value={booking.id}
                    />

                    <input
                      type="hidden"
                      name="status"
                      value="confirmed"
                    />

                    <button
                      type="submit"
                      className="button-primary"
                    >
                      Accept Booking
                    </button>
                  </form>

                  <form
                    action={
                      updateBookingStatusAction
                    }
                  >
                    <input
                      type="hidden"
                      name="bookingId"
                      value={booking.id}
                    />

                    <input
                      type="hidden"
                      name="status"
                      value="rejected"
                    />

                    <button
                      type="submit"
                      className="button-secondary"
                    >
                      Reject Booking
                    </button>
                  </form>
                </div>
              ) : null}
            </article>
          ))
        ) : (
          <p className="muted">
            No booking requests yet.
          </p>
        )}
      </div>
    </section>
  );
}