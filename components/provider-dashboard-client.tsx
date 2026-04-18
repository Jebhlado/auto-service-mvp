"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GAUTENG_LOCATIONS, PROVIDER_SPECIALISTS } from "@/lib/provider-options";
import type { BookingRecord, ProfileRecord, ProviderProfileRecord } from "@/lib/types";

type ProviderDashboardState = {
  profile: ProfileRecord | null;
  providerProfile: ProviderProfileRecord | null;
  bookings: BookingRecord[];
};

export function ProviderDashboardClient() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<ProviderDashboardState>({
    profile: null,
    providerProfile: null,
    bookings: []
  });
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
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
        bookings: []
      });
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single<ProfileRecord>();

    if (!profile || profile.role !== "provider") {
      setState({
        profile,
        providerProfile: null,
        bookings: []
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
      .select(
        "id, customer_id, provider_id, appointment_date, issue_description, status, created_at, customer:profiles!bookings_customer_id_fkey(full_name, phone)"
      )
      .eq("provider_id", user.id)
      .returns<BookingRecord[]>()
      .order("created_at", { ascending: false });

    setState({
      profile,
      providerProfile: providerProfile ?? null,
      bookings: bookings ?? []
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

  async function handleBookingStatus(bookingId: string, status: "confirmed" | "rejected") {
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", bookingId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setError(null);
    setFeedback(`Booking ${status === "confirmed" ? "accepted" : "rejected"} successfully.`);
    await loadDashboard();
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

      {onboarding ? (
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
          <div className="eyebrow">Booking requests</div>
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
                <span>Phone: {booking.customer?.phone ?? "Not supplied"}</span>
                <p>{booking.issue_description}</p>
                {booking.status === "pending" ? (
                  <div className="inline-actions">
                    <button
                      className="button-primary"
                      type="button"
                      onClick={() => {
                        startTransition(async () => {
                          await handleBookingStatus(booking.id, "confirmed");
                        });
                      }}
                    >
                      Accept booking
                    </button>
                    <button
                      className="button-secondary"
                      type="button"
                      onClick={() => {
                        startTransition(async () => {
                          await handleBookingStatus(booking.id, "rejected");
                        });
                      }}
                    >
                      Reject booking
                    </button>
                  </div>
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
