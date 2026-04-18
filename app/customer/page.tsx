import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatServices } from "@/lib/utils";
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

  let query = supabase.from("provider_profiles").select("*, profiles(full_name)").eq("approval_status", "approved");

  if (location) {
    query = query.ilike("location", `%${location}%`);
  }

  if (service) {
    query = query.contains("services", [service]);
  }

  const { data } = await query.order("updated_at", { ascending: false });
  const providers = (data ?? []) as ProviderProfileRecord[];

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

  <div className="card">
    <p className="muted">
      Your Bookings
    </p>
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
    providers.map((provider) => (
      <article key={provider.user_id} className="card stack-sm">
        <div className="split-row">
          <div>
            <div className="eyebrow">Approved provider</div>
            <h3 style={{ margin: "0.3rem 0" }}>{provider.business_name}</h3>
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
    ))
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
