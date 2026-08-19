const BUCKET_NAME = "booking-attachments";

export function getBookingAttachmentPath(
  value: string | null | undefined
): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  // New records can store the Storage path directly.
  if (
    !trimmed.startsWith("http://") &&
    !trimmed.startsWith("https://")
  ) {
    return trimmed;
  }

  // Existing records contain the full Supabase public URL.
  const marker =
    `/storage/v1/object/public/${BUCKET_NAME}/`;

  const markerIndex = trimmed.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  return decodeURIComponent(
    trimmed.slice(markerIndex + marker.length)
  );
}
