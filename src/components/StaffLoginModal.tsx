"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  verifyCloudStaffPin,
} from "@/lib/cloudStaff";

import type {
  StaffMember,
} from "@/lib/staffStorage";

type StaffLoginModalProps = {
  isOpen: boolean;

  onLogin: (
    staff: StaffMember,
  ) => void;
};

const keypadRows = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
] as const;

export function StaffLoginModal({
  isOpen,
  onLogin,
}: StaffLoginModalProps) {
  const [
    pin,
    setPin,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    isChecking,
    setIsChecking,
  ] =
    useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setPin("");
    setError("");
    setIsChecking(
      false,
    );
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const submitPin =
    async (
      pinToCheck:
        string,
    ) => {
      if (
        pinToCheck.length !==
        4 ||
        isChecking
      ) {
        return;
      }

      setIsChecking(
        true,
      );

      setError("");

      try {
        const staff =
          await verifyCloudStaffPin(
            pinToCheck,
          );

        if (!staff) {
          setPin("");

          setError(
            "Incorrect or inactive staff PIN.",
          );

          return;
        }

        setPin("");

        onLogin(
          staff,
        );
      } catch (
        verificationError
      ) {
        setPin("");

        setError(
          verificationError instanceof
            Error
            ? `Unable to verify PIN. ${verificationError.message}`
            : "Unable to verify PIN with Supabase.",
        );
      } finally {
        setIsChecking(
          false,
        );
      }
    };

  const addDigit = (
    digit: string,
  ) => {
    if (
      isChecking ||
      pin.length >= 4
    ) {
      return;
    }

    const nextPin =
      `${pin}${digit}`;

    setPin(
      nextPin,
    );

    setError("");

    if (
      nextPin.length === 4
    ) {
      void submitPin(
        nextPin,
      );
    }
  };

  const removeDigit =
    () => {
      if (isChecking) {
        return;
      }

      setPin(
        (current) =>
          current.slice(
            0,
            -1,
          ),
      );

      setError("");
    };

  const clearPin =
    () => {
      if (isChecking) {
        return;
      }

      setPin("");
      setError("");
    };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Staff PIN login"
    >
      <section className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="bg-slate-950 px-7 py-6 text-center text-white">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-orange-400">
            Chicken Shop POS
          </p>

          <h2 className="mt-2 text-2xl font-black">
            Staff Sign In
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Enter your 4-digit
            staff PIN.
          </p>
        </header>

        <div className="p-7">
          <div className="flex justify-center gap-4">
            {[0, 1, 2, 3].map(
              (index) => (
                <span
                  key={index}
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl border-2 text-2xl font-black ${
                    pin.length >
                    index
                      ? "border-orange-500 bg-orange-50 text-orange-600"
                      : "border-slate-200 bg-slate-50 text-slate-300"
                  }`}
                >
                  {pin.length >
                  index
                    ? "●"
                    : "○"}
                </span>
              ),
            )}
          </div>

          <div className="mt-7 space-y-3">
            {keypadRows.map(
              (
                row,
                rowIndex,
              ) => (
                <div
                  key={
                    rowIndex
                  }
                  className="grid grid-cols-3 gap-3"
                >
                  {row.map(
                    (digit) => (
                      <button
                        key={
                          digit
                        }
                        type="button"
                        disabled={
                          isChecking
                        }
                        onClick={() =>
                          addDigit(
                            digit,
                          )
                        }
                        className="rounded-2xl bg-slate-100 py-5 text-2xl font-black text-slate-950 transition hover:bg-slate-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {
                          digit
                        }
                      </button>
                    ),
                  )}
                </div>
              ),
            )}

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                disabled={
                  isChecking
                }
                onClick={
                  clearPin
                }
                className="rounded-2xl bg-red-50 py-5 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:opacity-50"
              >
                Clear
              </button>

              <button
                type="button"
                disabled={
                  isChecking
                }
                onClick={() =>
                  addDigit(
                    "0",
                  )
                }
                className="rounded-2xl bg-slate-100 py-5 text-2xl font-black text-slate-950 transition hover:bg-slate-200 disabled:opacity-50"
              >
                0
              </button>

              <button
                type="button"
                disabled={
                  isChecking
                }
                onClick={
                  removeDigit
                }
                className="rounded-2xl bg-slate-100 py-5 text-xl font-black text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
                aria-label="Delete last PIN digit"
              >
                ←
              </button>
            </div>
          </div>

          {isChecking && (
            <p className="mt-5 rounded-xl bg-blue-50 p-3 text-center text-sm font-bold text-blue-700">
              Checking staff PIN
              with Supabase...
            </p>
          )}

          {error && (
            <p className="mt-5 rounded-xl bg-red-50 p-3 text-center text-sm font-bold text-red-700">
              {error}
            </p>
          )}

          <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-center">
            <p className="text-xs font-semibold text-slate-500">
              Staff PINs are
              verified securely
              against the active
              branch. The PIN
              itself is not stored
              in this browser.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
