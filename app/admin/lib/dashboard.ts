import type { BookingRecord } from "@/lib/types";

export type DashboardStats = {
  totalCustomers: number;
  totalProviders: number;
  pendingApprovals: number;

  activeBookings: number;
  completedJobs: number;

  pendingBookings: number;
  confirmedBookings: number;
  inProgressBookings: number;
  rejectedBookings: number;
  closedBookings: number;

  platformRevenue: number;
};

type DashboardStatsInput = {
  bookings: BookingRecord[] | null;
  pendingProviders: number;
  totalCustomers: number;
  totalProviders: number;
};

export function buildDashboardStats({
  bookings,
  pendingProviders,
  totalCustomers,
  totalProviders,
}: DashboardStatsInput): DashboardStats {
  const safeBookings = bookings ?? [];

  const platformRevenue = safeBookings.reduce(
  (sum, booking) => sum + (booking.quote_total ?? 0),
  0
);

  return {
    totalCustomers,

    totalProviders,

    pendingApprovals: pendingProviders,

    activeBookings: safeBookings.filter(
  (booking) =>
    booking.status === "confirmed" ||
    booking.status === "in_progress"
).length,

completedJobs: safeBookings.filter(
  (booking) => booking.status === "completed"
).length,

pendingBookings: safeBookings.filter(
  (booking) => booking.status === "pending"
).length,

confirmedBookings: safeBookings.filter(
  (booking) => booking.status === "confirmed"
).length,

inProgressBookings: safeBookings.filter(
  (booking) => booking.status === "in_progress"
).length,

rejectedBookings: safeBookings.filter(
  (booking) => booking.status === "rejected"
).length,

closedBookings: safeBookings.filter(
  (booking) => booking.status === "closed"
).length,

    platformRevenue,
  };
}