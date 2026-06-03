import Link from "next/link";

export default function ProviderSubmittedPage() {
  return (
    <section className="section">
      <div className="card stack-md success-panel">
        <div className="eyebrow">
          Provider Profile Submitted
        </div>

        <h1 style={{ margin: 0 }}>
          Your application has been received
        </h1>

        <p className="muted">
          Thank you for registering as a service provider.
          Your profile has been submitted successfully and is
          currently awaiting admin approval.
        </p>

        <div className="booking-steps">
          <div className="step">
            <strong>Profile Review</strong>

            <p className="muted">
              Our team will verify your business
              information, services, contact details,
              and operating location.
            </p>
          </div>

          <div className="step">
            <strong>Approval Process</strong>

            <p className="muted">
              Once approved, your profile will become
              visible to customers searching for
              automotive services.
            </p>
          </div>

          <div className="step">
            <strong>Start Receiving Bookings</strong>

            <p className="muted">
              Approved providers can receive booking
              requests, manage appointments, and grow
              their customer base through the platform.
            </p>
          </div>
        </div>

        <div className="card">
          <strong>Status:</strong>
          <p className="muted">
            Awaiting admin approval.
          </p>
        </div>

        <div className="inline-actions">
         <Link
  href="/dashboard/provider"
  className="button-primary"
>
           Go to Provider Dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}