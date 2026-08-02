import { getAnalyticsSummary, getRecentActivity } from "@/app/admin/lib/admin";

import RevenueTrendChart from "./components/RevenueTrendChart";
import BookingStatusChart from "./components/BookingStatusChart";
import MonthlyBookingsChart from "./components/MonthlyBookingsChart";
import TopProvidersLeaderboard from "./components/TopProvidersLeaderboard";
import RecentActivityFeed from "./components/RecentActivityFeed";

export default async function AnalyticsPage() {
  const analytics = await getAnalyticsSummary();
  const recentActivity = await getRecentActivity();

  return (
    <>
      <div className="page-header">
        <span className="page-eyebrow">ADMIN</span>

        <h1>Analytics</h1>

        <p>Business insights and performance metrics.</p>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <strong>R {analytics.totalRevenue.toLocaleString()}</strong>
          <p>Total Revenue</p>
        </div>

        <div className="card">
          <strong>{analytics.totalBookings}</strong>
          <p>Total Bookings</p>
        </div>

        <div className="card">
          <strong>{analytics.completedJobs}</strong>
          <p>Completed Jobs</p>
        </div>

        <div className="card">
          <strong>{analytics.customers}</strong>
          <p>Customers</p>
        </div>

        <div className="card">
          <strong>{analytics.providers}</strong>
          <p>Providers</p>
        </div>

        <div className="card">
          <strong>R {analytics.averageBookingValue.toLocaleString()}</strong>
          <p>Average Booking Value</p>
        </div>
      </div>

      <section style={{ marginTop: "2rem" }}>
  <h2>Business Insights</h2>

  <p style={{ marginBottom: "1rem" }}>
    Quick insights into business performance.
  </p>

  <div className="dashboard-grid">
    <div className="card">
      <strong>{analytics.completionRate}%</strong>
      <p>Completion Rate</p>
    </div>

    <div className="card">
      <strong>
        R {analytics.highestBookingValue.toLocaleString()}
      </strong>
      <p>Highest Booking</p>
    </div>

    <div className="card">
      <strong>{analytics.pendingJobs}</strong>
      <p>Pending Jobs</p>
    </div>

    <div className="card">
      <strong>{analytics.rejectedJobs}</strong>
      <p>Rejected Jobs</p>
    </div>
  </div>
</section>

<section style={{ marginTop: "2rem" }}>
  <h2>Monthly Trends</h2>

  <p style={{ marginBottom: "1rem" }}>
    Compare this month's performance with the previous month.
  </p>

  <div className="dashboard-grid">
    <div className="card">
      <strong>
        R {analytics.revenueThisMonth.toLocaleString()}
      </strong>
      <p>Revenue This Month</p>
    </div>

    <div className="card">
      <strong>
        R {analytics.revenueLastMonth.toLocaleString()}
      </strong>
      <p>Revenue Last Month</p>
    </div>

    <div className="card">
      <strong>{analytics.bookingsThisMonth}</strong>
      <p>Bookings This Month</p>
    </div>

    <div className="card">
      <strong>{analytics.bookingsLastMonth}</strong>
      <p>Bookings Last Month</p>
    </div>

    <div className="card">
      <strong>{analytics.revenueGrowth}%</strong>
      <p>Revenue Growth</p>
    </div>

    <div className="card">
      <strong>{analytics.bookingGrowth}%</strong>
      <p>Booking Growth</p>
    </div>
  </div>
</section>

    <section style={{ marginTop: "2rem" }}>
  <h2>Provider Performance</h2>

  <p style={{ marginBottom: "1rem" }}>
    Performance overview of the leading service provider.
  </p>

  <div className="dashboard-grid">
    <div className="card">
      <strong>{analytics.topProvider.name}</strong>
      <p>Top Provider</p>
    </div>

    <div className="card">
      <strong>{analytics.topProvider.completedJobs}</strong>
      <p>Completed Jobs</p>
    </div>

    <div className="card">
      <strong>
        R {analytics.topProvider.revenue.toLocaleString()}
      </strong>
      <p>Revenue Generated</p>
    </div>

    <div className="card">
      <strong>
        {analytics.topProvider.completedJobs > 0
          ? (
              analytics.topProvider.revenue /
              analytics.topProvider.completedJobs
            ).toLocaleString()
          : 0}
      </strong>

      <p>Average Quote</p>
    </div>
  </div>
</section>

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