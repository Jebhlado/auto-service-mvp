import Link from "next/link";

import {
  getPendingProviders,
  getProviders,
} from "@/app/admin/lib/admin";

import {
  updateProviderApprovalAction,
  toggleProviderStatusAction,
} from "@/app/admin/actions";

import PageSection from "@/components/ui/PageSection";
import StatTile from "@/components/ui/StatTile";

type ProvidersPageProps = {
  searchParams: Promise<{
    status?: string;
    success?: string;
    error?: string;
  }>;
};

export default async function ProvidersPage({
  searchParams,
}: ProvidersPageProps) {
  const params = await searchParams;

  const selectedStatus = params.status ?? "all";

  const pendingProviders = await getPendingProviders();
  const allProviders = await getProviders();

  const approvedProviders = allProviders.filter(
    (provider) => provider.approval_status === "approved"
  );

  const rejectedProviders = allProviders.filter(
    (provider) => provider.approval_status === "rejected"
  );

  const filteredProviders =
    selectedStatus === "all"
      ? allProviders
      : allProviders.filter(
          (provider) =>
            provider.approval_status === selectedStatus
        );

  return (
    <>
      <div className="section-heading">
        <div>
          <div className="eyebrow">Providers</div>

          <h1>Provider Management</h1>

          <p className="muted">
            Review provider applications, manage approval status,
            and control provider availability.
          </p>
        </div>
      </div>

      {params.success ? (
        <div className="card">
          <strong>Provider updated</strong>
          <p className="muted">
            The provider information has been updated successfully.
          </p>
        </div>
      ) : null}

      {params.error ? (
        <div className="card">
          <strong>Provider action failed</strong>
          <p className="muted">{params.error}</p>
        </div>
      ) : null}

      <PageSection
        title="Provider Overview"
        description="Current provider registration and approval status."
      >
        <div className="dashboard-grid">
          <StatTile
            title="Total Providers"
            value={allProviders.length}
          />

          <StatTile
            title="Pending Approval"
            value={pendingProviders.length}
          />

          <StatTile
            title="Approved"
            value={approvedProviders.length}
          />

          <StatTile
            title="Rejected"
            value={rejectedProviders.length}
          />
        </div>
      </PageSection>

      <PageSection
        title="Provider Directory"
        description="Review and manage registered service providers."
      >
        <div className="inline-actions">
          <Link
            href="/admin/providers"
            className={
              selectedStatus === "all"
                ? "button-primary"
                : "button-secondary"
            }
          >
            All
          </Link>

          <Link
            href="/admin/providers?status=pending"
            className={
              selectedStatus === "pending"
                ? "button-primary"
                : "button-secondary"
            }
          >
            Pending
          </Link>

          <Link
            href="/admin/providers?status=approved"
            className={
              selectedStatus === "approved"
                ? "button-primary"
                : "button-secondary"
            }
          >
            Approved
          </Link>

          <Link
            href="/admin/providers?status=rejected"
            className={
              selectedStatus === "rejected"
                ? "button-primary"
                : "button-secondary"
            }
          >
            Rejected
          </Link>
        </div>

        <div className="stack-md">
          {filteredProviders.length ? (
            filteredProviders.map((provider) => (
              <article
                key={provider.user_id}
                className="card stack-sm"
              >
                <div className="section-heading">
                  <div>
                    <div className="eyebrow">
                      {provider.approval_status}
                    </div>

                    <h3>
                      {provider.business_name ||
                        provider.profiles?.full_name ||
                        "Unnamed Provider"}
                    </h3>

                    <p className="muted">
                      Provider:{" "}
                      {provider.profiles?.full_name ??
                        "Unknown"}
                    </p>
                  </div>

                  <div className="inline-actions">
                    <span className="status-chip">
                      {provider.approval_status}
                    </span>

                    <span className="status-chip">
                      {provider.is_active
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="dashboard-grid">
                  <div>
                    <strong>Location</strong>
                    <p className="muted">
                      {provider.location || "Not specified"}
                    </p>
                  </div>

                  <div>
                    <strong>Services</strong>
                    <p className="muted">
                      {provider.services?.length
                        ? provider.services.join(", ")
                        : "No services listed"}
                    </p>
                  </div>

                  <div>
                    <strong>Email</strong>
                    <p className="muted">
                      {provider.contact_email ||
                        "No email available"}
                    </p>
                  </div>

                  <div>
                    <strong>Phone</strong>
                    <p className="muted">
                      {provider.contact_phone ||
                        "No phone available"}
                    </p>
                  </div>
                </div>

                <div className="inline-actions">
                  <Link
                    href={`/admin/providers/${provider.user_id}`}
                    className="button-secondary"
                  >
                    View Provider
                  </Link>

                  {provider.approval_status === "pending" ? (
                    <>
                      <form
                        action={updateProviderApprovalAction}
                      >
                        <input
                          type="hidden"
                          name="providerId"
                          value={provider.user_id}
                        />

                        <input
                          type="hidden"
                          name="status"
                          value="approved"
                        />

                        <button
                          type="submit"
                          className="button-primary"
                        >
                          Approve
                        </button>
                      </form>

                      <form
                        action={updateProviderApprovalAction}
                      >
                        <input
                          type="hidden"
                          name="providerId"
                          value={provider.user_id}
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
                          Reject
                        </button>
                      </form>
                    </>
                  ) : null}

                  {provider.approval_status === "approved" ? (
                    <form
                      action={toggleProviderStatusAction}
                    >
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
                          ? "Deactivate"
                          : "Activate"}
                      </button>
                    </form>
                  ) : null}

                  {provider.approval_status === "rejected" ? (
                    <form
                      action={updateProviderApprovalAction}
                    >
                      <input
                        type="hidden"
                        name="providerId"
                        value={provider.user_id}
                      />

                      <input
                        type="hidden"
                        name="status"
                        value="approved"
                      />

                      <button
                        type="submit"
                        className="button-primary"
                      >
                        Approve Provider
                      </button>
                    </form>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <div className="card">
              <strong>No providers found</strong>

              <p className="muted">
                There are no providers matching the selected
                status.
              </p>
            </div>
          )}
        </div>
      </PageSection>
    </>
  );
}