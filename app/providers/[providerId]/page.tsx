import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createBookingAction } from "@/app/providers/[providerId]/actions";
import { formatServices } from "@/lib/utils";

type ProviderProfilePageProps = {
  params: Promise<{
    providerId: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function ProviderProfilePage({
  params,
  searchParams
}: ProviderProfilePageProps) {
  const { providerId } = await params;
  const search = await searchParams;

  const supabase = await createClient();

  const { data: provider } = await supabase
  .from("provider_profiles")
  .select("*, profiles(full_name)")
  .eq("user_id", providerId)
  .eq("approval_status", "approved")
  .eq("is_active", true)
  .single();

  if (!provider) {
    notFound();
  }

  const { data: reviews } = await supabase
  .from("reviews")
  .select("*")
  .eq("provider_id", provider.user_id)
  .order("created_at", {
    ascending: false
  });

const reviewCount =
  reviews?.length ?? 0;

const averageRating =
  reviewCount > 0
    ? (
        reviews!.reduce(
          (sum, review) =>
            sum + review.rating,
          0
        ) / reviewCount
      ).toFixed(1)
    : null;

  return (
    <section className="section">
      <div className="dashboard-grid">
        {/* Provider Profile */}
        <article className="card stack-md">
          <div className="eyebrow">Provider profile</div>

          <h1 style={{ margin: 0 }}>
            {provider.business_name}
          </h1>

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

          <p className="muted">
            {provider.location}
          </p>

          <p>
            {provider.bio ||
              "This provider is available for automotive bookings."}
          </p>

          <div className="pill-list">
            {provider.services.map((item: string) => (
              <span key={item} className="pill">
                {item}
              </span>
            ))}
          </div>

          <div className="stack-sm">
            <span>
              Contact person: {provider.profiles?.full_name}
            </span>

            <span>
              Phone: {provider.contact_phone}
            </span>

            <span>
              Email: {provider.contact_email}
            </span>

            <span>
              Services: {formatServices(provider.services)}
            </span>

            <span>
              Experience:{" "}
              {provider.years_experience || "Not specified"} years
            </span>

            <span>
              Mobile service:{" "}
              {provider.mobile_service ? "Yes" : "No"}
            </span>
          </div>
          <div className="card stack-sm">
          <strong>Customer Reviews</strong>

          {reviews?.length ? (
            reviews.map((review) => (
              <div
                key={review.id}
                className="card"
              >
                <p>
                  {"⭐".repeat(review.rating)}
                </p>

                <p>{review.review_text}</p>
              </div>
            ))
          ) : (
            <p className="muted">
              No reviews yet.
            </p>
          )}
        </div>
        </article>

        {/* Booking Form */}
        <aside className="card stack-md">
          <div className="eyebrow">
            3-step booking flow
          </div>

          <div className="booking-steps">
            <div className="step">
              <strong>
                1. Review provider details
              </strong>

              <p className="muted">
                Confirm location, service type, and
                contact details.
              </p>
            </div>

            <div className="step">
              <strong>
                2. Select a date
              </strong>

              <p className="muted">
                Choose a preferred service date and
                let the provider know whether you
                would like mobile assistance or if
                you will visit their workshop.
              </p>
            </div>

            <div className="step">
              <strong>
                3. Describe the issue
              </strong>

              <p className="muted">
                Describe the issue in detail and
                attach photos or videos to help the
                provider prepare before the
                appointment.
              </p>
            </div>
          </div>

          {search.error ? (
            <div className="card">
              <strong>
                Unable to place booking
              </strong>

              <p className="muted">
                {search.error}
              </p>
            </div>
          ) : null}

          <form
            action={createBookingAction}
            className="stack-md"
          >
            <input
              type="hidden"
              name="providerId"
              value={providerId}
            />

            {/* Appointment Date */}
            <input
              type="date"
              name="appointmentDate"
              required
            />

            {/* Service Preference */}
            <select
              name="servicePreference"
              required
            >
              <option value="">
                Select service preference
              </option>

              <option value="provider_to_me">
                I want the provider to come to me
              </option>

              <option value="i_will_visit">
                I will visit the provider
              </option>
            </select>

            {/* Issue Description */}
            <textarea
              name="issueDescription"
              placeholder="Describe the car issue, warning lights, sounds, or repair needed"
              required
            />

            {/* File Upload */}
            <input
              type="file"
              name="attachment"
              accept="image/*,video/*"
            />

            <button
              className="button-primary"
              type="submit"
            >
              Submit booking request
            </button>
          </form>
        </aside>
      </div>
    </section>
  );
}