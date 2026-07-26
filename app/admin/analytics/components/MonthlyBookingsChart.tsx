"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

type MonthlyBookingsChartProps = {
  data: {
    month: string;
    revenue: number;
    bookings: number;
  }[];
};

export default function MonthlyBookingsChart({
  data,
}: MonthlyBookingsChartProps) {
  return (
    <section style={{ marginTop: "2rem" }}>
      <h2>Monthly Bookings</h2>

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
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="month" />

            <YAxis allowDecimals={false} />

            <Tooltip />

            <Bar
              dataKey="bookings"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}