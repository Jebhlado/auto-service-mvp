import "server-only";

import { createClient } from "@/lib/supabase/server";

export const PAYMENT_STATUSES = [
  "pending",
  "processing",
  "paid",
  "failed",
  "cancelled",
  "partially_refunded",
  "refunded",
  "disputed",
  "chargeback",
  "chargeback_reversed"
] as const;

export type PaymentStatus =
  (typeof PAYMENT_STATUSES)[number];

type PaymentEventType =
  | "payment_created"
  | "payment_pending"
  | "payment_processing"
  | "payment_completed"
  | "payment_failed"
  | "payment_cancelled"
  | "refund_requested"
  | "refund_completed"
  | "partial_refund_completed"
  | "dispute_opened"
  | "dispute_resolved"
  | "chargeback_opened"
  | "chargeback_reversed"
  | "provider_payout_pending"
  | "provider_payout_completed"
  | "provider_payout_reversed";

const PAYMENT_TRANSITIONS: Record<
  PaymentStatus,
  readonly PaymentStatus[]
> = {
  pending: [
    "processing",
    "cancelled"
  ],

  processing: [
    "paid",
    "failed",
    "cancelled"
  ],

  paid: [
    "partially_refunded",
    "refunded",
    "disputed",
    "chargeback"
  ],

  failed: [
    "processing",
    "cancelled"
  ],

  cancelled: [],

  partially_refunded: [
    "partially_refunded",
    "refunded",
    "disputed",
    "chargeback"
  ],

  refunded: [],

  disputed: [
    "partially_refunded",
    "refunded",
    "chargeback"
  ],

  chargeback: [
    "chargeback_reversed"
  ],

  chargeback_reversed: []
};

const STATUS_EVENT_MAP: Partial<
  Record<PaymentStatus, PaymentEventType>
> = {
  pending: "payment_pending",
  processing: "payment_processing",
  paid: "payment_completed",
  failed: "payment_failed",
  cancelled: "payment_cancelled",
  refunded: "refund_completed",
  partially_refunded: "partial_refund_completed",
  disputed: "dispute_opened",
  chargeback: "chargeback_opened",
  chargeback_reversed: "chargeback_reversed"
};

export function canTransitionPayment(
  from: PaymentStatus,
  to: PaymentStatus
): boolean {
  return PAYMENT_TRANSITIONS[from].includes(to);
}

export function assertPaymentTransition(
  from: PaymentStatus,
  to: PaymentStatus
): void {
  if (!canTransitionPayment(from, to)) {
    throw new Error(
      `Invalid payment transition: ${from} → ${to}`
    );
  }
}

export function getPaymentEventType(
  status: PaymentStatus
): PaymentEventType {
  const eventType = STATUS_EVENT_MAP[status];

  if (!eventType) {
    throw new Error(
      `No payment event type is defined for status: ${status}`
    );
  }

  return eventType;
}


export async function approveQuoteAndCreatePayment(
  bookingId: string
) {
  if (!bookingId) {
    throw new Error("Booking ID is required.");
  }

  const supabase = await createClient();

  const {
    data: {
      user
    }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in.");
  }

  const { data, error } = await supabase.rpc(
    "approve_quote_and_create_payment",
    {
      p_booking_id: bookingId
    }
  );

  if (error || !data) {
    throw new Error(
      error?.message ??
        "Payment could not be created."
    );
  }

  return data;
}