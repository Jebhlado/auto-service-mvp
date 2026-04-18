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
  const role = String(formData.get("role") ?? "customer");

  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error || !data.user) {
    redirect(`/auth?error=${encodeURIComponent(error?.message ?? "Unable to sign up")}`);
  }

  await supabase.from("profiles").upsert({
    id: data.user.id,
    role,
    full_name: fullName,
    email,
    phone
  });

  if (role === "provider") {
    await supabase.from("provider_profiles").upsert({
      user_id: data.user.id,
      business_name: fullName,
      services: parseServicesInput("Mechanic"),
      location: "",
      contact_email: email,
      contact_phone: phone,
      bio: "",
      approval_status: "pending"
    });
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

  redirect(normalizeRedirectForRole(role));
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
