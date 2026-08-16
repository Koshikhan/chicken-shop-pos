"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router =
    useRouter();

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    isCheckingSession,
    setIsCheckingSession,
  ] =
    useState(true);

  const [
    hasSession,
    setHasSession,
  ] =
    useState(false);

  const [
    isSaving,
    setIsSaving,
  ] =
    useState(false);

  useEffect(() => {
    let cancelled =
      false;

    const checkSession =
      async () => {
        try {
          const supabase =
            createClient();

          const {
            data,
            error:
              userError,
          } =
            await supabase.auth.getUser();

          if (
            cancelled
          ) {
            return;
          }

          if (
            userError ||
            !data.user
          ) {
            setHasSession(
              false,
            );

            setError(
              "This account setup or password reset link is invalid or has expired.",
            );

            return;
          }

          setHasSession(
            true,
          );
        } catch (
          sessionError
        ) {
          if (
            !cancelled
          ) {
            setHasSession(
              false,
            );

            setError(
              sessionError instanceof
                Error
                ? sessionError.message
                : "Unable to verify this account link.",
            );
          }
        } finally {
          if (
            !cancelled
          ) {
            setIsCheckingSession(
              false,
            );
          }
        }
      };

    void checkSession();

    return () => {
      cancelled =
        true;
    };
  }, []);

  const updatePassword =
    async (
      event:
        React.FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      setError("");

      if (
        password.length <
        8
      ) {
        setError(
          "Use at least 8 characters for your password.",
        );

        return;
      }

      if (
        password !==
        confirmPassword
      ) {
        setError(
          "Passwords do not match.",
        );

        return;
      }

      if (
        !hasSession
      ) {
        setError(
          "Open a valid KAY POS invitation or password reset link first.",
        );

        return;
      }

      setIsSaving(
        true,
      );

      try {
        const supabase =
          createClient();

        const {
          error:
            updateError,
        } =
          await supabase.auth.updateUser(
            {
              password,
            },
          );

        if (updateError) {
          throw new Error(
            updateError.message,
          );
        }

        window.sessionStorage.clear();

        await supabase.auth.signOut();

        router.replace(
          "/login",
        );

        router.refresh();
      } catch (
        updateError
      ) {
        setError(
          updateError instanceof
            Error
            ? updateError.message
            : "Unable to save your password.",
        );
      } finally {
        setIsSaving(
          false,
        );
      }
    };

  if (
    isCheckingSession
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
        <p className="font-bold">
          Verifying account
          link...
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-5 text-slate-950">
      <section className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="bg-gradient-to-br from-orange-500 to-orange-600 p-8 text-white">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-orange-100">
            KAY POS
          </p>

          <h1 className="mt-3 text-3xl font-black">
            Set your password
          </h1>

          <p className="mt-2 text-sm text-orange-100">
            Choose the password
            you will use to sign
            in to KAY POS.
          </p>
        </header>

        <form
          onSubmit={
            updatePassword
          }
          className="p-7"
        >
          {hasSession && (
            <>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Password
                </span>

                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={
                    password
                  }
                  disabled={
                    isSaving
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

              <label className="mt-4 block">
                <span className="text-sm font-bold text-slate-700">
                  Confirm password
                </span>

                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={
                    confirmPassword
                  }
                  disabled={
                    isSaving
                  }
                  onChange={(
                    event,
                  ) =>
                    setConfirmPassword(
                      event.target
                        .value,
                    )
                  }
                  className="mt-2 w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none focus:border-orange-500 disabled:bg-slate-100"
                />
              </label>
            </>
          )}

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
              {
                error
              }
            </p>
          )}

          {hasSession ? (
            <button
              type="submit"
              disabled={
                isSaving
              }
              className="mt-6 w-full rounded-xl bg-slate-950 px-5 py-4 font-black text-white transition hover:bg-slate-800 disabled:bg-slate-400"
            >
              {isSaving
                ? "Saving password..."
                : "Set password"}
            </button>
          ) : (
            <div className="mt-6 space-y-3">
              <p className="text-center text-sm text-slate-500">
                If this was a
                client invitation,
                ask KAY POS to
                resend it.
              </p>

              <Link
                href="/forgot-password"
                className="block w-full rounded-xl bg-orange-500 px-5 py-4 text-center font-black text-white transition hover:bg-orange-600"
              >
                Forgot password
              </Link>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-slate-500">
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
