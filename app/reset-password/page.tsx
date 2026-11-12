
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
    setIsSuccess(false);

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

      setIsSuccess(true);
      setMessage("Your password has been updated successfully.");
      setPassword("");
      setConfirmPassword("");
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

        <p className="muted">
          Choose a new password for your account.
        </p>

        <div className="stack-md">
          <label htmlFor="new-password">New password</label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
            disabled={isLoading || isSuccess}
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
            disabled={isLoading || isSuccess}
          />

          <button
            className="button-primary"
            type="button"
            onClick={updatePassword}
            disabled={isLoading || isSuccess}
          >
            {isLoading ? "Updating password..." : "Update password"}
          </button>

          {message && (
            <p
              role={isSuccess ? "status" : "alert"}
              aria-live="polite"
              className="muted"
            >
              {message}
            </p>
          )}

          {isSuccess && (
            <a href="/auth" className="button-primary">
              Return to sign in
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
