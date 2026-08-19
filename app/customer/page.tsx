import {
  updateQuoteStatus,
  confirmCompletedJob,
  createReview
} from "./actions";

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatServices } from "@/lib/utils";
import { getBookingAttachmentUrl } from "@/lib/attachments";
import type { ProviderProfileRecord } from "@/lib/types";

type CustomerPageProps = {
  searchParams: Promise<{
    location?: string;
    service?: string;
    success?: string;
  }>;
};

export default async function CustomerPage({ searchParams }: CustomerPageProps) {
  const params = await searchParams;
  const location = params.location?.trim() ?? "";
  const service = params.service?.trim() ?? "";
  const supabase = await createClient();
  const {
  data: {
    user
  }
} = await supabase.auth.getUser();

let customerBookings = [];

if (user) {
  const { data } = await supabase
    .from("bookings")
    .select(`
      *,
      provider:provider_profiles(
        business_name,
        location,
        contact_phone
      )
    `)
    .eq("customer_id", user.id)
    .order("created_at", {
      ascending: false
    });

  customerBookings = data ?? [];
}

  let query = supabase
  .from("provider_profiles")
  .select("*, profiles(full_name)")
  .eq("approval_status", "approved")
  .eq("is_active", true);

  if (location) {
    query = query.ilike("location", `%${location}%`);
  }

  if (service) {
    query = query.contains("services", [service]);
  }

  const { data } = await query.order("updated_at", { ascending: false });
  const providers = (data ?? []) as ProviderProfileRecord[];

  const { data: reviews } = user
  ? await supabase
      .from("reviews")
      .select(
        "booking_id, rating, review_text, created_at"
      )
      .eq("customer_id", user.id)
  : { data: [] };

const reviewByBookingId = new Map(
  (reviews ?? []).map((review) => [
    review.booking_id,
    review
  ])
);

const bookingsWithAttachments = await Promise.all(
  customerBookings.map(async (booking) => ({
    ...booking,
    attachmentUrl: booking.attachment_url
      ? await getBookingAttachmentUrl(booking.id)
      : null
  }))
);

customerBookings = bookingsWithAttachments;

  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <div className="eyebrow">Customer search</div>
          <h1>Find approved service providers</h1>
          <p className="muted">Search by location and service type, then book in a clean three-step flow.</p>
        </div>
      </div>

      {params.success ? (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <strong>Booking request sent</strong>
          <p className="muted">Your appointment was created with a pending status and is waiting for provider review.</p>
        </div>
      ) : null}

      {/* CUSTOMER SECTION (TOP) */}
<section className="section">
  <div className="section-heading">
    <div>
      <div className="eyebrow">Customer</div>
      <h2>Your dashboard</h2>
      <p className="muted">
        Manage your bookings and view updates from providers.
      </p>
    </div>
  </div>

  {/* DASHBOARD STATS */}
  <div className="card-grid">
    <div className="card">
      <strong>{customerBookings.length}</strong>
      <p>Total Bookings</p>
    </div>

    <div className="card">
      <strong>
        {
          customerBookings.filter(
            (b) => b.status === "pending"
          ).length
        }
      </strong>
      <p>Pending</p>
    </div>

    <div className="card">
      <strong>
        {
          customerBookings.filter(
            (b) => b.status === "confirmed"
          ).length
        }
      </strong>
      <p>Confirmed</p>
    </div>

    <div className="card">
      <strong>
        {
          customerBookings.filter(
            (b) => b.status === "rejected"
          ).length
        }
      </strong>
      <p>Rejected</p>
    </div>
  </div>

  <div className="card stack-md">
  <strong>Your Bookings</strong>

  {customerBookings.length ? (
    customerBookings.map((booking) => (
      <article
        key={booking.id}
        className="card stack-sm"
      >
        <div className="split-row">
          <strong>
            {booking.provider?.business_name ?? "Provider"}
          </strong>

          <span
            className={`status-chip ${
              booking.status === "confirmed"
                ? "status-confirmed"
                : booking.status === "rejected"
                ? "status-rejected"
                : "status-pending"
            }`}
          >
            {booking.status}
          </span>
        </div>

        <span>
          Date: {booking.appointment_date}
        </span>

        <span>
          Location:{" "}
          {booking.provider?.location ?? "Not specified"}
        </span>

        <p>
          <strong>Issue:</strong>{" "}
          {booking.issue_description}
        </p>

        <p>
          <strong>Service Preference:</strong>{" "}
          {booking.service_preference === "provider_to_me"
            ? "Provider comes to me"
            : booking.service_preference === "i_will_visit"
            ? "I will visit provider"
            : "Not specified"}
        </p>

        {booking.provider_notes ? (
          <div className="card">
            <strong>Provider Notes:</strong>
            <p>{booking.provider_notes}</p>
          </div>
        ) : null}

        {booking.quote_status === "quote_sent" ? (
  <div className="card">
    <strong>Quote Received</strong>

    <p>
      <strong>Service Price:</strong>{" "}
      R{booking.quote_service_price ?? 0}
    </p>

    {(booking.quote_callout_fee ?? 0) > 0 ? (
      <p>
        <strong>Call-out Fee:</strong>{" "}
        R{booking.quote_callout_fee ?? 0}
      </p>
    ) : (
      <p>
        <strong>Call-out Fee:</strong> R0
      </p>
    )}

    <p>
      <strong>Total:</strong>{" "}
      R{booking.quote_total ?? 0}
    </p>

    {booking.quote_estimated_time ? (
      <p>
        <strong>Estimated Time:</strong>{" "}
        {booking.quote_estimated_time}
      </p>
    ) : null}

    {booking.quote_warranty ? (
      <p>
        <strong>Warranty:</strong>{" "}
        {booking.quote_warranty}
      </p>
    ) : null}

    <p>
      <strong>Notes:</strong>{" "}
      {booking.quote_notes ?? "None"}
    </p>

    <form action={updateQuoteStatus}>
  <input
    type="hidden"
    name="bookingId"
    value={booking.id}
  />

  <input
    type="hidden"
    name="decision"
    value="approve"
  />

  <button
    type="submit"
    className="button-primary"
  >
    Approve Quote
  </button>
</form>

<form action={updateQuoteStatus}>
  <input
    type="hidden"
    name="bookingId"
    value={booking.id}
  />

  <input
    type="hidden"
    name="decision"
    value="reject"
  />

  <button
    type="submit"
    className="button-secondary"
  >
    Reject Quote
  </button>
</form>
  </div>
) : null}

        {booking.quote_status === "quote_sent" ? (
  <div className="card">
    ...
  </div>
) : null}

{booking.status === "completed" ? (
  <div className="card">
    <strong>
      Provider marked this job complete
    </strong>

    <form action={confirmCompletedJob}>
      <input
        type="hidden"
        name="bookingId"
        value={booking.id}
      />

      <button
        type="submit"
        className="button-primary"
      >
        Confirm Completion
      </button>
    </form>
  </div>
) : null}

{booking.status === "closed" ? (
  (() => {
    const existingReview =
      reviewByBookingId.get(booking.id);

    return existingReview ? (
      <div className="card">
        <strong>Review Submitted</strong>

        <p>
          <strong>Your Rating:</strong>{" "}
          {"★".repeat(existingReview.rating)}
          {"☆".repeat(5 - existingReview.rating)}
        </p>

        {existingReview.review_text ? (
          <p>
            <strong>Your Review:</strong>{" "}
            {existingReview.review_text}
          </p>
        ) : (
          <p className="muted">
            You submitted a rating without written
            feedback.
          </p>
        )}

        <p className="muted">
          Thank you for sharing your experience.
        </p>
      </div>
    ) : (
      <div className="card">
        <strong>Rate Your Experience</strong>

        <form action={createReview}>
          <input
            type="hidden"
            name="bookingId"
            value={booking.id}
          />

          <select
            name="rating"
            required
          >
            <option value="">
              Select Rating
            </option>

            <option value="5">
              ★★★★★
            </option>

            <option value="4">
              ★★★★
            </option>

            <option value="3">
              ★★★
            </option>

            <option value="2">
              ★★
            </option>

            <option value="1">
              ★
            </option>
          </select>

          <textarea
            name="review"
            placeholder="Tell others about your experience..."
          />

          <button
            type="submit"
            className="button-primary"
          >
            Submit Review
          </button>
        </form>
      </div>
    );
  })()
) : null}

{booking.attachmentUrl ? (
  <a
    href={booking.attachmentUrl}
    target="_blank"
    rel="noreferrer"
    className="button-secondary"
  >
    View Attachment
  </a>
) : null}
      </article>
    ))
  ) : (
    <p className="muted">
      No bookings yet.
    </p>
  )}
</div>
</section>

<form className="card form-grid" method="GET">
  {/* LOCATION DROPDOWN */}
  <select name="location" defaultValue={location}>
    <option value="">Select location</option>
    <option value="Johannesburg">Johannesburg</option>
    <option value="Pretoria">Pretoria</option>
    <option value="Soweto">Soweto</option>
    <option value="Midrand">Midrand</option>
    <option value="Centurion">Centurion</option>
    <option value="Alberton">Alberton</option>
    <option value="Benoni">Benoni</option>
    <option value="Boksburg">Boksburg</option>
    <option value="Sandton">Sandton</option>
    <option value="Randburg">Randburg</option>
  </select>

  {/* SERVICE DROPDOWN */}
  <select name="service" defaultValue={service}>
    <option value="">All services</option>
    <option value="Mechanic">Mechanic</option>
    <option value="Auto electrician">Auto Electrician</option>
    <option value="Panel beater">Panel Beater</option>
  </select>

  <button className="button-primary" type="submit">
    Search providers
  </button>
</form>

     <div className="section card-grid">
  {providers?.length ? (
    providers.map((provider) => {

  const providerReviews =
    reviews?.filter(
      (review) =>
        review.provider_id === provider.user_id
    ) ?? [];

  const reviewCount =
    providerReviews.length;

  const averageRating =
    reviewCount > 0
      ? (
          providerReviews.reduce(
            (sum, review) =>
              sum + review.rating,
            0
          ) / reviewCount
        ).toFixed(1)
      : null;

  return (
    <article
      key={provider.user_id}
      className="card stack-sm"
    >
        <div className="split-row">
          <div>
            <div className="eyebrow">Approved provider</div>
            <h3 style={{ margin: "0.3rem 0" }}>{provider.business_name}</h3>
            {averageRating ? (
  <p>
    ⭐ {averageRating}
    {" "}
    ({reviewCount} review
    {reviewCount !== 1 ? "s" : ""})
  </p>
) : (
  <p>No reviews yet</p>
)}
          </div>
          <span className="status-chip status-approved">{provider.approval_status}</span>
        </div>
        <p className="muted">
          {provider.profiles?.full_name} - {provider.location || "Location coming soon"}
        </p>
        <p>{provider.bio || "General automotive service provider ready to take bookings."}</p>
        <div className="pill-list">
          {provider.services.map((serviceItem) => (
            <span className="pill" key={serviceItem}>
              {serviceItem}
            </span>
          ))}
        </div>
        <div className="stack-sm">
          <span>Contact: {provider.contact_phone}</span>
          <span>Email: {provider.contact_email}</span>
          <span>Services: {formatServices(provider.services)}</span>
        </div>
        <Link href={`/providers/${provider.user_id}`} className="button-primary">
          View profile and book
        </Link>
      </article>
    );
  })
  ) : (
    <div className="card">
      <strong>No providers found yet</strong>
      <p className="muted">Try broadening the filters or invite providers to create profiles.</p>
    </div>
  )}
</div>

{/* PROVIDER ACCESS SECTION */}
<section className="section">
  <div className="card stack-md">
    <strong>Please sign in as a provider</strong>
    <p className="muted">
      The provider dashboard uses your current browser session.
    </p>

    <Link href="/auth" className="button-primary">
      Go to sign in
    </Link>
  </div>
</section>
    </section>
  );
}

