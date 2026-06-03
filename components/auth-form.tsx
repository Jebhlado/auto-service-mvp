"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

function redirectForRole(role: string) {
  if (role === "provider") return "/provider?onboarding=1";
  if (role === "admin") return "/admin";
  return "/customer";
}

export function AuthForm() {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSignup(formData: FormData) {
    const supabase = createClient();
    const fullName = String(formData.get("fullName") ?? "");
    const phone = String(formData.get("phone") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const role = String(formData.get("role") ?? "customer");

    setError(null);

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password
    });

    if (signupError || !data.user) {
      setError(signupError?.message ?? "Unable to sign up.");
      return;
    }

    const { data: authState } = await supabase.auth.getUser();

    if (!authState.user) {
      setError("Account created, but no session found.");
      return;
    }

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: authState.user.id,
      role,
      full_name: fullName,
      email,
      phone
    });

    if (profileError) {
      setError(profileError.message);
      return;
    }

    // ✅ AUTO-COMPLETE BOOKING IF EXISTS
    const draft = localStorage.getItem("bookingDraft");

    if (draft) {
      const booking = JSON.parse(draft);

      await fetch("/api/create-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(booking)
      });

      localStorage.removeItem("bookingDraft");
    }

    const nextPath = redirectForRole(role);
    router.push(nextPath);
  }

  async function handleLogin(formData: FormData) {
    const supabase = createClient();
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error || !data.user) {
      setError(error?.message ?? "Unable to sign in.");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (!profile) {
      setError("Profile not found for this account.");
      return;
    }

    // ✅ AUTO-COMPLETE BOOKING IF EXISTS
    const draft = localStorage.getItem("bookingDraft");

    if (draft) {
      const booking = JSON.parse(draft);

      await fetch("/api/create-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(booking)
      });

      localStorage.removeItem("bookingDraft");
    }

    const nextPath = redirectForRole(profile.role);
    router.push(nextPath);
  }

  return (
    <div className="auth-card">
      <div className="segmented">
        <button type="button" className={cn(mode === "signup" && "active")} onClick={() => setMode("signup")}>
          Sign up
        </button>
        <button type="button" className={cn(mode === "login" && "active")} onClick={() => setMode("login")}>
          Log in
        </button>
      </div>

      {error ? (
        <div className="card">
          <strong>Something needs attention</strong>
          <p className="muted">{error}</p>
        </div>
      ) : null}

      {mode === "signup" ? (
        <form action={handleSignup} className="stack-md">
          <input name="fullName" placeholder="Full name" required />
          <input name="phone" placeholder="Phone number" required />
          <input name="email" type="email" placeholder="Email address" required />
          <input name="password" type="password" placeholder="Password" minLength={6} required />
          <select name="role" defaultValue="customer" required>
            <option value="customer">Customer</option>
            <option value="provider">Service provider</option>
          </select>
          <button className="button-primary" type="submit" disabled={isPending}>
            {isPending ? "Creating account..." : "Create account"}
          </button>
        </form>
      ) : (
        <form action={handleLogin} className="stack-md">
          <input name="email" type="email" placeholder="Email address" required />
          <input name="password" type="password" placeholder="Password" minLength={6} required />
          <button className="button-primary" type="submit" disabled={isPending}>
            {isPending ? "Logging in..." : "Log in"}
          </button>
        </form>
      )}
    </div>
  );
}