import { createAdminClient } from "@/lib/supabase/admin";
import { getPlatformSettings, isInAppNotificationEnabled, type NotificationCategory } from "@/lib/platform-settings";

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  category: NotificationCategory = "booking_updates",
  eventKey?: string,
): Promise<boolean> {
  const settings = await getPlatformSettings();
  if (!isInAppNotificationEnabled(settings, category)) return false;

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      title,
      message,
      ...(eventKey ? { event_key: eventKey } : {}),
    });

  if (error) {
    // A duplicate event key means this notification was already created.
    if (eventKey && error.code === "23505") return false;

    console.error("Notification creation failed:", error.message);
    return false;
  }

  return true;
}
