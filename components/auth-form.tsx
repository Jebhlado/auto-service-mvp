
"use client";

import { useState, useTransition } from "react";
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
  const [isPending] = useTransition();
  const [resetMode, setResetMode] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const router = useRouter();

  async function handleSignup(formData: FormData) {
    const supabase = createClient();
    const fullName = String(formData.get("fullName") ?? "");
    const phone = String(formData.get("phone") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const requestedRole = String(formData.get("role") ?? "customer");
    const role = requestedRole === "provider" ? "provider" : "customer";

    setError(null);

    if (requestedRole !== "customer" && requestedRole !== "provider") {
      setError("Please choose a valid account type.");
      return;
    }

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
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

    const { error: profileError } = await supabase.from("profiles").insert({
      id: authState.user.id,
      role,
      full_name: fullName,
      email,
      phone,
    });

    if (profileError) {
      setError(profileError.message);
      return;
    }

    // Complete a saved booking if one exists.
    const draft = localStorage.getItem("bookingDraft");

    if (draft) {
      const booking = JSON.parse(draft);

      await fetch("/api/create-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(booking),
      });

      localStorage.removeItem("bookingDraft");
    }

    router.push(redirectForRole(role));
  }

  async function handleLogin(formData: FormData) {
    const supabase = createClient();
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    setError(null);

    const { data, error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (loginError || !data.user) {
      setError(loginError?.message ?? "Unable to sign in.");
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

    // Complete a saved booking if one exists.
    const draft = localStorage.getItem("bookingDraft");

    if (draft) {
      const booking = JSON.parse(draft);

      await fetch("/api/create-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(booking),
      });

      localStorage.removeItem("bookingDraft");
    }

    router.push(redirectForRole(profile.role));
  }

  async function handlePasswordReset(formData: FormData) {
    const supabase = createClient();
    const email = String(formData.get("email") ?? "").trim();

    setError(null);
    setResetMessage(null);

    const { error: resetError } =
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });

    if (resetError) {
      setError(
        "We couldn't process your password reset request. Please try again."
      );
      return;
    }

    setResetMessage(
      "If an account exists for that email address, a password recovery link will be sent."
    );
  }

  return (
    <div className="auth-card">
      {!resetMode ? (
        <div className="segmented">
          <button
            type="button"
            className={cn(mode === "signup" && "active")}
            onClick={() => {
              setMode("signup");
              setError(null);
            }}
          >
            Sign up
          </button>

          <button
            type="button"
            className={cn(mode === "login" && "active")}
            onClick={() => {
              setMode("login");
              setError(null);
            }}
          >
            Log in
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="card" role="alert">
          <strong>Something needs attention</strong>
          <p className="muted">{error}</p>
        </div>
      ) : null}

      {resetMode ? (
        <form action={handlePasswordReset} className="stack-md">
          <h2>Reset your password</h2>

          <p className="muted">
            Enter your email address and we&apos;ll send a password recovery link
            if an account exists.
          </p>

          <input
            name="email"
            type="email"
            placeholder="Email address"
            autoComplete="email"
            required
          />

          <button
            className="button-primary"
            type="submit"
            disabled={isPending}
          >
            {isPending ? "Sending..." : "Send recovery link"}
          </button>

          {resetMessage ? (
            <p className="muted" role="status">
              {resetMessage}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => {
              setResetMode(false);
              setResetMessage(null);
              setError(null);
            }}
          >
            Back to log in
          </button>
        </form>
      ) : mode === "signup" ? (
        <form action={handleSignup} className="stack-md">
          <input
            name="fullName"
            placeholder="Full name"
            autoComplete="name"
            required
          />

          <input
            name="phone"
            type="tel"
            placeholder="Phone number"
            autoComplete="tel"
            required
          />

          <input
            name="email"
            type="email"
            placeholder="Email address"
            autoComplete="email"
            required
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            autoComplete="new-password"
            minLength={6}
            required
          />

          <select name="role" defaultValue="customer" required>
            <option value="customer">Customer</option>
            <option value="provider">Service provider</option>
          </select>

          <button
            className="button-primary"
            type="submit"
            disabled={isPending}
          >
            {isPending ? "Creating account..." : "Create account"}
          </button>
        </form>
      ) : (
        <form action={handleLogin} className="stack-md">
          <input
            name="email"
            type="email"
            placeholder="Email address"
            autoComplete="email"
            required
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            minLength={6}
            required
          />

          <button
            className="button-primary"
            type="submit"
            disabled={isPending}
          >
            {isPending ? "Logging in..." : "Log in"}
          </button>

          <button
            type="button"
            onClick={() => {
              setResetMode(true);
              setResetMessage(null);
              setError(null);
            }}
          >
            Forgot password?
          </button>
        </form>
      )}
    </div>
  );
}
