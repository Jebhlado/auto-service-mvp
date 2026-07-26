"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

type BookingStatusChartProps = {
  completed: number;
  pending: number;
  rejected: number;
};

const COLORS = [
  "#22c55e", // green
  "#f59e0b", // amber
  "#ef4444", // red
];

export default function BookingStatusChart({
  completed,
  pending,
  rejected,
}: BookingStatusChartProps) {
  const data = [
    {
      name: "Completed",
      value: completed,
    },
    {
      name: "Pending",
      value: pending,
    },
    {
      name: "Rejected",
      value: rejected,
    },
  ];

  return (
    <section style={{ marginTop: "2rem" }}>
      <h2>Booking Status Distribution</h2>

      <div
        style={{
          width: "100%",
          height: 360,
          background: "#fff",
          borderRadius: "12px",
          padding: "1rem",
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              outerRadius={120}
              label
            >
              {data.map((_, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index]}
                />
              ))}
            </Pie>

            <Tooltip />

            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}