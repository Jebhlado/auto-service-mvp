import { Suspense } from "react";
import { ProviderDashboardClient } from "@/components/provider-dashboard-client";
import { getPlatformSettings } from "@/lib/platform-settings";

export default async function ProviderPage() {
  const settings = await getPlatformSettings();
  return (
    <Suspense fallback={<div className="card">Loading provider dashboard...</div>}>
      <ProviderDashboardClient serviceCategories={settings.provider_management.service_categories} />
    </Suspense>
  );
}