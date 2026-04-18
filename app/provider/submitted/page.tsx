import Link from "next/link";

export default async function ProviderSubmittedPage() {
  return (
    <section className="section">
      <div className="card stack-md success-panel">
        <div className="eyebrow">Submission received</div>
        <h1 style={{ margin: 0 }}>Thank you. Your provider profile has been sent for admin review.</h1>
        <p className="muted">
          We saved your details successfully. Your profile will stay hidden from customer search until an admin
          approves it.
        </p>
        <div className="booking-steps">
          <div className="step">
            <strong>What happens next</strong>
            <p className="muted">An admin reviews your service type, contact details, and Gauteng location.</p>
          </div>
          <div className="step">
            <strong>When you are approved</strong>
            <p className="muted">Customers will be able to find you in search and send booking requests.</p>
          </div>
        </div>
        <div className="inline-actions">
          <Link href="/provider" className="button-primary">
            Back to dashboard
          </Link>
          <Link href="/" className="button-secondary">
            Return home
          </Link>
        </div>
      </div>
    </section>
  );
}
