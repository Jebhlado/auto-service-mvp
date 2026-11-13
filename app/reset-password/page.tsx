
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function updatePassword() {
    setMessage("");

    if (password.length < 8) {
      setMessage("Your password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Your passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setMessage(
          "We couldn't update your password. Your recovery link may have expired. Please request a new one."
        );
        return;
      }

      setPassword("");
      setConfirmPassword("");
      setIsSuccess(true);
      setMessage("Your password has been updated successfully.");
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="section">
      <div className="auth-card">
        <h1>Reset your password</h1>

        {isSuccess ? (
          <div className="stack-md">
            <p role="status" aria-live="polite" className="muted">
              {message}
            </p>

            <a href="/auth" className="button-primary">
              Return to sign in
            </a>
          </div>
        ) : (
          <>
            <p className="muted">
              Choose a new password for your account.
            </p>

            <form
              className="stack-md"
              onSubmit={(event) => {
                event.preventDefault();
                void updatePassword();
              }}
            >
              <label htmlFor="new-password">New password</label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
                disabled={isLoading}
              />

              <label htmlFor="confirm-password">
                Confirm new password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                minLength={8}
                required
                disabled={isLoading}
              />

              <button
                className="button-primary"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Updating password..." : "Update password"}
              </button>

              {message && (
                <p role="alert" aria-live="polite" className="muted">
                  {message}
                </p>
              )}
            </form>
          </>
        )}
      </div>
    </section>
  );
}
