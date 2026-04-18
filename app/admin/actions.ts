"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendNotification } from "@/lib/notifications";

export async function updateProviderApprovalAction(formData: FormData) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const providerId = String(formData.get("providerId") ?? "");
  const status = String(formData.get("status") ?? "");

  const { data: provider } = await supabase
    .from("provider_profiles")
    .select("business_name, contact_email")
    .eq("user_id", providerId)
    .single();

  const { error } = await supabase
    .from("provider_profiles")
    .update({
      approval_status: status,
      approved_at: status === "approved" ? new Date().toISOString() : null
    })
    .eq("user_id", providerId);

  if (error) {
    redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }

  if (provider?.contact_email) {
    await sendNotification({
      to: provider.contact_email,
      subject: `Provider profile ${status}`,
      html: `<p>Your provider profile for ${provider.business_name} is now ${status}.</p>`,
      text: `Your provider profile for ${provider.business_name} is now ${status}.`
    });
  }

  redirect("/admin?success=provider-updated");
}
