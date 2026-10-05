"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function PaymentReturnRefresh() {
  const router = useRouter();

  useEffect(() => {
    let elapsed = 0;

    const interval = window.setInterval(() => {
      elapsed += 2000;
      router.refresh();

      if (elapsed >= 30000) {
        window.clearInterval(interval);
      }
    }, 2000);

    return () => {
      window.clearInterval(interval);
    };
  }, [router]);

  return null;
}
