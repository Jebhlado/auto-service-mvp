import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateProviderApprovalAction } from "@/app/admin/actions";
import type { BookingRecord, ProviderProfileRecord } from "@/lib/types";

type AdminPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  await requireRole(["admin"]);
  const params = await searchParams;
  const supabase = await createClient();

  const { data: pendingProviders } = await supabase
    .from("provider_profiles")
    .select("*, profiles(full_name)")
    .eq("approval_status", "pending")
    .returns<ProviderProfileRecord[]>()
    .order("created_at", { ascending: false });

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, customer_id, provider_id, appointment_date, issue_description, status, created_at, customer:profiles!bookings_customer_id_fkey(full_name, phone), provider:provider_profiles!bookings_provider_id_fkey(business_name, location)")
    .returns<BookingRecord[]>()
    .order("created_at", { ascending: false });

  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <div className="eyebrow">Admin</div>
          <h1>Approvals and booking oversight</h1>
        </div>
      </div>

      {params.error ? (
        <div className="card">
          <strong>Admin action failed</strong>
          <p className="muted">{params.error}</p>
        </div>
      ) : null}

      {params.success ? (
        <div className="card">
          <strong>Admin action completed</strong>
          <p className="muted">The platform data has been updated.</p>
        </div>
      ) : null}

      <div className="dashboard-grid">
        <div className="card stack-md">
          <div className="eyebrow">Pending provider approvals</div>
          {pendingProviders?.length ? (
            pendingProviders.map((provider) => (
              <article key={provider.user_id} className="card stack-sm">
                <strong>{provider.business_name}</strong>
                <span className="muted">{provider.profiles?.full_name}</span>
                <span>{provider.location || "No location added yet"}</span>
                <span>{provider.contact_email}</span>
                <span>{provider.contact_phone}</span>
                <p>{provider.bio || "No provider bio yet."}</p>
                <div className="pill-list">
                  {provider.services.map((item) => (
                    <span key={item} className="pill">
                      {item}
                    </span>
                  ))}
                </div>
                <div className="inline-actions">
                  <form action={updateProviderApprovalAction}>
                    <input type="hidden" name="providerId" value={provider.user_id} />
                    <input type="hidden" name="status" value="approved" />
                    <button className="button-primary" type="submit">
                      Approve
                    </button>
                  </form>
                  <form action={updateProviderApprovalAction}>
                    <input type="hidden" name="providerId" value={provider.user_id} />
                    <input type="hidden" name="status" value="rejected" />
                    <button className="button-secondary" type="submit">
                      Reject
                    </button>
                  </form>
                </div>
              </article>
            ))
          ) : (
            <p className="muted">No providers waiting for approval.</p>
          )}
        </div>

        <div className="card stack-md">
          <div className="eyebrow">All bookings</div>
          {bookings?.length ? (
            bookings.map((booking) => (
              <article key={booking.id} className="card stack-sm">
                <div className="split-row">
                  <strong>{booking.provider?.business_name ?? "Provider"}</strong>
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
                <span>Customer: {booking.customer?.full_name ?? "Unknown customer"}</span>
                <span>Appointment: {booking.appointment_date}</span>
                <span>Location: {booking.provider?.location ?? "Not specified"}</span>
                <p>{booking.issue_description}</p>
              </article>
            ))
          ) : (
            <p className="muted">No bookings have been created yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
