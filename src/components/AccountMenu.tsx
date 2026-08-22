"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/client";

import {
  clearActiveStaff,
  type StaffMember,
} from "@/lib/staffStorage";

type AccountMenuProps = {
  businessName: string;
  locationName: string;
  activeStaff: StaffMember | null;
  hasCurrentOrder: boolean;
  onSwitchStaff: () => void;
};

export function AccountMenu({
  businessName,
  locationName,
  activeStaff,
  hasCurrentOrder,
  onSwitchStaff,
}: AccountMenuProps) {
  const router =
    useRouter();

  const menuRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const [
    isOpen,
    setIsOpen,
  ] =
    useState(false);

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    isSigningOut,
    setIsSigningOut,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  useEffect(() => {
    let cancelled =
      false;

    const loadAccount =
      async () => {
        const supabase =
          createClient();

        const {
          data,
        } =
          await supabase.auth.getUser();

        if (
          !cancelled
        ) {
          setEmail(
            data.user?.email ??
              "",
          );
        }
      };

    void loadAccount();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handlePointerDown =
      (
        event:
          MouseEvent,
      ) => {
        if (
          !menuRef.current ||
          menuRef.current.contains(
            event.target as Node,
          )
        ) {
          return;
        }

        setIsOpen(
          false,
        );
      };

    document.addEventListener(
      "mousedown",
      handlePointerDown,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handlePointerDown,
      );
    };
  }, []);

  const switchStaff =
    () => {
      setIsOpen(
        false,
      );

      onSwitchStaff();
    };

  const signOut =
    async () => {
      if (
        hasCurrentOrder &&
        !window.confirm(
          "Signing out will clear the current order. Continue?",
        )
      ) {
        return;
      }

      setError("");
      setIsSigningOut(
        true,
      );

      try {
        const supabase =
          createClient();

        clearActiveStaff();

        const {
          error:
            signOutError,
        } =
          await supabase.auth.signOut();

        if (signOutError) {
          throw new Error(
            signOutError.message,
          );
        }

        router.replace(
          "/login",
        );

        router.refresh();
      } catch (
        signOutError
      ) {
        setError(
          signOutError instanceof
            Error
            ? signOutError.message
            : "Unable to sign out.",
        );

        setIsSigningOut(
          false,
        );
      }
    };

  return (
    <div
      ref={
        menuRef
      }
      className="relative"
    >
      <button
        type="button"
        onClick={() =>
          setIsOpen(
            (
              current,
            ) =>
              !current,
          )
        }
        className="rounded-xl bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/20"
      >
        Account
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-3 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white text-left text-slate-950 shadow-2xl">
          <div className="border-b border-slate-200 p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-500">
              Business Account
            </p>

            <p className="mt-2 text-lg font-black">
              {
                businessName
              }
            </p>

            <p className="mt-1 break-all text-sm font-semibold text-slate-500">
              {email ||
                "Loading account..."}
            </p>
          </div>

          <div className="border-b border-slate-200 p-5">
            <div className="grid gap-3 text-sm">
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">
                  Branch
                </p>

                <p className="mt-1 font-black">
                  {
                    locationName
                  }
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-slate-400">
                  Active staff
                </p>

                <p className="mt-1 font-black">
                  {activeStaff
                    ? `${activeStaff.name} · ${activeStaff.role}`
                    : "No staff signed in"}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <p className="m-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
              {
                error
              }
            </p>
          )}

          <div className="space-y-2 p-4">
            <button
              type="button"
              onClick={
                switchStaff
              }
              disabled={
                isSigningOut
              }
              className="w-full rounded-xl bg-slate-100 px-4 py-3 text-left text-sm font-black text-slate-800 transition hover:bg-slate-200 disabled:opacity-50"
            >
              Switch Staff
            </button>

            <button
              type="button"
              onClick={() => {
                void signOut();
              }}
              disabled={
                isSigningOut
              }
              className="w-full rounded-xl bg-red-50 px-4 py-3 text-left text-sm font-black text-red-700 transition hover:bg-red-100 disabled:opacity-50"
            >
              {isSigningOut
                ? "Signing out..."
                : "Sign out of business"}
            </button>
          </div>

          <div className="bg-slate-50 px-4 py-3 text-xs font-semibold leading-5 text-slate-500">
            Switching staff keeps
            this business signed in.
            Signing out returns to
            the KAY POS account
            login.
          </div>
        </div>
      )}
    </div>
  );
}
