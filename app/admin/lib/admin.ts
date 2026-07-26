import { createClient } from "@/lib/supabase/server";
import type {
  BookingRecord,
  ProfileRecord,
  ProviderProfileRecord,
} from "@/lib/types";

/**
 * Provider queries
 */

export async function getPendingProviders() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("provider_profiles")
    .select("*, profiles(full_name)")
    .eq("approval_status", "pending")
    .returns<ProviderProfileRecord[]>()
    .order("created_at", {
      ascending: false,
    });

  return data ?? [];
}

export async function getProviders(search = "") {
  const supabase = await createClient();

  let query = supabase
    .from("provider_profiles")
    .select("*, profiles(full_name)");

  if (search.trim()) {
    query = query.or(
      `business_name.ilike.%${search}%,location.ilike.%${search}%`
    );
  }

  const { data } = await query
    .returns<ProviderProfileRecord[]>()
    .order("created_at", {
      ascending: false,
    });

  return data ?? [];
}

/**
 * Customer queries
 */

export async function getCustomers(search = "") {
  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select("*")
    .eq("role", "customer");

  if (search.trim()) {
    query = query.or(
      `full_name.ilike.%${search}%,email.ilike.%${search}%`
    );
  }

  const { data } = await query
    .returns<ProfileRecord[]>()
    .order("created_at", {
      ascending: false,
    });

  return data ?? [];
}

/**
 * Booking queries
 */

export async function getBookings() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      *,
      customer:profiles!bookings_customer_id_fkey (
        full_name,
        phone,
        email
      ),
      provider:provider_profiles!bookings_provider_id_fkey (
        business_name,
        location
      )
    `)
    .returns<BookingRecord[]>()
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error("Error loading bookings:", error);
    return [];
  }

  return data ?? [];
}

export async function getAnalyticsSummary() {
  const supabase = await createClient();

  // Total Revenue
  const { data: revenueBookings } = await supabase
    .from("bookings")
    .select("quote_total")
    .eq("status", "closed");

  const totalRevenue =
    revenueBookings?.reduce(
      (sum, booking) => sum + (booking.quote_total ?? 0),
      0
    ) ?? 0;

  // Total Bookings
  const { count: totalBookings } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true });

  // Completed Jobs
  const { count: completedJobs } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("status", "closed");

  // Customers
  const { count: customers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "customer");

  // Providers
  const { count: providers } = await supabase
    .from("provider_profiles")
    .select("*", { count: "exact", head: true });

    const { count: pendingJobs } = await supabase
  .from("bookings")
  .select("*", { count: "exact", head: true })
  .eq("status", "pending");

  const { count: rejectedJobs } = await supabase
  .from("bookings")
  .select("*", { count: "exact", head: true })
  .eq("status", "rejected");

  const highestBooking =
  revenueBookings?.reduce((highest, booking) => {
    return (booking.quote_total ?? 0) > (highest.quote_total ?? 0)
      ? booking
      : highest;
  }, revenueBookings[0]) ?? null;

  const { data: completedBookings } = await supabase
  .from("bookings")
  .select(`
    quote_total,
    appointment_date,
    provider:provider_profiles!bookings_provider_id_fkey (
      business_name
    )
  `)
  .eq("status", "closed");

  const providerStats = new Map<
  string,
  {
    completedJobs: number;
    revenue: number;
  }
>();

completedBookings?.forEach((booking: any) => {
  const provider = booking.provider?.business_name ?? "Unknown";

  if (!providerStats.has(provider)) {
    providerStats.set(provider, {
      completedJobs: 0,
      revenue: 0,
    });
  }

  const stats = providerStats.get(provider)!;

  stats.completedJobs += 1;
  stats.revenue += booking.quote_total ?? 0;
});

let topProvider = {
  name: "N/A",
  completedJobs: 0,
  revenue: 0,
};

providerStats.forEach((stats, name) => {
  if (stats.completedJobs > topProvider.completedJobs) {
    topProvider = {
      name,
      completedJobs: stats.completedJobs,
      revenue: stats.revenue,
    };
  }
});

const providerLeaderboard = Array.from(providerStats.entries())
  .map(([name, stats]) => ({
    name,
    completedJobs: stats.completedJobs,
    revenue: stats.revenue,
  }))
  .sort((a, b) => b.revenue - a.revenue);

const monthlyRevenueMap = new Map<
  string,
  {
    revenue: number;
    bookings: number;
  }
>();

const now = new Date();

const currentMonth = now.getMonth();
const currentYear = now.getFullYear();

const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
const previousMonthYear =
  currentMonth === 0 ? currentYear - 1 : currentYear;

let revenueThisMonth = 0;
let revenueLastMonth = 0;

let bookingsThisMonth = 0;
let bookingsLastMonth = 0;

completedBookings?.forEach((booking: any) => {
  const bookingDate = new Date(booking.appointment_date);

  const month = bookingDate.getMonth();
  const year = bookingDate.getFullYear();

  const monthKey = bookingDate.toLocaleString("default", {
  month: "short",
  year: "numeric",
});

if (!monthlyRevenueMap.has(monthKey)) {
  monthlyRevenueMap.set(monthKey, {
    revenue: 0,
    bookings: 0,
  });
}

const monthlyStats = monthlyRevenueMap.get(monthKey)!;

monthlyStats.revenue += booking.quote_total ?? 0;
monthlyStats.bookings++;

  if (month === currentMonth && year === currentYear) {
    bookingsThisMonth++;
    revenueThisMonth += booking.quote_total ?? 0;
  }

  if (month === previousMonth && year === previousMonthYear) {
    bookingsLastMonth++;
    revenueLastMonth += booking.quote_total ?? 0;
  }
});

const revenueGrowth =
  revenueLastMonth > 0
    ? Math.round(
        ((revenueThisMonth - revenueLastMonth) /
          revenueLastMonth) *
          100
      )
    : 0;

const bookingGrowth =
  bookingsLastMonth > 0
    ? Math.round(
        ((bookingsThisMonth - bookingsLastMonth) /
          bookingsLastMonth) *
          100
      )
    : 0;

    const monthlyRevenue = Array.from(monthlyRevenueMap.entries())
  .map(([month, stats]) => ({
    month,
    revenue: stats.revenue,
    bookings: stats.bookings,
  }))
  .sort((a, b) => {
    return (
      new Date(a.month).getTime() -
      new Date(b.month).getTime()
    );
  });

  const completionRate =
    totalBookings && totalBookings > 0
      ? Math.round((completedJobs! / totalBookings) * 100)
      : 0;

  const averageBookingValue =
    completedJobs && completedJobs > 0
      ? totalRevenue / completedJobs
      : 0;

  return {
    totalRevenue,
    totalBookings: totalBookings ?? 0,
    completedJobs: completedJobs ?? 0,
    customers: customers ?? 0,
    providers: providers ?? 0,
    averageBookingValue,
    pendingJobs: pendingJobs ?? 0,
    rejectedJobs: rejectedJobs ?? 0,
    completionRate,
    highestBookingValue: highestBooking?.quote_total ?? 0,
    
    monthlyRevenue,

    revenueThisMonth,
    revenueLastMonth,

    bookingsThisMonth,
    bookingsLastMonth,

    revenueGrowth,
    bookingGrowth,

    providerLeaderboard,
    
    topProvider,
  };
}
