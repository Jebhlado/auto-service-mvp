import { createClient } from "@/lib/supabase/server";

const BUCKET_NAME = "booking-attachments";

function getStoragePath(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  // New format: we store the Storage path directly.
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return trimmed;
  }

  // Existing format:
  // https://<project>.supabase.co/storage/v1/object/public/booking-attachments/<file>
  const marker = `/storage/v1/object/public/${BUCKET_NAME}/`;

  const markerIndex = trimmed.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  return decodeURIComponent(
    trimmed.slice(markerIndex + marker.length)
  );
}

export async function getBookingAttachmentUrl(
  bookingId: string
): Promise<string | null> {
  if (!bookingId) {
    return null;
  }

  const supabase = await createClient();

  const { data: booking, error: bookingError } =
    await supabase
      .from("bookings")
      .select("id, attachment_url")
      .eq("id", bookingId)
      .single();

  if (bookingError || !booking?.attachment_url) {
    return null;
  }

  const storagePath = getStoragePath(
    booking.attachment_url
  );

  if (!storagePath) {
    return null;
  }

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, 60 * 10);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}
