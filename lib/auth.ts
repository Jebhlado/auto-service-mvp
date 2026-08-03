import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRecord, UserRole } from "@/lib/types";

export async function getSessionUser() {
  const supabase = await createClient();

  const result = await supabase.auth.getUser();

  console.log("========== SERVER SESSION ==========");
  console.log("USER:", result.data.user);
  console.log("ERROR:", result.error);
  console.log("====================================");

  return result.data.user;
}

export async function getCurrentProfile() {
  const user = await getSessionUser();

  if (!user) {
    return null;
  }

  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single<ProfileRecord>();

  return data;
}

export async function requireAuth() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/auth");
  }

  return user;
}

export async function requireRole(roles: UserRole[]) {
  const user = await requireAuth();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<ProfileRecord>();

  if (!profile || !roles.includes(profile.role)) {
    redirect("/");
  }

  return { user, profile };
}
