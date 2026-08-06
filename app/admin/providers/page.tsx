import {getPendingProviders,getProviders,} from "@/app/admin/lib/admin";
import { createClient } from "@/lib/supabase/server";
import {updateProviderApprovalAction,toggleProviderStatusAction,} from "@/app/admin/actions";
import { formatCurrency } from "@/lib/formats";

type ProvidersPageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

export default async function ProvidersPage({
  searchParams,
}: ProvidersPageProps) {
  const params = await searchParams;
  const selectedStatus = params.status ?? "all";
  const supabase = await createClient();
  const pendingProviders = await getPendingProviders();
  const allProviders = await getProviders();
  const filteredProviders =
    selectedStatus === "all"
      ? allProviders
      : allProviders.filter(
          (provider) => provider.approval_status === selectedStatus
        );

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
        {selectedStatus !== "all" && (
  <p className="muted">
    Showing: <strong>{selectedStatus}</strong> providers.
  </p>
)}  
        </div>
      </div>

    </>
  );
}