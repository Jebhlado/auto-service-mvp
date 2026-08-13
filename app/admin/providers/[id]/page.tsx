import Link from "next/link";
import { notFound } from "next/navigation";

import {
  updateProviderApprovalAction,
  toggleProviderStatusAction,
} from "@/app/admin/actions";
import { getProviders } from "@/app/admin/lib/admin";
import PageSection from "@/components/ui/PageSection";
import StatTile from "@/components/ui/StatTile";

type ProviderDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProviderDetailsPage({
  params,
}: ProviderDetailsPageProps) {
  const { id } = await params;

  const providers = await getProviders();

  const provider = providers.find(
    (item) => item.user_id === id
  );

  if (!provider) {
    notFound();
  }

  return (
    <>
      <div className="section-heading">
        <div>
          <div className="eyebrow">Provider</div>

          <h1>
            {provider.business_name ||
              provider.profiles?.full_name ||
              "Provider Details"}
          </h1>

          <p className="muted">
            View provider information, approval status,
            and account details.
          </p>
        </div>
      </div>

      <div className="inline-actions">
        <Link
          href="/admin/providers"
          className="button-secondary"
        >
          ← Back to Providers
        </Link>
      </div>

      <PageSection
        title="Provider Overview"
        description="Current provider account and approval information."
      >
        <div className="dashboard-grid">
          <StatTile
            title="Approval Status"
            value={provider.approval_status.toUpperCase()}
          />

          <StatTile
            title="Account Status"
            value={
              provider.is_active
                ? "ACTIVE"
                : "INACTIVE"
            }
          />

          <StatTile
            title="Provider"
            value={
              provider.profiles?.full_name ??
              "Unknown"
            }
          />

          <StatTile
            title="Location"
            value={
              provider.location ||
              "Not specified"
            }
          />
        </div>
      </PageSection>

      <PageSection
        title="Business Information"
        description="Information supplied by the provider."
      >
        <div className="card stack-sm">
          <div>
            <strong>Business Name</strong>
            <p className="muted">
              {provider.business_name ||
                "Not specified"}
            </p>
          </div>

          <div>
            <strong>Provider Name</strong>
            <p className="muted">
              {provider.profiles?.full_name ??
                "Not available"}
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
            <strong>Location</strong>
            <p className="muted">
              {provider.location ||
                "Not specified"}
            </p>
          </div>

          <div>
            <strong>Bio</strong>
            <p className="muted">
              {provider.bio ||
                "No business description provided."}
            </p>
          </div>
        </div>
      </PageSection>

      <PageSection
        title="Contact Information"
        description="Provider contact details."
      >
        <div className="dashboard-grid">
          <div className="card">
            <strong>Email</strong>
            <p className="muted">
              {provider.contact_email ||
                "No email available"}
            </p>
          </div>

          <div className="card">
            <strong>Phone</strong>
            <p className="muted">
              {provider.contact_phone ||
                "No phone available"}
            </p>
          </div>
        </div>
      </PageSection>

      <PageSection
        title="Application Information"
        description="Provider registration and approval history."
      >
        <div className="card stack-sm">
          <div>
            <strong>Approval Status</strong>
            <p className="muted">
              {provider.approval_status}
            </p>
          </div>

          <div>
            <strong>Approved At</strong>
            <p className="muted">
              {provider.approved_at
                ? new Date(
                    provider.approved_at
                  ).toLocaleString()
                : "Not approved"}
            </p>
          </div>

          <div>
            <strong>Registered</strong>
            <p className="muted">
              {new Date(
                provider.created_at
              ).toLocaleString()}
            </p>
          </div>

          <div>
            <strong>Last Updated</strong>
            <p className="muted">
              {new Date(
                provider.updated_at
              ).toLocaleString()}
            </p>
          </div>
        </div>
      </PageSection>
      <PageSection
  title="Provider Actions"
  description="Manage this provider's approval and availability."
>
  <div className="inline-actions">

    {provider.approval_status === "pending" && (
      <>
        <form action={updateProviderApprovalAction}>
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

        <form action={updateProviderApprovalAction}>
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
            Reject Provider
          </button>
        </form>
      </>
    )}

    {provider.approval_status === "approved" && (
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
            ? "Deactivate Provider"
            : "Activate Provider"}
        </button>
      </form>
    )}

    {provider.approval_status === "rejected" && (
      <form action={updateProviderApprovalAction}>
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
          Re-approve Provider
        </button>
      </form>
    )}

  </div>
</PageSection>
    </>
  );
}
