"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  markJobComplete,
  sendQuoteAction,
  updateBookingStatusAction
} from "@/app/provider/actions";
import { GAUTENG_LOCATIONS, PROVIDER_SPECIALISTS } from "@/lib/provider-options";
import type { BookingRecord, ProfileRecord, ProviderProfileRecord } from "@/lib/types";

type ProviderDashboardState = {
  profile: ProfileRecord | null;
  providerProfile: ProviderProfileRecord | null;
  bookings: ProviderDashboardBooking[];

  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  rejectedBookings: number;

  completedBookings: number;
  totalRevenue: number;
  averageRating: number;
  reviewCount: number;

  notifications: {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
}[];
};

type ProviderDashboardBooking = BookingRecord & {
  attachmentUrl: string | null;
  customer: {
    id: string;
    full_name: string;
    phone: string | null;
    email: string;
  } | null;
};

export function ProviderDashboardClient() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<ProviderDashboardState>({
  profile: null,
  providerProfile: null,
  bookings: [],

  notifications: [],

  totalBookings: 0,
  pendingBookings: 0,
  confirmedBookings: 0,
  rejectedBookings: 0,

  completedBookings: 0,
  totalRevenue: 0,
  averageRating: 0,
  reviewCount: 0
});
  
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [savedNotes, setSavedNotes] =
  useState<Record<string, boolean>>({});

  const [bookingNotes, setBookingNotes] = useState<
  Record<string, string>
  >({});

  const [quoteServicePrice, setQuoteServicePrice] =
  useState<Record<string, string>>({});

  const [quoteCalloutFee, setQuoteCalloutFee] =
  useState<Record<string, string>>({});

  const [quoteEstimatedTime, setQuoteEstimatedTime] =
  useState<Record<string, string>>({});

  const [quoteWarranty, setQuoteWarranty] =
  useState<Record<string, string>>({});

  const [quoteNotes, setQuoteNotes] =
  useState<Record<string, string>>({});

  const onboarding = searchParams.get("onboarding") === "1";
  

  async function loadDashboard() {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
  setState({
    profile: null,
    providerProfile: null,
    bookings: [],

    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    rejectedBookings: 0,

    completedBookings: 0,
    totalRevenue: 0,
    averageRating: 0,
    reviewCount: 0,

    notifications: [],
  });

  setLoading(false);
  return;
}

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<ProfileRecord>();

  if (!profile || profile.role !== "provider") {
  setState({
    profile,
    providerProfile: null,
    bookings: [],

    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    rejectedBookings: 0,

    completedBookings: 0,
    totalRevenue: 0,
    averageRating: 0,
    reviewCount: 0,

    notifications: [],
  });

  setLoading(false);
  return;
}

  const { data: providerProfile } = await supabase
    .from("provider_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single<ProviderProfileRecord>();

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*")
    .eq("provider_id", user.id)
    .order("created_at", { ascending: false });
    
    const { data: notifications } = await supabase
  .from("notifications")
  .select("*")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false });

  if (notifications?.length) {
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);
}

  const customerIds =
  bookings?.map((booking) => booking.customer_id) ?? [];

const { data: customers } = await supabase
  .from("profiles")
  .select("id, full_name, phone, email")
  .in("id", customerIds);

const enrichedBookings = await Promise.all(
  (bookings ?? []).map(async (booking) => {
    let attachmentUrl: string | null = null;

    if (booking.attachment_url) {
      let storagePath = booking.attachment_url.trim();

      const publicMarker =
        "/storage/v1/object/public/booking-attachments/";

      const markerIndex = storagePath.indexOf(publicMarker);

      if (markerIndex !== -1) {
        storagePath = decodeURIComponent(
          storagePath.slice(
            markerIndex + publicMarker.length
          )
        );
      }

      const { data: signedAttachment } =
        await supabase.storage
          .from("booking-attachments")
          .createSignedUrl(storagePath, 60 * 10);

      attachmentUrl =
        signedAttachment?.signedUrl ?? null;
    }

    return {
      ...booking,
      attachmentUrl,
      customer:
        customers?.find(
          (customer) => customer.id === booking.customer_id
        ) ?? null
    };
  })
);


    const totalBookings = enrichedBookings.length;

