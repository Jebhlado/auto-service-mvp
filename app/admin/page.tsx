import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateProviderApprovalAction, toggleProviderStatusAction, cancelBookingAction, markBookingResolvedAction } from "@/app/admin/actions";
import { getPendingProviders, getProviders } from "@/app/admin/lib/admin";
import type { BookingRecord, ProfileRecord, ProviderProfileRecord } from "@/lib/types";
import PageSection from "@/components/ui/PageSection";
import KpiGrid from "@/components/ui/layout/KpiGrid";
import { buildDashboardStats } from "@/app/admin/lib/dashboard";
import QuickActionsGrid from "@/components/ui/layout/QuickActionsGrid";
import QuickActionCard from "@/components/ui/QuickActionCard";
import StatTile from "@/components/ui/StatTile";

type AdminPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
    bookingStatus?: string;
    providerSearch?: string;
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  await requireRole(["admin"]);

  const params = await searchParams;

  const bookingStatus =
    params.bookingStatus ?? "all";

  const providerSearch =
    params.providerSearch?.trim() ?? "";

const supabase = await createClient();

const pendingProviders =
  await getPendingProviders();

const allProviders =
  await getProviders(providerSearch);

const { data: allCustomers } = await supabase

  .from("profiles")
  .select("*")
  .eq("role", "customer")
  .returns<ProfileRecord[]>()
  .order("created_at", {
    ascending: false,
  });
    
  let bookingsQuery = supabase
  .from("bookings")
  .select(
    "id, customer_id, provider_id, appointment_date, issue_description, status, created_at, quote_total, customer:profiles(full_name, phone), provider:provider_profiles!bookings_provider_id_fkey(business_name, location)"
  );

if (bookingStatus !== "all") {
  bookingsQuery = bookingsQuery.eq(
    "status",
    bookingStatus
  );
}

const { data: bookings } =
  await bookingsQuery
    .returns<BookingRecord[]>()
    .order("created_at", {
      ascending: false
    });
    const { count: totalCustomers } =
  await supabase
    .from("profiles")
    .select("*", {
      count: "exact",
      head: true
    })
    .eq("role", "customer");

