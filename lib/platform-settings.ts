import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type NotificationCategory =
  | "booking_updates"
  | "quote_updates"
  | "payment_updates"
  | "completion_updates";

export type PlatformSettings = {
  general: {
    platform_name: string;
    support_email: string;
    support_phone: string;
    default_region: string;
  };
  payments: {
    platform_fee_percent: number;
  };
  provider_management: {
    require_approval: boolean;
    service_categories: string[];
  };
  booking_rules: {
    customer_cancellation_enabled: boolean;
  };
  notifications: {
    email_enabled: boolean;
    booking_updates: boolean;
    quote_updates: boolean;
    payment_updates: boolean;
    completion_updates: boolean;
  };
};

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  general: {
    platform_name: "Mechanic Connect",
    support_email: "",
    support_phone: "",
    default_region: "Gauteng, South Africa",
  },
  payments: {
    platform_fee_percent: 15,
  },
  provider_management: {
    require_approval: true,
    service_categories: ["Mechanic", "Auto electrician", "Panel beater"],
  },
  booking_rules: {
    customer_cancellation_enabled: true,
  },
  notifications: {
    email_enabled: true,
    booking_updates: true,
    quote_updates: true,
    payment_updates: true,
    completion_updates: true,
  },
};

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("platform_settings")
    .select("general, payments, provider_management, booking_rules, notifications")
    .eq("id", "default")
    .maybeSingle();

  if (error || !data) {
    // Keep existing platform behaviour if the settings migration has not
    // been applied in a particular environment.
    if (error) {
      console.error("Platform settings could not be loaded:", error.message);
    }
    return DEFAULT_PLATFORM_SETTINGS;
  }

  const settings = data as Partial<PlatformSettings>;
  const categories = settings.provider_management?.service_categories;
  return {
    general: {
      ...DEFAULT_PLATFORM_SETTINGS.general,
      ...(settings.general ?? {}),
    },
    payments: {
      ...DEFAULT_PLATFORM_SETTINGS.payments,
      ...(settings.payments ?? {}),
    },
    provider_management: {
      ...DEFAULT_PLATFORM_SETTINGS.provider_management,
      ...(settings.provider_management ?? {}),
      service_categories:
        Array.isArray(categories) && categories.length
          ? categories.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
          : DEFAULT_PLATFORM_SETTINGS.provider_management.service_categories,
    },
    booking_rules: {
      ...DEFAULT_PLATFORM_SETTINGS.booking_rules,
      ...(settings.booking_rules ?? {}),
    },
    notifications: {
      ...DEFAULT_PLATFORM_SETTINGS.notifications,
      ...(settings.notifications ?? {}),
    },
  };
}

export function isNotificationEnabled(
  settings: PlatformSettings,
  category: NotificationCategory,
): boolean {
  return settings.notifications.email_enabled && settings.notifications[category];
}

export function isInAppNotificationEnabled(
  settings: PlatformSettings,
  category: NotificationCategory,
): boolean {
  return settings.notifications[category];
}
