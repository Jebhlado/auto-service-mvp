import {getPendingProviders,getProviders,} from "@/app/admin/lib/admin";
import { createClient } from "@/lib/supabase/server";
import {updateProviderApprovalAction,toggleProviderStatusAction,} from "@/app/admin/actions";
import { formatCurrency } from "@/lib/formats";

export default async function ProvidersPage() {
  const supabase = await createClient();

const pendingProviders =
  await getPendingProviders();

const allProviders =
  await getProviders();

const { data: bookings } = await supabase
  .from("bookings")
  .select("*");

  return (
    <>
      <div className="section-heading">
        <div>
          <div className="eyebrow">Providers</div>

          <h2>Provider Management</h2>

          <p className="muted">
            Manage provider approvals and providers.
          </p>
        </div>
      </div>

      {pendingProviders?.length ? (
            pendingProviders.map((provider) => (
              <article key={provider.user_id} className="card stack-sm">
                <strong>{provider.business_name}</strong>

                <p>
                  <strong>Owner:</strong>{" "}
                  {provider.profiles?.full_name}
                </p>

                <p>
                  <strong>Location:</strong>{" "}
                  {provider.location || "No location added yet"}
                </p>

                <p>
                  <strong>Email:</strong>{" "}
                  {provider.contact_email}
                </p>

                <p>
                  <strong>Phone:</strong>{" "}
                  {provider.contact_phone}
                </p>

                <p>
                  <strong>Submitted:</strong>{" "}
                  {new Date(
                    provider.created_at
                  ).toLocaleDateString()}
                </p>

                <p>
                  <strong>Bio:</strong>
                  <br />
                  {provider.bio || "No provider bio yet."}
                </p>
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

      <div className="card stack-md">
        <div className="eyebrow">All Providers</div>

        {allProviders?.length ? (
          allProviders.map((provider) => {
            const providerBookings =
              bookings?.filter(
                (booking) =>
                  booking.provider_id === provider.user_id
              ) ?? [];

            const totalBookings =
              providerBookings.length;

            const completedJobs =
              providerBookings.filter(
                (booking) =>
                  booking.status === "closed"
              ).length;

            const revenue =
              providerBookings.reduce(
                (sum, booking) =>
                  sum + (booking.quote_total ?? 0),
                0
              );

            return (
              <article
                key={provider.user_id}
                className="card stack-sm"
              >
                <strong>
                  {provider.business_name}
                </strong>

                <span className="muted">
                  {provider.profiles?.full_name}
                </span>

                <span>
                  {provider.location || "No location"}
                </span>

                <span>
                  {provider.contact_email}
                </span>

                <span>
                  {provider.contact_phone}
                </span>

                <div className="card">
                  <strong>
                    {totalBookings}
                  </strong>
                  <p>Total Bookings</p>
                </div>

                <div className="card">
                  <strong>
                    {completedJobs}
                  </strong>
                  <p>Completed Jobs</p>
                </div>

                <div className="card">
                <strong>
                  {formatCurrency(revenue)}
                </strong>
                <p>Revenue</p>
              </div>

                <div className="pill-list">
                  <span
                    className={`status-chip ${
                      provider.approval_status === "approved"
                        ? "status-confirmed"
                        : provider.approval_status === "rejected"
                        ? "status-rejected"
                        : "status-pending"
                    }`}
                  >
                    {provider.approval_status.toUpperCase()}
                  </span>

                  <span
                    className={`status-chip ${
                      provider.is_active
                        ? "status-confirmed"
                        : "status-rejected"
                    }`}
                  >
                    {provider.is_active
                      ? "ACTIVE"
                      : "DISABLED"}
                  </span>
                </div>

                <form action={toggleProviderStatusAction}>
                  <input
                    type="hidden"
                    name="providerId"
                    value={provider.user_id}
                  />

                  <input
                    type="hidden"
                    name="isActive"
                    value={String(provider.is_active)}
                  />

                  <button
                    type="submit"
                    className="button-secondary"
                  >
                    {provider.is_active
                      ? "Disable Provider"
                      : "Enable Provider"}
                  </button>
                </form>
              </article>
            );
          })
        ) : (
          <p className="muted">
            No providers found.
          </p>
        )}
      </div>
    </>
  );
}