const pendingBookings =
  enrichedBookings.filter(
    (booking) => booking.status === "pending"
  ).length;

const confirmedBookings =
  enrichedBookings.filter(
    (booking) => booking.status === "confirmed"
  ).length;

const rejectedBookings =
  enrichedBookings.filter(
    (booking) => booking.status === "rejected"
  ).length;
  const completedBookings =
  enrichedBookings.filter(
    (booking) => booking.status === "closed"
  ).length;

const totalRevenue =
  enrichedBookings
    .filter(
      (booking) =>
        booking.status === "closed"
    )
    .reduce(
      (sum, booking) =>
        sum + (booking.quote_total ?? 0),
      0
    );

const { data: reviews } = await supabase
  .from("reviews")
  .select("rating")
  .eq("provider_id", user.id);

const reviewCount =
  reviews?.length ?? 0;

const averageRating =
  reviewCount > 0
    ? Number(
        (
          reviews!.reduce(
            (sum, review) =>
              sum + review.rating,
            0
          ) / reviewCount
        ).toFixed(1)
      )
    : 0;

  setState({
  profile,
  providerProfile: providerProfile ?? null,
  bookings: enrichedBookings,

  notifications: notifications ?? [],

  totalBookings,
  pendingBookings,
  confirmedBookings,
  rejectedBookings,

  completedBookings,
  totalRevenue,
  averageRating,
  reviewCount
});

  setLoading(false);
}
  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleSaveProfile(formData: FormData) {
    const supabase = createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Please log in as a provider first.");
      return;
    }

    const payload = {
      user_id: user.id,
      business_name: String(formData.get("businessName") ?? ""),
      services: [String(formData.get("services") ?? "")],
      location: String(formData.get("location") ?? ""),
      contact_email: String(formData.get("contactEmail") ?? ""),
      contact_phone: String(formData.get("contactPhone") ?? ""),
      bio: String(formData.get("bio") ?? ""),
      approval_status: "pending"
    };

    const { error: saveError } = await supabase.from("provider_profiles").upsert(payload);

    if (saveError) {
      setError(saveError.message);
      setFeedback(null);
      return;
    }

    setError(null);
    setFeedback("Thank you. Your provider profile was saved and sent for admin review.");
    await loadDashboard();
  }

  async function handleBookingNotes(bookingId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("bookings")
    .update({
      provider_notes: bookingNotes[bookingId] ?? ""
    })
    .eq("id", bookingId);

  if (error) {
    setError(error.message);
    return;
  }

  setError(null);
  setFeedback("Provider notes saved successfully.");

  setSavedNotes((current) => ({
    ...current,
    [bookingId]: true
  }));

  await loadDashboard();
}

  async function handleSendQuote(
  bookingId: string
) {
  const servicePrice = Number(
    quoteServicePrice[bookingId] ?? 0
  );

  const calloutFee = Number(
    quoteCalloutFee[bookingId] ?? 0
  );

  if (servicePrice <= 0) {
    setError("Please enter a service price.");
    return;
  }

  if (calloutFee < 0) {
    setError("Call-out fee cannot be negative.");
    return;
  }

  const total = servicePrice + calloutFee;

  const formData = new FormData();

  formData.set("bookingId", bookingId);
  formData.set("servicePrice", String(servicePrice));
  formData.set("calloutFee", String(calloutFee));
  formData.set(
    "estimatedTime",
    quoteEstimatedTime[bookingId] ?? ""
  );
  formData.set(
    "warranty",
    quoteWarranty[bookingId] ?? ""
  );
  formData.set(
    "quoteNotes",
    quoteNotes[bookingId] ?? ""
  );

  try {
  const result = await sendQuoteAction(formData);

  if (!result.success) {
    setError(result.message);
    return;
  }

  setState((currentState) => ({

      ...currentState,
      bookings: currentState.bookings.map((booking) =>
        booking.id === bookingId
          ? {
              ...booking,
              quote_service_price: servicePrice,
              quote_callout_fee: calloutFee,
              quote_total: total,
              quote_estimated_time:
                quoteEstimatedTime[bookingId] ?? "",
              quote_warranty:
                quoteWarranty[bookingId] ?? "",
              quote_notes:
                quoteNotes[bookingId] ?? "",
              quote_status: "quote_sent",
              quote_sent_at: new Date().toISOString()
            }
          : booking
      )
    }));

    setError(null);
    setFeedback("Quote sent successfully.");
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : "Failed to send quote."
    );
  }
}

  if (loading) {
    return (
      <section className="section">
        <div className="card">
          <strong>Loading provider dashboard...</strong>
        </div>
      </section>
    );
  }

  if (!state.profile) {
    return (
      <section className="section">
        <div className="card stack-md">
          <strong>Please sign in as a provider</strong>
          <p className="muted">The provider dashboard uses your current browser session.</p>
          <Link href="/auth" className="button-primary">
            Go to sign in
          </Link>
        </div>
      </section>
    );
  }

  if (state.profile.role !== "provider") {
    return (
      <section className="section">
        <div className="card stack-md">
          <strong>This account is not a provider account</strong>
          <p className="muted">You are currently signed in as {state.profile.role}.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <div className="eyebrow">Provider dashboard</div>
          <h1>{state.profile.full_name}</h1>
          <p className="muted">Create your public profile and manage pending booking requests.</p>
        </div>
        <span
          className={`status-chip ${
            state.providerProfile?.approval_status === "approved"
              ? "status-approved"
              : state.providerProfile?.approval_status === "rejected"
                ? "status-rejected"
                : "status-pending"
          }`}
        >
          {state.providerProfile?.approval_status ?? "pending"}
        </span>
      </div>

      {onboarding &&
      state.providerProfile?.approval_status === "pending" ? (
          <div className="card">
            <strong>Complete your provider registration</strong>
            <p className="muted">
              Your account was created successfully. Please complete this form so we can send your provider profile for
              admin approval.
            </p>
          </div>
        ) : null}

      {error ? (
        <div className="card">
          <strong>Something needs attention</strong>
          <p className="muted">{error}</p>
        </div>
      ) : null}

      {feedback ? (
        <div className="card">
          <strong>Success</strong>
          <p className="muted">{feedback}</p>
        </div>
      ) : null}

      <div className="card-grid">
  <div className="card">
    <strong>{state.totalBookings}</strong>
    <p>Total Bookings</p>
  </div>

  <div className="card">
    <strong>{state.pendingBookings}</strong>
    <p>Pending</p>
  </div>

  <div className="card">
    <strong>{state.confirmedBookings}</strong>
    <p>Confirmed</p>
  </div>

  <div className="card">
    <strong>{state.rejectedBookings}</strong>
    <p>Rejected</p>
  </div>

<div className="card">
  <strong>{state.completedBookings}</strong>
  <p>Completed Jobs</p>
</div>

<div className="card">
  <strong>R{state.totalRevenue.toLocaleString()}</strong>
  <p>Revenue</p>
</div>

<div className="card">
  <strong>⭐ {state.averageRating}</strong>
  <p>Average Rating</p>
</div>

<div className="card">
  <strong>{state.reviewCount}</strong>
  <p>Reviews</p>
 </div>
</div>

      <div className="dashboard-grid">
        <form
          action={(formData) => {
            startTransition(async () => {
              await handleSaveProfile(formData);
            });
          }}
          className="card stack-md"
        >
          <div className="eyebrow">Public profile</div>
          <input
            name="businessName"
            defaultValue={state.providerProfile?.business_name ?? state.profile.full_name}
            placeholder="Business or trading name"
            required
          />
          <select name="services" defaultValue={state.providerProfile?.services?.[0] ?? "Mechanic"} required>
            {PROVIDER_SPECIALISTS.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
          <select name="location" defaultValue={state.providerProfile?.location ?? ""} required>
            <option value="" disabled>
              Select Gauteng location
            </option>
            {GAUTENG_LOCATIONS.map((location) => (
              <option key={location} value={location}>
                {location}, Gauteng
              </option>
            ))}
          </select>
          <input
            name="contactEmail"
            defaultValue={state.providerProfile?.contact_email ?? state.profile.email}
            placeholder="Contact email"
            type="email"
            required
          />
          <input
            name="contactPhone"
            defaultValue={state.providerProfile?.contact_phone ?? state.profile.phone ?? ""}
            placeholder="Contact phone"
            required
          />
          <textarea
            name="bio"
            defaultValue={state.providerProfile?.bio ?? ""}
            placeholder="Short description of your workshop, turnaround time, or speciality"
          />
          <button className="button-primary" type="submit" disabled={isPending}>
            {isPending ? "Saving profile..." : "Save profile for admin review"}
          </button>
</form>

<div className="card stack-md">
  <div className="eyebrow">
    Notifications
  </div>

  {state.notifications.length ? (
    state.notifications.map((notification) => (
      <div
        key={notification.id}
        className="card"
      >
        <strong>
          {notification.title}
        </strong>

        <p>
          {notification.message}
        </p>

        {!notification.is_read && (
          <span className="status-chip status-pending">
            Unread
          </span>
        )}
      </div>
    ))
  ) : (
    <p>No notifications yet</p>
  )}
</div>

<div className="card stack-md">

  <div className="eyebrow">
    Booking requests
  </div>
          {state.bookings.length ? (
            state.bookings.map((booking) => (
              <article key={booking.id} className="card stack-sm">
                <div className="split-row">
                  <strong>{booking.customer?.full_name ?? "Customer"}</strong>
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
                <span>Date: {booking.appointment_date}</span>

                <span>
                  Phone: {booking.customer?.phone ?? "Not supplied"}
                </span>

                <span>
                  Email: {booking.customer?.email ?? "No email"}
                </span>

                <p>
                  <strong>Issue:</strong>
                  <br />
                  {booking.issue_description}
                </p>

                <p>
                  <strong>Service Preference:</strong>{" "}
                  {booking.service_preference === "provider_to_me"
                    ? "Provider comes to customer"
                    : booking.service_preference === "i_will_visit"
                    ? "Customer will visit workshop"
                    : "Not specified"}
                </p>

                {booking.attachment_url ? (
                  <div>
                    <strong>Attachment:</strong>

                    <br />

                    <a
                      href={booking.attachmentUrl ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button-secondary"
                    >
                      View Attachment
                    </a>
                  </div>
                ) : null}

                <div className="stack-sm">
                <strong>Provider Notes</strong>

                <textarea
                  value={
                    bookingNotes[booking.id] ??
                    booking.provider_notes ??
                    ""
                  }
                  onChange={(e) =>
                    setBookingNotes({
                      ...bookingNotes,
                      [booking.id]: e.target.value
                    })
                  }
                  placeholder="Add notes for the customer..."
                  rows={4}
                />

                <button
                  type="button"
                  className="button-secondary"
                  onClick={() =>
                    handleBookingNotes(booking.id)
                  }
                >
                  {savedNotes[booking.id]
                    ? "Saved ✓"
                    : "Save Notes"}
                </button>

              </div>
              
              {booking.status === "closed" ? (
                <div className="card">
                  <strong>Job Closed</strong>

                  <p>
                    Total: R{booking.quote_total ?? 0}
                  </p>

                  <p>
                    Customer has confirmed completion.
                  </p>
                </div>
              ) : booking.status === "completed" ? (
                null
              ) : booking.status === "rejected" ||
                booking.status === "cancelled" ? (
                null
              ) : booking.quote_status === "quote_sent" &&
                booking.status === "in_progress" ? (
                <div className="card">
                  <strong>Accepted Quote</strong>

                  <p>
                    Service Price: R{booking.quote_service_price ?? 0}
                  </p>

                  <p>
                    Call-out Fee: R{booking.quote_callout_fee ?? 0}
                  </p>

                  <p>
                    Total: R{booking.quote_total ?? 0}
                  </p>

                  {booking.quote_estimated_time ? (
                    <p>
                      Estimated Time: {booking.quote_estimated_time}
                    </p>
                  ) : null}

                  {booking.quote_warranty ? (
                    <p>
                      Warranty: {booking.quote_warranty}
                    </p>
                  ) : null}

                  <p>
                    Customer accepted this quote. Job is in progress.
                  </p>
                </div>
              ) : booking.quote_status === "quote_sent" ? (
                <div className="card">
                  <strong>Quote Sent</strong>

                  <p>
                    Service Price: R{booking.quote_service_price ?? 0}
                  </p>

                  <p>
                    Call-out Fee: R{booking.quote_callout_fee ?? 0}
                  </p>

                  <p>
                    Total: R{booking.quote_total ?? 0}
                  </p>

                  {booking.quote_estimated_time ? (
                    <p>
                      Estimated Time: {booking.quote_estimated_time}
                    </p>
                  ) : null}

                  {booking.quote_warranty ? (
                    <p>
                      Warranty: {booking.quote_warranty}
                    </p>
                  ) : null}

                  <p>
                    Waiting for customer approval.
                  </p>
                </div>
              ) : booking.status === "confirmed" ? (
                <div className="stack-sm">
                  <strong>Quote Details</strong>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Service Price (R)"
                    value={quoteServicePrice[booking.id] ?? ""}
                    onChange={(e) =>
                      setQuoteServicePrice({
                        ...quoteServicePrice,
                        [booking.id]: e.target.value
                      })
                    }
                  />

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Call-out Fee (R)"
                    value={quoteCalloutFee[booking.id] ?? ""}
                    onChange={(e) =>
                      setQuoteCalloutFee({
                        ...quoteCalloutFee,
                        [booking.id]: e.target.value
                      })
                    }
                  />

                  <input
                    type="text"
                    placeholder="Estimated Time (e.g. 2–3 hours)"
                    value={quoteEstimatedTime[booking.id] ?? ""}
                    onChange={(e) =>
                      setQuoteEstimatedTime({
                        ...quoteEstimatedTime,
                        [booking.id]: e.target.value
                      })
                    }
                  />

                  <input
                    type="text"
                    placeholder="Warranty (e.g. 12 months on qualifying parts)"
                    value={quoteWarranty[booking.id] ?? ""}
                    onChange={(e) =>
                      setQuoteWarranty({
                        ...quoteWarranty,
                        [booking.id]: e.target.value
                      })
                    }
                  />

                  <textarea
                    placeholder="Quote notes..."
                    value={quoteNotes[booking.id] ?? ""}
                    onChange={(e) =>
                      setQuoteNotes({
                        ...quoteNotes,
                        [booking.id]: e.target.value
                      })
                    }
                    rows={4}
                  />

                  <button
                    type="button"
                    className="button-primary"
                    onClick={() => handleSendQuote(booking.id)}
                  >
                    Send Quote
                  </button>
                </div>
              ) : null}

               {booking.status === "pending" ? (
              <div className="inline-actions">
                <form action={updateBookingStatusAction}>
                  <input
                    type="hidden"
                    name="bookingId"
                    value={booking.id}
                  />
                  <input
                    type="hidden"
                    name="status"
                    value="confirmed"
                  />
                  <button
                    className="button-primary"
                    type="submit"
                  >
                    Accept booking
                  </button>
                </form>

                <form action={updateBookingStatusAction}>
                  <input
                    type="hidden"
                    name="bookingId"
                    value={booking.id}
                  />
                  <input
                    type="hidden"
                    name="status"
                    value="rejected"
                  />
                  <button
                    className="button-secondary"
                    type="submit"
                  >
                    Reject booking
                  </button>
                </form>
              </div>
            ) : null}

            {booking.status === "in_progress" ? (
            <form action={markJobComplete}>
              <input
                type="hidden"
                name="bookingId"
                value={booking.id}
              />

              <button
                type="submit"
                className="button-primary"
              >
                Mark Job Complete
              </button>
            </form>
          ) : null}
                            </article>
                          ))
                        ) : (
                          <p className="muted">No booking requests yet. Once customers start booking, they will appear here.</p>
                        )}
                      </div>
                    </div>
                  </section>
                );
              }
