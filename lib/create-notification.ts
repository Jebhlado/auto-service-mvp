import { createAdminClient } from "@/lib/supabase/admin";

export async function createNotification(
  userId: string,
  title: string,
  message: string
) {
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
