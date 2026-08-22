"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  getPosOnboardingStatus,
} from "@/lib/cloudOnboarding";

import {
  createClient,
} from "@/lib/supabase/client";

export default function SuspendedPage() {
  const router =
    useRouter();

  const [
    businessName,
    setBusinessName,
  ] =
    useState(
      "Your business",
    );

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  useEffect(() => {
    let cancelled =
      false;

    const load =
      async () => {
        try {
          const status =
            await getPosOnboardingStatus();

          if (
            cancelled
          ) {
            return;
          }

          if (
            !status.hasBusiness
          ) {
            router.replace(
              "/login",
            );

            return;
          }

          if (
            status.businessStatus !==
            "SUSPENDED"
          ) {
            router.replace(
              "/",
            );

            return;
          }

          setBusinessName(
            status.businessName ??
              "Your business",
          );
        } catch (
          loadError
        ) {
          if (
            !cancelled
          ) {
            setError(
              loadError instanceof
                Error
                ? loadError.message
                : "Unable to check this business account.",
            );
          }
        } finally {
          if (
            !cancelled
          ) {
            setIsLoading(
              false,
            );
          }
        }
      };

    void load();

    return () => {
      cancelled = true;
    };
  }, [
    router,
  ]);

  const signOut =
    async () => {
      const supabase =
        createClient();

      await supabase.auth.signOut();

      window.sessionStorage.clear();

      router.replace(
        "/login",
      );

      router.refresh();
    };

  if (
    isLoading
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
        <p className="font-bold">
          Checking business
          account...
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-5 text-slate-950">
      <section className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="bg-gradient-to-br from-orange-500 to-orange-600 p-8 text-white">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-orange-100">
            KAY POS
          </p>

          <h1 className="mt-3 text-3xl font-black">
            Business account suspended
          </h1>
        </header>

        <div className="p-7">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            Business
          </p>

          <p className="mt-2 text-2xl font-black">
            {
              businessName
            }
          </p>

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="font-black text-amber-950">
              POS access is temporarily unavailable.
            </p>

            <p className="mt-2 text-sm font-semibold leading-6 text-amber-800">
              No business data has
              been deleted. Please
              contact KAY POS if you
              believe this account
              should be active.
            </p>
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">
              {
                error
              }
            </p>
          )}

          <button
            type="button"
            onClick={() => {
              void signOut();
            }}
            className="mt-6 w-full rounded-xl bg-slate-950 px-5 py-4 font-black text-white transition hover:bg-slate-800"
          >
            Sign out
          </button>
        </div>
      </section>
    </main>
  );
}
