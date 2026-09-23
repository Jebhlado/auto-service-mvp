"use client";

import { useState } from "react";
import { startPayfastCheckout } from "@/app/customer/actions";

type PayFastCheckoutButtonProps = {
  paymentId: string;
};

export function PayFastCheckoutButton({
  paymentId
}: PayFastCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePayment() {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("paymentId", paymentId);

      const checkout = await startPayfastCheckout(formData);

      const form = document.createElement("form");
      form.method = "POST";
      form.action = checkout.action;

      Object.entries(checkout.fields).forEach(
        ([name, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = name;
          input.value = value;
          form.appendChild(input);
        }
      );

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to start payment."
      );
      setIsLoading(false);
    }
  }

  return (
    <div className="stack-sm">
      <button
        type="button"
        className="button-primary"
        onClick={handlePayment}
        disabled={isLoading}
      >
        {isLoading ? "Preparing payment..." : "Pay Now"}
      </button>

      {error ? (
        <p className="muted">{error}</p>
      ) : null}
    </div>
  );
}