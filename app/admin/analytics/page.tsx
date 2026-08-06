import { getAnalyticsSummary, getRecentActivity } from "@/app/admin/lib/admin";

import RevenueTrendChart from "./components/RevenueTrendChart";
import BookingStatusChart from "./components/BookingStatusChart";
import MonthlyBookingsChart from "./components/MonthlyBookingsChart";
import TopProvidersLeaderboard from "./components/TopProvidersLeaderboard";
import RecentActivityFeed from "./components/RecentActivityFeed";
import StatTile from "@/components/ui/StatTile";
import PageSection from "@/components/ui/PageSection";
import PanelHeader from "@/components/ui/PanelHeader";

export default async function AnalyticsPage() {
  const analytics = await getAnalyticsSummary();
  const recentActivity = await getRecentActivity();

  return (
    <>
      <PanelHeader
  eyebrow="Reports"
  title="Reports & Analytics"
  description="Monitor business performance, revenue, trends and operational insights."
/>

      <div className="dashboard-grid">

  <StatTile
    title="Total Revenue"
    value={`R ${analytics.totalRevenue.toLocaleString()}`}
    href="/admin/bookings?status=closed"
  />

  <StatTile
    title="Total Bookings"
    value={analytics.totalBookings}
    href="/admin/bookings"
  />

  <StatTile
    title="Completed Jobs"
    value={analytics.completedJobs}
    href="/admin/bookings?status=completed"
  />

  <StatTile
    title="Customers"
    value={analytics.customers}
    href="/admin/customers"
  />

  <StatTile
    title="Providers"
    value={analytics.providers}
    href="/admin/providers"
  />

  <StatTile
  title="Average Booking Value"
  value={`R ${analytics.averageBookingValue.toLocaleString()}`}
  href="/admin/bookings?status=completed"
/>

</div>

<PageSection
title="Business Insights"
description="Quick insights into business performance."
>

  <div className="dashboard-grid">

  <StatTile
  title="Completion Rate"
  value={`${analytics.completionRate}%`}
/>

    <StatTile
  title="Highest Booking"
  value={`R ${analytics.highestBookingValue.toLocaleString()}`}
/>

    <StatTile
  title="Pending Jobs"
  value={analytics.pendingJobs}
  href="/admin/bookings?status=pending"
/>

    <StatTile
  title="Rejected Jobs"
  value={analytics.rejectedJobs}
  href="/admin/bookings?status=rejected"
/>

</div>

</PageSection>

<PageSection
  title="Monthly Trends"
  description="Compare this month's performance with the previous month."
>
  <div className="dashboard-grid">

  <StatTile
  title="Revenue This Month"
  value={`R ${analytics.revenueThisMonth.toLocaleString()}`}
/>

<StatTile
  title="Revenue Last Month"
  value={`R ${analytics.revenueLastMonth.toLocaleString()}`}
/>

    <StatTile
  title="Bookings This Month"
  value={analytics.bookingsThisMonth}
/>

    <StatTile
  title="Bookings Last Month"
  value={analytics.bookingsLastMonth}
/>

    <StatTile
  title="Revenue Growth"
  value={`${analytics.revenueGrowth}%`}
/>

    <StatTile
  title="Booking Growth"
  value={`${analytics.bookingGrowth}%`}
/>

</div>

</PageSection>

    <PageSection
  title="Provider Performance"
  description="Performance overview of the leading service provider."
>

  <div className="dashboard-grid">

  <StatTile
    title="Top Provider"
    value={analytics.topProvider.name}
  />

  <StatTile
    title="Completed Jobs"
    value={analytics.topProvider.completedJobs}
  />

  <StatTile
    title="Revenue Generated"
    value={`R ${analytics.topProvider.revenue.toLocaleString()}`}
  />

  <StatTile
    title="Average Quote"
    value={
      analytics.topProvider.completedJobs > 0
        ? `R ${(
            analytics.topProvider.revenue /
            analytics.topProvider.completedJobs
          ).toLocaleString()}`
        : "R 0"
    }
  />

</div>
</PageSection>

<RevenueTrendChart
  data={analytics.monthlyRevenue}
/>

<BookingStatusChart
  completed={analytics.completedJobs}
  pending={analytics.pendingJobs}
  rejected={analytics.rejectedJobs}
/>

<MonthlyBookingsChart
  data={analytics.monthlyRevenue}
/>

<RecentActivityFeed
  activities={recentActivity}
/>

<TopProvidersLeaderboard
  providers={analytics.providerLeaderboard}
/>

</>
);
}