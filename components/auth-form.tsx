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

    // Skip auto login, go to login page
setMode("login");
setError("Account created successfully. Please log in.");
return;

    if (signInError) {
      setError("Account created, but sign-in failed. Please log in manually.");
      setMode("login");
      return;
    }

    const { data: authState } = await supabase.auth.getUser();

    if (!authState.user) {
      setError("Signed in, but no active session was found.");
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

    if (role === "provider") {
      const { error: providerError } = await supabase.from("provider_profiles").upsert({
        user_id: authState.user.id,
        business_name: fullName,
        services: ["Mechanic"],
        location: "",
        contact_email: email,
        contact_phone: phone,
        bio: "",
        approval_status: "pending"
      });

      if (providerError) {
        setError(providerError.message);
        return;
      }
    }

    const nextPath = redirectForRole(role);
    router.push(nextPath);
  }

  async function handleLogin(formData: FormData) {
    const supabase = createClient();
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    setError(null);

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (loginError) {
      setError(loginError.message);
      return;
    }

    const {
      data: { user }
    } = await supabase.auth.getUser();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user?.id)
      .single();

    if (profileError || !profile) {
      setError(profileError?.message ?? "Profile not found for this account.");
      return;
    }

    const nextPath = redirectForRole(profile.role);
    router.replace(nextPath);
    router.refresh();
    window.location.assign(nextPath);
  }

  function onSignupSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      await handleSignup(formData);
    });
  }

  function onLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      await handleLogin(formData);
    });
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
        <form onSubmit={onSignupSubmit} className="stack-md">
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
        <form onSubmit={onLoginSubmit} className="stack-md">
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
