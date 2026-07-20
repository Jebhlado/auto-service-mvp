import { createClient } from "@/lib/supabase/server";
import type {
  BookingRecord,
  ProfileRecord,
  ProviderProfileRecord,
} from "@/lib/types";

/**
 * Provider queries
 */

export async function getPendingProviders() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("provider_profiles")
    .select("*, profiles(full_name)")
    .eq("approval_status", "pending")
    .returns<ProviderProfileRecord[]>()
    .order("created_at", {
      ascending: false,
    });

  return data ?? [];
}

export async function getProviders(search = "") {
  const supabase = await createClient();

  let query = supabase
    .from("provider_profiles")
    .select("*, profiles(full_name)");

  if (search.trim()) {
    query = query.or(
      `business_name.ilike.%${search}%,location.ilike.%${search}%`
    );
  }

  const { data } = await query
    .returns<ProviderProfileRecord[]>()
    .order("created_at", {
      ascending: false,
    });

  return data ?? [];
}