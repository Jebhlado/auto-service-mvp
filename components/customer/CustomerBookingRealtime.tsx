"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type CustomerBookingRealtimeProps = {
  customerId: string;
};

export function CustomerBookingRealtime({
  customerId
}: CustomerBookingRealtimeProps) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let isActive = true;

    const channel = supabase
      .channel(`customer-bookings-${customerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `customer_id=eq.${customerId}`
        },
        (payload) => {
          console.info("Customer booking realtime event received:", payload.eventType);
          router.refresh();
        }
      )
      .subscribe((status, error) => {
        // Keep this diagnostic visible while we verify the preview deployment.
        console.info("Customer booking realtime status:", status);
        if (error) {
          console.warn("Customer booking realtime error:", error.message);
        }
      });

    // Fallback for environments where Postgres Changes is connected but
    // events are not delivered (for example, due to Realtime/RLS configuration).
    // This also ensures the dashboard eventually reflects the saved DB state.
    const refreshInterval = window.setInterval(() => {
      if (isActive) {
        router.refresh();
      }
    }, 10000);

    return () => {
      isActive = false;
      window.clearInterval(refreshInterval);
      void supabase.removeChannel(channel);
    };
  }, [customerId, router]);

  return null;
}
