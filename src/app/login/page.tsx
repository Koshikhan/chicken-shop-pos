"use client";

import Link from "next/link";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  getPosOnboardingStatus,
} from "@/lib/cloudOnboarding";

import {
  isPlatformAdmin,
} from "@/lib/cloudPlatformAdmin";

import {
  createClient,
} from "@/lib/supabase/client";

export default function LoginPage() {
  const router =
    useRouter();

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const handleLogin =
    async (
      event:
        React.FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      setError("");
      setIsLoading(
        true,
      );

      try {
        const supabase =
          createClient();

        const {
          error:
            signInError,
        } =
          await supabase.auth.signInWithPassword(
            {
              email:
                email
                  .trim()
                  .toLowerCase(),

              password,
            },
          );

        if (signInError) {
          throw new Error(
            signInError.message,
          );
        }

        const platformAdmin =
          await isPlatformAdmin();

        if (platformAdmin) {
          router.replace(
            "/admin",
          );

          router.refresh();

          return;
        }

        const status =
          await getPosOnboardingStatus();

        if (
          !status.hasBusiness
        ) {
          await supabase.auth.signOut();

          throw new Error(
            "This account is not assigned to a KAY POS business. Please contact KAY POS support.",
          );
        }

        router.replace(
          "/",
        );

        router.refresh();
      } catch (
        loginError
      ) {
        setError(
          loginError instanceof
            Error
            ? loginError.message
            : "Unable to sign in.",
        );
      } finally {
        setIsLoading(
          false,
        );
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
            Welcome back
          </h1>

          <p className="mt-2 text-sm text-orange-100">
            Sign in to your
            business workspace.
          </p>
        </header>

        <form
          onSubmit={
            handleLogin
          }
          className="p-7"
        >
          <label className="block">
            <span className="text-sm font-bold text-slate-700">
              Email
            </span>

            <input
              type="email"
              required
              autoComplete="email"
              value={
                email
              }
              disabled={
                isLoading
              }
              onChange={(
                event,
              ) =>
                setEmail(
                  event.target
                    .value,
                )
              }
              className="mt-2 w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none focus:border-orange-500 disabled:bg-slate-100"
              placeholder="you@business.com"
            />
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-bold text-slate-700">
              Password
            </span>

            <input
              type="password"
              required
              autoComplete="current-password"
              value={
                password
              }
              disabled={
                isLoading
              }
              onChange={(
                event,
              ) =>
                setPassword(
                  event.target
                    .value,
                )
              }
              className="mt-2 w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none focus:border-orange-500 disabled:bg-slate-100"
            />
          </label>

          <div className="mt-3 text-right">
            <Link
              href="/forgot-password"
              className="text-sm font-black text-orange-600 hover:text-orange-700"
            >
              Forgot password?
            </Link>
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={
              isLoading
            }
            className="mt-6 w-full rounded-xl bg-slate-950 px-5 py-4 font-black text-white transition hover:bg-slate-800 disabled:bg-slate-400"
          >
            {isLoading
              ? "Signing in..."
              : "Sign in"}
          </button>

          <p className="mt-6 text-center text-sm text-slate-500">
            Need a KAY POS account?
            Business accounts are
            created by KAY POS
            during onboarding.
          </p>
        </form>
      </section>
    </main>
  );
}