"use client";

import {
  useEffect,
  useState,
} from "react";

import type {
  StaffMember,
} from "@/lib/staffStorage";

type StaffLoginModalProps = {
  isOpen: boolean;
  staffMembers: StaffMember[];
  onLogin: (
    staff: StaffMember,
  ) => void;
};

const keypadValues = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "Clear",
  "0",
  "⌫",
] as const;

export function StaffLoginModal({
  isOpen,
  staffMembers,
  onLogin,
}: StaffLoginModalProps) {
  const [selectedStaffId, setSelectedStaffId] =
    useState(
      staffMembers[0]?.id ?? "",
    );

  const [pin, setPin] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setPin("");
    setError("");
  }, [isOpen, selectedStaffId]);

  if (!isOpen) {
    return null;
  }

  const selectedStaff =
    staffMembers.find(
      (staff) =>
        staff.id === selectedStaffId,
    ) ?? staffMembers[0];

  const handleKeypadPress = (
    value: string,
  ) => {
    setError("");

    if (value === "Clear") {
      setPin("");
      return;
    }

    if (value === "⌫") {
      setPin((currentPin) =>
        currentPin.slice(0, -1),
      );
      return;
    }

    setPin((currentPin) => {
      if (currentPin.length >= 6) {
        return currentPin;
      }

      return `${currentPin}${value}`;
    });
  };

  const submitLogin = () => {
    if (!selectedStaff) {
      setError(
        "Please select a staff member.",
      );
      return;
    }

    if (pin !== selectedStaff.pin) {
      setError(
        "Incorrect PIN. Please try again.",
      );
      setPin("");
      return;
    }

    onLogin(selectedStaff);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Staff login"
    >
      <section className="w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="grid md:grid-cols-[1.1fr_0.9fr]">
          <div className="border-b border-slate-200 p-7 md:border-b-0 md:border-r">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-orange-500">
              Chicken Shop POS
            </p>

            <h1 className="mt-2 text-3xl font-black text-slate-950">
              Staff sign in
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Select your staff account and enter your PIN.
            </p>

            <div className="mt-6 space-y-3">
              {staffMembers.map(
                (staff) => {
                  const isSelected =
                    staff.id ===
                    selectedStaffId;

                  return (
                    <button
                      key={staff.id}
                      type="button"
                      onClick={() =>
                        setSelectedStaffId(
                          staff.id,
                        )
                      }
                      className={`flex w-full items-center justify-between rounded-2xl border-2 p-4 text-left transition ${
                        isSelected
                          ? "border-orange-500 bg-orange-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-lg font-black text-white">
                          {staff.name
                            .slice(0, 1)
                            .toUpperCase()}
                        </div>

                        <div>
                          <p className="font-black text-slate-950">
                            {staff.name}
                          </p>

                          <p className="text-sm text-slate-500">
                            {staff.role}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`h-5 w-5 rounded-full border-4 ${
                          isSelected
                            ? "border-orange-500 bg-white"
                            : "border-slate-300"
                        }`}
                      />
                    </button>
                  );
                },
              )}
            </div>

            <div className="mt-6 rounded-2xl bg-slate-100 p-4 text-sm text-slate-600">
              <p className="font-black text-slate-800">
                Demo PINs
              </p>
              <p className="mt-1">
                Manager 1234 · Supervisor 2468 · Cashier 1111
              </p>
            </div>
          </div>

          <div className="p-7">
            <p className="font-black text-slate-950">
              Enter PIN for {selectedStaff?.name ?? "staff"}
            </p>

            <div className="mt-4 flex min-h-16 items-center justify-center gap-3 rounded-2xl bg-slate-100 px-4">
              {Array.from({ length: 4 }).map(
                (_, index) => (
                  <span
                    key={index}
                    className={`h-4 w-4 rounded-full ${
                      index < pin.length
                        ? "bg-slate-950"
                        : "bg-slate-300"
                    }`}
                  />
                ),
              )}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              {keypadValues.map(
                (value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      handleKeypadPress(
                        value,
                      )
                    }
                    className={`min-h-16 rounded-2xl text-xl font-black transition active:scale-95 ${
                      value === "Clear"
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : value === "⌫"
                          ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                          : "bg-slate-950 text-white hover:bg-slate-800"
                    }`}
                  >
                    {value}
                  </button>
                ),
              )}
            </div>

            {error && (
              <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={submitLogin}
              disabled={pin.length < 4}
              className="mt-5 w-full rounded-2xl bg-orange-500 px-5 py-4 text-lg font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Sign in
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
