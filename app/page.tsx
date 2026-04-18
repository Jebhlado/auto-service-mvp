import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const highlights = [
  {
    title: "Fast search",
    body: "Customers can search by location and service type, then inspect provider profiles before they book."
  },
  {
    title: "Provider workflow",
    body: "Service providers create a profile, wait for admin approval, and manage booking requests from one dashboard."
  },
  {
    title: "Admin oversight",
    body: "Admins approve providers before they go live and monitor all booking activity across the platform."
  }
];

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  // ✅ REDIRECT LOGGED-IN USERS
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "provider") redirect("/provider");
    if (profile?.role === "admin") redirect("/admin");
    redirect("/customer");
  }

  // ✅ YOUR EXISTING UI (UNCHANGED)
  return (
    <div className="section">
      <section className="hero">
        <div className="hero-panel">
          <div className="eyebrow">Automotive Booking MVP</div>
          <h1>Connect drivers with trusted mechanics in three simple steps.</h1>
          <p>
            AutoCare Connect is a lean marketplace for customers, mechanics, and auto electricians to manage
            appointments without the clutter of payments or complex dispatching.
          </p>
          <div className="inline-actions" style={{ marginTop: "1.5rem" }}>
            <Link href="/customer" className="button-primary">
              Browse providers
            </Link>
            <Link href="/auth" className="button-secondary">
              Create an account
            </Link>
          </div>

          <div className="stats-grid">
            <div className="card">
              <div className="eyebrow">Step 1</div>
              <strong>Find a provider</strong>
              <p className="muted">Search by location and service type.</p>
            </div>
            <div className="card">
              <div className="eyebrow">Step 2</div>
              <strong>Book a slot</strong>
              <p className="muted">Choose a date and describe the issue.</p>
            </div>
            <div className="card">
              <div className="eyebrow">Step 3</div>
              <strong>Get confirmed</strong>
              <p className="muted">Providers accept or reject requests from their dashboard.</p>
            </div>
          </div>
        </div>

        <div className="hero-panel">
          <div className="eyebrow">Why this MVP works</div>
          <div className="stack-md" style={{ marginTop: "1rem" }}>
            {highlights.map((item) => (
              <div key={item.title} className="card">
                <strong>{item.title}</strong>
                <p className="muted">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}