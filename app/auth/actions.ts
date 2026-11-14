"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseServicesInput } from "@/lib/utils";

function normalizeRedirectForRole(role: string) {
  if (role === "provider") return "/provider";
  if (role === "admin") return "/admin";
  return "/customer";
}

export async function signupAction(formData: FormData) {
  const supabase = await createClient();
  const fullName = String(formData.get("fullName") ?? "");
  const phone = String(formData.get("phone") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const requestedRole = String(formData.get("role") ?? "customer");
  if (requestedRole !== "customer" && requestedRole !== "provider") {
    redirect(`/auth?error=${encodeURIComponent("Please choose a valid account type.")}`);
  }
  const role = requestedRole;

  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error || !data.user) {
    redirect(`/auth?error=${encodeURIComponent(error?.message ?? "Unable to sign up")}`);
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: data.user.id,
    role,
    full_name: fullName,
    email,
    phone
  });

  if (profileError) {
    console.error("Profile creation failed:", profileError.message);
    redirect(`/auth?error=${encodeURIComponent("Your account was created, but its profile could not be initialized. Please contact support before trying again.")}`);
  }

  if (role === "provider") {
    const { error: providerProfileError } = await supabase.from("provider_profiles").upsert({
      user_id: data.user.id,
      business_name: fullName,
      services: parseServicesInput("Mechanic"),
      location: "",
      contact_email: email,
      contact_phone: phone,
      bio: "",
      approval_status: "pending",
      is_active: false,
      approved_at: null
    });

    if (providerProfileError) {
      console.error("Provider profile initialization failed:", providerProfileError.message);
      redirect(`/auth?error=${encodeURIComponent("Your account was created, but provider onboarding could not be initialized. Please contact support.")}`);
    }
  }

  // In some Supabase setups signUp creates the user but does not leave an
  // active session cookie available for the next request. We sign in
  // immediately so role-protected pages can open right after signup.
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (signInError) {
    redirect(
      `/auth?error=${encodeURIComponent(
        "Account created, but automatic sign-in failed. Please log in with your new password."
      )}`
    );
  }

  if (role === "provider") {
  redirect("/complete-provider-profile");
}

redirect("/customer");
}

export async function loginAction(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    redirect(`/auth?error=${encodeURIComponent(error.message)}`);
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id).single();

  redirect(normalizeRedirectForRole(profile?.role ?? "customer"));
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
