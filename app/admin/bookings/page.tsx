import { getBookings } from "@/app/admin/lib/admin";
import { formatCurrency } from "@/lib/formats";
import PanelHeader from "@/components/ui/PanelHeader";
import StatTile from "@/components/ui/StatTile";

export default async function BookingsPage() {
  const bookings = await getBookings();

  const totalBookings = bookings.length;

const pendingBookings = bookings.filter(
  (booking) => booking.status === "pending"
).length;

const confirmedBookings = bookings.filter(
  (booking) => booking.status === "confirmed"
).length;

const completedBookings = bookings.filter(
  (booking) => booking.status === "closed"
).length;

const rejectedBookings = bookings.filter(
  (booking) => booking.status === "rejected"
).length;

const totalRevenue = bookings.reduce(
  (sum, booking) => sum + (booking.quote_total ?? 0),
  0
);

  return (
    <>
      <PanelHeader
  eyebrow="Bookings"
  title="Booking Management"
  description="View all customer bookings."
/>

      <div className="dashboard-grid">

  <StatTile
  title="Total Bookings"
  value={totalBookings}
/>

  <div className="card">
    <strong>{pendingBookings}</strong>
    <p>Pending</p>
  </div>

  <div className="card">
    <strong>{confirmedBookings}</strong>
    <p>Confirmed</p>
  </div>

  <div className="card">
    <strong>{completedBookings}</strong>
    <p>Completed</p>
  </div>

  <div className="card">
    <strong>{rejectedBookings}</strong>
    <p>Rejected</p>
  </div>

  <div className="card">
    <strong>{formatCurrency(totalRevenue)}</strong>
    <p>Total Revenue</p>
  </div>

</div>

      <div className="card stack-md">
        <div className="eyebrow">
          All Bookings ({bookings.length})
        </div>

        {bookings.length ? (
          bookings.map((booking) => (
            <article
              key={booking.id}
              className="card stack-sm"
            >
              <strong>
                {booking.customer?.full_name ??
                  "Unknown Customer"}
              </strong>

              <span>
                {booking.provider?.business_name ??
                  "Unknown Provider"}
              </span>

              <span>
                {new Date(
                  booking.appointment_date
                ).toLocaleDateString()}
              </span>

              <span>Status: {booking.status}</span>

              <span>
              Quote: {formatCurrency(booking.quote_total ?? 0)}
             </span>
            </article>
          ))
        ) : (
          <p className="muted">
            No bookings found.
          </p>
        )}
      </div>
    </>
  );
}