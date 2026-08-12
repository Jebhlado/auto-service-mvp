import { Suspense } from "react";
import { ProviderDashboardClient } from "@/components/provider-dashboard-client";

export default function ProviderPage() {
  return (
    <Suspense fallback={<div className="card">Loading provider dashboard...</div>}>
      <ProviderDashboardClient />
    </Suspense>
  );
}