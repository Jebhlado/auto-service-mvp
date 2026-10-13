"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function readCheckbox(formData: FormData, name: string): boolean {
  return formData.get(name) === "on";
}

function readText(formData: FormData, name: string, maxLength: number): string {
  return String(formData.get(name) ?? "").trim().slice(0, maxLength);
}

export async function savePlatformSettingsAction(formData: FormData) {
  const { user } = await requireRole(["admin"]);

  const platformName = readText(formData, "platform_name", 80);
  const supportEmail = readText(formData, "support_email", 254);
  const supportPhone = readText(formData, "support_phone", 40);
  const defaultRegion = readText(formData, "default_region", 120);
  const feeRaw = readText(formData, "platform_fee_percent", 8);
  const feePercent = Number(feeRaw);
  const categoriesRaw = readText(formData, "service_categories", 1000);
  const categories = Array.from(new Set(
    categoriesRaw.split(",").map((value) => value.trim()).filter(Boolean)
  )).slice(0, 20);

  if (!platformName || !defaultRegion) {
    redirect("/admin/settings?error=required");
  }

  if (supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail)) {
    redirect("/admin/settings?error=email");
  }

  if (!Number.isFinite(feePercent) || feePercent < 0 || feePercent > 30) {
    redirect("/admin/settings?error=fee");
  }

  if (categories.length === 0) {
    redirect("/admin/settings?error=categories");
  }

  const settings = {
    general: {
      platform_name: platformName,
      support_email: supportEmail,
      support_phone: supportPhone,
      default_region: defaultRegion,
    },
    payments: {
      platform_fee_percent: feePercent,
    },
    provider_management: {
      require_approval: readCheckbox(formData, "require_approval"),
      service_categories: categories,
    },
    booking_rules: {
      customer_cancellation_enabled: readCheckbox(formData, "customer_cancellation_enabled"),
    },
    notifications: {
      email_enabled: readCheckbox(formData, "email_enabled"),
      booking_updates: readCheckbox(formData, "booking_updates"),
      quote_updates: readCheckbox(formData, "quote_updates"),
      payment_updates: readCheckbox(formData, "payment_updates"),
      completion_updates: readCheckbox(formData, "completion_updates"),
    },
  };

  const supabase = await createClient();
  const { error } = await supabase
    .from("platform_settings")
    .upsert({
      id: "default",
      ...settings,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });

  if (error) {
    console.error("Platform settings save failed:", error.message);
    redirect("/admin/settings?error=save");
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  redirect("/admin/settings?success=saved");
}
