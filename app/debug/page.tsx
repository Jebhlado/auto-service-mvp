import { createClient } from "@/lib/supabase/server";

export default async function DebugPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return (
    <pre>
      {JSON.stringify(
        {
          user,
          error,
        },
        null,
        2
      )}
    </pre>
  );
}