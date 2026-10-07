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

    const channel = supabase
      .channel(`customer-bookings-${customerId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bookings",
          filter: `customer_id=eq.${customerId}`
        },
        () => {
          router.refresh();
        }
      )
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") {
          console.warn(
            "Customer booking realtime status:",
            status
          );
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [customerId, router]);

  return null;
}