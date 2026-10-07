"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type PaymentReturnRefreshProps = {
  bookingId?: string;
};

export function PaymentReturnRefresh({
  bookingId
}: PaymentReturnRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    let elapsed = 0;

    const scrollToBooking = () => {
      if (!bookingId) {
        return;
      }

      const bookingElement = document.getElementById(
        `booking-${bookingId}`
      );

      bookingElement?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    };

    scrollToBooking();

    const interval = window.setInterval(() => {
      elapsed += 2000;

      router.refresh();

      window.setTimeout(scrollToBooking, 100);

      if (elapsed >= 30000) {
        window.clearInterval(interval);
      }
    }, 2000);

    return () => {
      window.clearInterval(interval);
    };
  }, [bookingId, router]);

  return null;
}