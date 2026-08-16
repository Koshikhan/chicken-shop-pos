"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendResetEmail = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      const supabase = createClient();

      const callbackUrl =
        `${window.location.origin}/auth/callback?next=/update-password`;

      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(
          email.trim().toLowerCase(),
          {
            redirectTo: callbackUrl,
          },
        );

      if (resetError) {
        throw new Error(resetError.message);
      }

      setMessage(
        "If an account exists for that email, a password reset link has been sent. Check your inbox and spam folder.",
      );
    } catch (resetError) {
      setError(
        resetError instanceof Error
          ? resetError.message
          : "Unable to request a password reset.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-5 text-slate-950">
      <section className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="bg-gradient-to-br from-orange-500 to-orange-600 p-8 text-white">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-orange-100">
            KAY POS
          </p>
          <h1 className="mt-3 text-3xl font-black">
            Reset your password
          </h1>
          <p className="mt-2 text-sm text-orange-100">
            Enter the email address used for your KAY POS account.
          </p>
        </header>

        <form onSubmit={sendResetEmail} className="p-7">
          <label className="block">
            <span className="text-sm font-bold text-slate-700">
              Email
            </span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              disabled={isLoading}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@business.com"
              className="mt-2 w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none focus:border-orange-500 disabled:bg-slate-100"
            />
          </label>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
              {error}
            </p>
          )}

          {message && (
            <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm font-bold text-green-700">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 w-full rounded-xl bg-slate-950 px-5 py-4 font-black text-white transition hover:bg-slate-800 disabled:bg-slate-400"
          >
            {isLoading ? "Sending reset email..." : "Send reset email"}
          </button>

          <p className="mt-6 text-center text-sm text-slate-500">
            Remembered your password?{" "}
            <Link
              href="/login"
              className="font-black text-orange-600 hover:text-orange-700"
            >
              Back to sign in
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
