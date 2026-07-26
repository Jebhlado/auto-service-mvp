type Provider = {
  name: string;
  completedJobs: number;
  revenue: number;
};

type TopProvidersLeaderboardProps = {
  providers: Provider[];
};

export default function TopProvidersLeaderboard({
  providers,
}: TopProvidersLeaderboardProps) {
  return (
    <section style={{ marginTop: "2rem" }}>
      <h2>🏆 Top Providers Leaderboard</h2>

      <div className="dashboard-grid">
        {providers.map((provider, index) => (
          <div
            key={provider.name}
            className="card"
          >
            <h3>
            {index === 0 && "🥇 "}
            {index === 1 && "🥈 "}
            {index === 2 && "🥉 "}
            {provider.name}
            </h3>

            <p>
              <strong>Completed Jobs:</strong>{" "}
              {provider.completedJobs}
            </p>

            <p>
              <strong>Revenue:</strong>{" "}
              R {provider.revenue.toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}