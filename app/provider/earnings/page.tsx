import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type EarningsPayment = {
  id: string;
  booking_id: string;
  amount: number | string;
  currency: string | null;
  status: string;
  created_at: string;
  payfast_payment_id: string | null;
  platform_fee_percent: number | string | null;
  platform_fee: number | string | null;
  provider_amount: number | string | null;
  fee_snapshot_source: string | null;
  booking:
    | {
        id: string;
        issue_description: string | null;
        appointment_date: string | null;
      }
    | {
        id: string;
        issue_description: string | null;
        appointment_date: string | null;
      }[]
    | null;
};

const money = (value: number) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const amountOf = (value: number | string | null | undefined) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const PAID_STATUSES = new Set(["paid"]);
const EXCLUDED_STATUSES = new Set([
  "pending",
  "processing",
  "failed",
  "cancelled",
  "refunded",
  "partially_refunded",
  "disputed",
  "chargeback",
  "chargeback_reversed",
]);

function bookingFor(payment: EarningsPayment) {
  return Array.isArray(payment.booking) ? payment.booking[0] ?? null : payment.booking;
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function ProviderEarningsPage() {
  const { user } = await requireRole(["provider"]);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("payments")
    .select(
      "id, booking_id, amount, currency, status, created_at, payfast_payment_id, platform_fee_percent, platform_fee, provider_amount, fee_snapshot_source, booking:bookings(id, issue_description, appointment_date)"
    )
    .eq("provider_id", user.id)
    .order("created_at", { ascending: false });

  const payments = (data ?? []) as unknown as EarningsPayment[];
  const paidPayments = payments.filter((payment) => PAID_STATUSES.has(payment.status));

  const grossPaid = paidPayments.reduce((sum, payment) => sum + amountOf(payment.amount), 0);
  const platformFees = paidPayments.reduce(
    (sum, payment) => sum + amountOf(payment.platform_fee),
    0,
  );
  const providerEarnings = paidPayments.reduce(
    (sum, payment) => sum + amountOf(payment.provider_amount),
    0,
  );
  const awaitingPayments = payments.filter(
    (payment) => payment.status === "pending" || payment.status === "processing",
  );
  const attentionPayments = payments.filter(
    (payment) =>
      payment.status === "refunded" ||
      payment.status === "partially_refunded" ||
      payment.status === "disputed" ||
      payment.status === "chargeback",
  );
  const hasEstimatedFees = paidPayments.some(
    (payment) => payment.fee_snapshot_source === "estimated_legacy",
  );

  return (
    <section className="section stack-md">
      <div className="section-heading">
        <div>
          <div className="eyebrow">Provider workspace</div>
          <h1>Earnings &amp; payments</h1>
          <p className="muted">
            Track confirmed PayFast payments, the platform fee, and your recorded share.
          </p>
        </div>
        <Link href="/provider" className="button-secondary">
          Back to dashboard
        </Link>
      </div>

      {error ? (
        <div className="card">
          <strong>Payment history could not be loaded</strong>
          <p className="muted">
            {error.message}. Check that the Provider Earnings SQL migration has been applied and that the provider can read their payment rows.
          </p>
        </div>
      ) : null}

      <div className="card-grid">
        <article className="card">
          <p className="muted">Gross payments received</p>
          <strong>{money(grossPaid)}</strong>
          <p className="muted">{paidPayments.length} paid transaction(s)</p>
        </article>
        <article className="card">
          <p className="muted">Platform fees</p>
          <strong>{money(platformFees)}</strong>
          <p className="muted">Fee share on paid transactions</p>
        </article>
        <article className="card">
          <p className="muted">Your recorded earnings</p>
          <strong>{money(providerEarnings)}</strong>
          <p className="muted">Provider share after platform fees</p>
        </article>
        <article className="card">
          <p className="muted">Awaiting payment</p>
          <strong>{money(awaitingPayments.reduce((sum, payment) => sum + amountOf(payment.amount), 0))}</strong>
          <p className="muted">{awaitingPayments.length} transaction(s) not yet paid</p>
        </article>
      </div>

      {hasEstimatedFees ? (
        <div className="card">
          <strong>Some historical fee values are estimates</strong>
          <p className="muted">
            Older transactions did not store the fee rate used at checkout. They were backfilled using the configured rate at migration time; new payments will keep their own fee snapshot.
          </p>
        </div>
      ) : null}

      {attentionPayments.length ? (
        <div className="card">
          <strong>Transactions needing attention</strong>
          <p className="muted">
            {attentionPayments.length} refunded, partially refunded, disputed or chargeback transaction(s) are excluded from the paid earnings totals. Review these against your PayFast account before treating the figures as final settlement.
          </p>
        </div>
      ) : null}

      <div className="card stack-md">
        <div>
          <h2>Transaction history</h2>
          <p className="muted">
            Only transactions with status Paid contribute to the three received-payment totals above. Pending, failed, refunded and disputed transactions are not counted as paid earnings.
          </p>
        </div>

        {payments.length ? (
          <div className="stack-md">
            {payments.map((payment) => {
              const booking = bookingFor(payment);
              const gross = amountOf(payment.amount);
              const fee = amountOf(payment.platform_fee_amount);
              const providerShare = amountOf(payment.provider_amount);
              const isPaid = PAID_STATUSES.has(payment.status);
              const isEstimated = payment.fee_snapshot_source === "estimated_legacy";

              return (
                <article key={payment.id} className="card stack-sm">
                  <div className="split-row">
                    <strong>{booking?.issue_description?.trim() || "Automotive service booking"}</strong>
                    <span className={`status-chip ${isPaid ? "status-approved" : "status-pending"}`}>
                      {statusLabel(payment.status)}
                    </span>
                  </div>
                  <p className="muted">
                    Booking: {payment.booking_id}
                    {booking?.appointment_date ? ` · Appointment ${booking.appointment_date}` : ""}
                  </p>
                  <p className="muted">
                    Recorded: {new Date(payment.created_at).toLocaleString("en-ZA", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                  <div className="card-grid">
                    <div>
                      <span className="muted">Gross</span>
                      <p><strong>{money(gross)}</strong></p>
                    </div>
                    <div>
                      <span className="muted">Platform fee {payment.platform_fee_percent != null ? `(${amountOf(payment.platform_fee_percent)}%)` : ""}</span>
                      <p><strong>{money(fee)}</strong></p>
                    </div>
                    <div>
                      <span className="muted">Provider share</span>
                      <p><strong>{money(providerShare)}</strong></p>
                    </div>
                  </div>
                  {isEstimated ? (
                    <p className="muted">Fee breakdown estimated from the configured rate at migration time.</p>
                  ) : null}
                  {payment.payfast_payment_id ? (
                    <p className="muted">PayFast reference: {payment.payfast_payment_id}</p>
                  ) : null}
                  {!isPaid && EXCLUDED_STATUSES.has(payment.status) ? (
                    <p className="muted">This transaction is excluded from received-payment totals while its status is {statusLabel(payment.status).toLowerCase()}.</p>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <p className="muted">
            No payment transactions are available yet. Once a customer approves a quote and a payment record is created, it will appear here.
          </p>
        )}
      </div>
    </section>
  );
}
