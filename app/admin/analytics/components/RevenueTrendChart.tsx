"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

type RevenueTrendChartProps = {
  data: {
    month: string;
    revenue: number;
    bookings: number;
  }[];
};

export default function RevenueTrendChart({
  data,
}: RevenueTrendChartProps) {
  return (
    <section style={{ marginTop: "2rem" }}>
      <h2>Revenue Trend</h2>

      <p style={{ marginBottom: "1rem" }}>
        Chart data preview (temporary).
      </p>

      <div
  style={{
    width: "100%",
    height: 320,
    background: "#fff",
    borderRadius: "12px",
    padding: "1rem",
  }}
>
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />

      <XAxis dataKey="month" />

      <YAxis />

      <Tooltip
        formatter={(value: number) => [
          `R ${value.toLocaleString()}`,
          "Revenue",
        ]}
      />

      <Line
        type="monotone"
        dataKey="revenue"
        stroke="#2563eb"
        strokeWidth={3}
        dot={{ r: 5 }}
      />
    </LineChart>
  </ResponsiveContainer>
</div>
    </section>
  );
}