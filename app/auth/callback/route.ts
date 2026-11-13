
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");

  // Only allow redirects to the password-reset page.
  const safeNext =
    next === "/reset-password" ? next : "/reset-password";

  if (!code) {
    return NextResponse.redirect(
      new URL(
        "/auth?error=Invalid%20or%20expired%20recovery%20link",
        requestUrl.origin
      )
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Password recovery code exchange failed:", {
      message: error.message,
      status: error.status,
      code: error.code,
    });

    return NextResponse.redirect(
      new URL(
        "/auth?error=Your%20recovery%20link%20is%20invalid%20or%20has%20expired",
        requestUrl.origin
      )
    );
  }

  return NextResponse.redirect(
    new URL(safeNext, requestUrl.origin)
  );
}
