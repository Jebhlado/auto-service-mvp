"use server";

import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type ReviewRecord = {
  id: string;
  booking_id: string;
  customer_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
};

type BookingSummary = {
  id: string;
  issue_description: string | null;
  appointment_date: string | null;
};

type CustomerSummary = {
  id: string;
  full_name: string | null;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function ProviderReviewsPage() {
  const { user } = await requireRole(["provider"]);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reviews")
    .select("id, booking_id, customer_id, rating, review_text, created_at")
    .eq("provider_id", user.id)
    .order("created_at", { ascending: false });

  const reviews = (data ?? []) as ReviewRecord[];
  const bookingIds = [...new Set(reviews.map((review) => review.booking_id))];
  const customerIds = [...new Set(reviews.map((review) => review.customer_id))];

  const [{ data: bookings }, { data: customers }] = await Promise.all([
    bookingIds.length
      ? supabase
          .from("bookings")
          .select("id, issue_description, appointment_date")
          .in("id", bookingIds)
      : Promise.resolve({ data: [] as BookingSummary[] }),
    customerIds.length
      ? supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", customerIds)
      : Promise.resolve({ data: [] as CustomerSummary[] }),
  ]);

  const bookingList = (bookings ?? []) as BookingSummary[];
  const customerList = (customers ?? []) as CustomerSummary[];
  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
    : 0;
  const ratingCounts = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((review) => Number(review.rating) === rating).length,
  }));

  return (
    <section className="section stack-md">
      <div className="section-heading">
        <div>
          <div className="eyebrow">Provider workspace</div>
          <h1>Customer reviews</h1>
          <p className="muted">Read feedback customers have left for your completed work.</p>
        </div>
        <Link href="/provider" className="button-secondary">Back to dashboard</Link>
      </div>

      {error ? (
        <div className="card">
          <strong>Reviews could not be loaded</strong>
          <p className="muted">{error.message}</p>
        </div>
      ) : null}

      <div className="card-grid">
        <article className="card">
          <p className="muted">Average rating</p>
          <strong>★ {averageRating.toFixed(1)} / 5</strong>
          <p className="muted">Across {reviews.length} review(s)</p>
        </article>
        <article className="card">
          <p className="muted">Total reviews</p>
          <strong>{reviews.length}</strong>
          <p className="muted">Customer feedback received</p>
        </article>
        <article className="card">
          <p className="muted">5-star reviews</p>
          <strong>{ratingCounts[0].count}</strong>
          <p className="muted">Top-rated customer experiences</p>
        </article>
      </div>

      <div className="card stack-md">
        <div>
          <h2>Rating breakdown</h2>
          <p className="muted">See how your reviews are distributed across the five-star scale.</p>
        </div>
        <div className="stack-sm">
          {ratingCounts.map(({ rating, count }) => {
            const percentage = reviews.length ? (count / reviews.length) * 100 : 0;
            return (
              <div key={rating} className="stack-sm">
                <div className="split-row">
                  <span>{rating} {rating === 1 ? "star" : "stars"}</span>
                  <span className="muted">{count} ({Math.round(percentage)}%)</span>
                </div>
                <div
                  aria-label={`${rating} star reviews: ${count} of ${reviews.length}`}
                  role="img"
                  style={{ height: "8px", borderRadius: "999px", background: "var(--border, #e5e7eb)", overflow: "hidden" }}
                >
                  <div style={{ height: "100%", width: `${percentage}%`, background: "var(--accent, #8b5cf6)", borderRadius: "999px" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card stack-md">
        <div>
          <h2>Review history</h2>
          <p className="muted">Most recent feedback appears first. Reviews are shown as submitted by customers.</p>
        </div>
        {reviews.length ? (
          <div className="stack-md">
            {reviews.map((review) => {
              const booking = bookingList.find((item) => item.id === review.booking_id);
              const customer = customerList.find((item) => item.id === review.customer_id);
              const rating = Math.max(0, Math.min(5, Number(review.rating) || 0));
              return (
                <article key={review.id} className="card stack-sm">
                  <div className="split-row">
                    <strong>{customer?.full_name?.trim() || "Customer"}</strong>
                    <span className="muted">{formatDate(review.created_at)}</span>
                  </div>
                  <div className="split-row">
                    <span aria-label={`${rating} out of 5 stars`} style={{ color: "#d97706", letterSpacing: "2px" }}>
                      {"★".repeat(rating)}{"☆".repeat(5 - rating)}
                    </span>
                    <strong>{rating} / 5</strong>
                  </div>
                  <p className="muted">
                    {booking?.issue_description?.trim() || "Automotive service booking"}
                    {booking?.appointment_date ? ` · Appointment ${booking.appointment_date}` : ""}
                  </p>
                  {review.review_text?.trim() ? (
                    <p>{review.review_text}</p>
                  ) : (
                    <p className="muted">The customer left a rating without written feedback.</p>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <strong>No customer reviews yet</strong>
            <p className="muted">When customers review a closed booking, their rating and feedback will appear here.</p>
          </div>
        )}
      </div>
    </section>
  );
}
