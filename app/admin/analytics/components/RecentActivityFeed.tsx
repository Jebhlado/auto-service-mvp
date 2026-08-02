type Activity = {
  id: string;
  status: string;
  customer: string;
  provider: string;
  appointmentDate: string;
  createdAt: string;
};

type RecentActivityFeedProps = {
  activities: Activity[];
};

function getStatusDetails(status: string) {
  switch (status) {
    case "closed":
return {
    icon: "🟢",
    title: "Completed",
    background: "#DCFCE7",
    color: "#166534",
  };

    case "pending":
  return {
    icon: "🟡",
    title: "New Booking",
    background: "#FEF3C7",
    color: "#92400E",
  };

    case "confirmed":
  return {
    icon: "🔵",
    title: "Confirmed",
    background: "#DBEAFE",
    color: "#1D4ED8",
  };

    case "rejected":
  return {
    icon: "🔴",
    title: "Rejected",
    background: "#FEE2E2",
    color: "#B91C1C",
  };

    case "cancelled":
  return {
    icon: "⚫",
    title: "Cancelled",
    background: "#E5E7EB",
    color: "#374151",
  };

    case "in_progress":
  return {
    icon: "🟠",
    title: "In Progress",
    background: "#FED7AA",
    color: "#C2410C",
  };

    default:
      return {
        icon: "📌",
        title: status,
      };
  }
}

export default function RecentActivityFeed({
  activities,
}: RecentActivityFeedProps) {
  return (
    <div className="card">
      <h2>🕒 Recent Activity</h2>

      {activities.length === 0 ? (
        <p>No recent activity.</p>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => {
            const status = getStatusDetails(activity.status);

            return (
              <div
                key={activity.id}
                style={{
                  borderBottom: "1px solid #e5e7eb",
                  paddingBottom: "12px",
                }}
              >
                <div
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    background: status.background,
                    color: status.color,
                    padding: "6px 12px",
                    borderRadius: "999px",
                    fontWeight: 600,
                    width: "fit-content",
                    marginBottom: "10px",
                }}
                >
                <span>{status.icon}</span>
                <span>{status.title}</span>
                </div>

                <div
                style={{
                    marginTop: "10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                }}
                >
                <span>👤 {activity.customer}</span>

                <span>🔧 {activity.provider}</span>

                <span>
                    📅{" "}
                    {new Date(activity.appointmentDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    })}
                </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}