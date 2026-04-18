<section className="section">
  <div className="section-heading">
    <div>
      <div className="eyebrow">Your bookings</div>
      <h1>Track your requests</h1>
      <p className="muted">
        See the status of your booking requests and wait for provider confirmation.
      </p>
    </div>
  </div>

  <div className="card stack-md">
    {bookings.length ? (
      bookings.map((booking) => (
        <article key={booking.id} className="card stack-sm">
          <div className="split-row">
            <strong>
              {booking.provider?.business_name ?? "Service provider"}
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

          <span>Date: {booking.appointment_date}</span>
          <span>
            Location: {booking.provider?.location ?? "Not specified"}
          </span>

          <p>{booking.issue_description}</p>

          {booking.status === "pending" && (
            <span className="muted">
              Waiting for provider response
            </span>
          )}
        </article>
      ))
    ) : (
      <p className="muted">
        You have no bookings yet. Start by browsing providers and sending a request.
      </p>
    )}
  </div>
</section>