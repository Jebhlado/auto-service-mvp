import { createAdminClient } from "@/lib/supabase/admin";
import { getPlatformSettings, isInAppNotificationEnabled, type NotificationCategory } from "@/lib/platform-settings";

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  category: NotificationCategory = "booking_updates",
) {
  const settings = await getPlatformSettings();
  if (!isInAppNotificationEnabled(settings, category)) return;

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      title,
      message
    });

  if (error) {
    console.error("Notification creation failed:", error);
    throw new Error(error.message);
  }
}