const { count: totalProviders } =
  await supabase
    .from("profiles")
    .select("*", {
      count: "exact",
      head: true
    })
    .eq("role", "provider");

  const stats = buildDashboardStats({
  bookings,
  pendingProviders: pendingProviders.length,
  totalCustomers: totalCustomers ?? 0,
  totalProviders: totalProviders ?? 0,
});

  return (
    <>

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

<PageSection
  title="Quick Actions"
  description="Common administrative tasks."
>
  <QuickActionsGrid>

    <QuickActionCard
      title="Review Providers"
      description="Approve or reject newly registered providers."
      href="/admin/providers"
      actionLabel="Review"
    />

    <QuickActionCard
      title="View Bookings"
      description="Manage all customer bookings."
      href="/admin/bookings"
      actionLabel="Open"
    />

    <QuickActionCard
      title="Manage Customers"
      description="View registered customers."
      href="/admin/customers"
      actionLabel="Open"
    />

    <QuickActionCard
      title="Reports"
      description="Review platform statistics and reports."
      href="/admin/reports"
      actionLabel="View"
    />

  </QuickActionsGrid>
</PageSection>

      <PageSection
  title="Overview"
  description="Key business metrics at a glance."
>

  <KpiGrid>
  <StatTile
  title="Total Customers"
  value={totalCustomers ?? 0}
  href="/admin/customers"
/>

  <StatTile
  title="Total Providers"
  value={totalProviders ?? 0}
  href="/admin/providers"
/>

  <StatTile
  title="Pending Approvals"
  value={stats.pendingApprovals}
  href="/admin/providers?status=pending"
/>

  <StatTile
  title="Pending Bookings"
  value={stats.pendingBookings}
  href="/admin/bookings?status=pending"
/>

  <StatTile
  title="Completed Jobs"
  value={stats.completedJobs}
  href="/admin/bookings?status=completed"
/>

  <StatTile
  title="Platform Revenue"
  value={`R${stats.platformRevenue}`}
/>
  
  <StatTile
  title="Pending Bookings"
  value={stats.pendingBookings}
  href="/admin/bookings?status=pending"
/>

<StatTile
  title="Confirmed Bookings"
  value={stats.confirmedBookings}
  href="/admin/bookings?status=confirmed"
/>

<StatTile
  title="In Progress"
  value={stats.inProgressBookings}
  href="/admin/bookings?status=in_progress"
/>

<StatTile
  title="Rejected Bookings"
  value={stats.rejectedBookings}
  href="/admin/bookings?status=rejected"
/>

<StatTile
  title="Closed Jobs"
  value={stats.closedBookings}
  href="/admin/bookings?status=closed"
/>

</KpiGrid>
</PageSection>

<div className="dashboard-grid">
  
        <div className="card stack-md">
  <div className="split-row">
    <div className="eyebrow">
      All Providers
    </div>

    <form method="GET" className="inline-actions">
      <input
        type="text"
        name="providerSearch"
        placeholder="Search providers..."
        defaultValue={providerSearch}
      />

      <button
        type="submit"
        className="button-secondary"
      >
        Search
      </button>
    </form>
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
        </div>

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
    R{revenue}
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

        <div className="card stack-md">
          <div className="split-row">
  <div className="eyebrow">
    All bookings
  </div>

  <div className="card stack-md">
  <div className="eyebrow">
    All Customers
  </div>

  {allCustomers?.length ? (
    allCustomers.map((customer) => {
      const customerBookings =
        bookings?.filter(
          (booking) =>
            booking.customer_id === customer.id
        ) ?? [];

      const totalBookings =
        customerBookings.length;

      const completedBookings =
        customerBookings.filter(
          (booking) =>
            booking.status === "closed"
        ).length;

      const cancelledBookings =
        customerBookings.filter(
          (booking) =>
            booking.status === "cancelled"
        ).length;

      return (
        <article
          key={customer.id}
          className="card stack-sm"
        >
          <strong>
            {customer.full_name}
          </strong>

          <span>
            {customer.email}
          </span>

          <span>
            {customer.phone ??
              "No phone number"}
          </span>

          <p>
            <strong>Member Since:</strong>{" "}
            {new Date(
              customer.created_at
            ).toLocaleDateString()}
          </p>

          <div className="dashboard-grid">
            <div className="card">
              <strong>
                {totalBookings}
              </strong>
              <p>Total Bookings</p>
            </div>

            <div className="card">
              <strong>
                {completedBookings}
              </strong>
              <p>Completed</p>
            </div>

            <div className="card">
              <strong>
                {cancelledBookings}
              </strong>
              <p>Cancelled</p>
            </div>
          </div>
        </article>
      );
    })
  ) : (
    <p className="muted">
      No customers found.
    </p>
  )}
</div>

  <form method="GET" className="inline-actions">
  <select
    name="bookingStatus"
    defaultValue={bookingStatus}
  >
    <option value="all">
      All
    </option>

    <option value="pending">
      Pending
    </option>

    <option value="confirmed">
      Confirmed
    </option>

    <option value="in_progress">
      In Progress
    </option>

    <option value="closed">
      Closed
    </option>

    <option value="cancelled">
      Cancelled
    </option>

    <option value="rejected">
      Rejected
    </option>
  </select>

  <button
    type="submit"
    className="button-secondary"
  >
    Filter
  </button>
</form>
</div>
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
                <p>
  <strong>Issue:</strong>
  <br />
  {booking.issue_description}
</p>

<p>
  <strong>Service Preference:</strong>{" "}
  {booking.service_preference === "provider_to_me"
    ? "Provider comes to customer"
    : booking.service_preference === "i_will_visit"
    ? "Customer visits workshop"
    : "Not specified"}
</p>

{booking.attachment_url ? (
  <p>
    <strong>Attachment:</strong>{" "}
    <a
      href={booking.attachment_url}
      target="_blank"
      rel="noopener noreferrer"
    >
      View Attachment
    </a>
  </p>
) : null}

<div className="inline-actions">
  <form action={cancelBookingAction}>
    <input
      type="hidden"
      name="bookingId"
      value={booking.id}
    />

    <button
      type="submit"
      className="button-secondary"
    >
      Cancel Booking
    </button>
  </form>

  <form action={markBookingResolvedAction}>
    <input
      type="hidden"
      name="bookingId"
      value={booking.id}
    />

    <button
      type="submit"
      className="button-primary"
    >
      Mark Resolved
    </button>
  </form>
</div>

              </article>
            ))
          ) : (
            <p className="muted">No bookings have been created yet.</p>
          )}
          </div>
      </div>
    </>
  );
}
