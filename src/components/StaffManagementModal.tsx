"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  changeCloudStaffPin,
  createCloudStaff,
  listCloudStaff,
  loadCloudStaffLocations,
  updateCloudStaff,
  type CloudStaffLocation,
  type CloudStaffRecord,
} from "@/lib/cloudStaff";

import type {
  StaffMember,
  StaffRole,
} from "@/lib/staffStorage";

type StaffManagementModalProps = {
  isOpen: boolean;
  activeStaff: StaffMember | null;
  onActiveStaffChange: (
    staff: StaffMember,
  ) => void;
  onClose: () => void;
};

type StaffForm = {
  id: string | null;
  name: string;
  role: StaffRole;
  locationId: string;
  isActive: boolean;
  pin: string;
};

const emptyForm: StaffForm = {
  id: null,
  name: "",
  role: "Cashier",
  locationId: "",
  isActive: true,
  pin: "",
};

const roleOrder:
  StaffRole[] = [
    "Manager",
    "Supervisor",
    "Cashier",
  ];

function getRoleClasses(
  role: StaffRole,
) {
  if (
    role === "Manager"
  ) {
    return "bg-orange-100 text-orange-800";
  }

  if (
    role === "Supervisor"
  ) {
    return "bg-blue-100 text-blue-800";
  }

  return "bg-slate-100 text-slate-700";
}

export function StaffManagementModal({
  isOpen,
  activeStaff,
  onActiveStaffChange,
  onClose,
}: StaffManagementModalProps) {
  const [
    staff,
    setStaff,
  ] =
    useState<
      CloudStaffRecord[]
    >([]);

  const [
    locations,
    setLocations,
  ] =
    useState<
      CloudStaffLocation[]
    >([]);

  const [
    form,
    setForm,
  ] =
    useState<StaffForm>(
      emptyForm,
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(false);

  const [
    isSaving,
    setIsSaving,
  ] =
    useState(false);

  const [
    pinResetStaff,
    setPinResetStaff,
  ] =
    useState<
      CloudStaffRecord | null
    >(null);

  const [
    newPin,
    setNewPin,
  ] =
    useState("");

  const [
    confirmPin,
    setConfirmPin,
  ] =
    useState("");

  const [
    isPinSaving,
    setIsPinSaving,
  ] =
    useState(false);

  const refreshStaff =
    async () => {
      const rows =
        await listCloudStaff();

      setStaff(
        rows,
      );

      return rows;
    };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;

    const initialise =
      async () => {
        setIsLoading(
          true,
        );

        setError("");
        setSuccess("");
        setSearch("");
        setForm(
          emptyForm,
        );

        try {
          const [
            staffRows,
            locationRows,
          ] =
            await Promise.all([
              listCloudStaff(),
              loadCloudStaffLocations(),
            ]);

          if (cancelled) {
            return;
          }

          setStaff(
            staffRows,
          );

          setLocations(
            locationRows,
          );

          setForm(
            (current) => ({
              ...current,
              locationId:
                activeStaff?.locationId ??
                locationRows[0]?.id ??
                "",
            }),
          );
        } catch (
          loadError
        ) {
          if (!cancelled) {
            setError(
              loadError instanceof
                Error
                ? loadError.message
                : "Unable to load cloud staff.",
            );
          }
        } finally {
          if (!cancelled) {
            setIsLoading(
              false,
            );
          }
        }
      };

    void initialise();

    return () => {
      cancelled = true;
    };
  }, [
    isOpen,
    activeStaff?.locationId,
  ]);

  const filteredStaff =
    useMemo(() => {
      const value =
        search
          .trim()
          .toLowerCase();

      const rows =
        value
          ? staff.filter(
              (member) =>
                member.name
                  .toLowerCase()
                  .includes(value) ||
                member.role
                  .toLowerCase()
                  .includes(value),
            )
          : staff;

      return [
        ...rows,
      ].sort(
        (
          first,
          second,
        ) => {
          const firstRole =
            roleOrder.indexOf(
              first.role,
            );

          const secondRole =
            roleOrder.indexOf(
              second.role,
            );

          if (
            first.isActive !==
            second.isActive
          ) {
            return first.isActive
              ? -1
              : 1;
          }

          if (
            firstRole !==
            secondRole
          ) {
            return (
              firstRole -
              secondRole
            );
          }

          return first.name.localeCompare(
            second.name,
          );
        },
      );
    }, [
      staff,
      search,
    ]);

  if (!isOpen) {
    return null;
  }

  const resetForm =
    () => {
      setForm({
        ...emptyForm,
        locationId:
          activeStaff?.locationId ??
          locations[0]?.id ??
          "",
      });

      setError("");
    };

  const editStaff = (
    member: CloudStaffRecord,
  ) => {
    setForm({
      id:
        member.id,

      name:
        member.name,

      role:
        member.role,

      locationId:
        member.locationId ??
        "",

      isActive:
        member.isActive,

      pin:
        "",
    });

    setError("");
    setSuccess("");
  };

  const saveStaff =
    async () => {
      if (
        !activeStaff ||
        activeStaff.role !==
          "Manager"
      ) {
        setError(
          "A Manager must be signed in.",
        );
        return;
      }

      const name =
        form.name.trim();

      if (!name) {
        setError(
          "Enter the staff member's name.",
        );
        return;
      }

      if (
        !form.locationId
      ) {
        setError(
          "Choose a branch.",
        );
        return;
      }

      const isNew =
        form.id === null;

      if (
        isNew &&
        !/^\d{4}$/.test(
          form.pin,
        )
      ) {
        setError(
          "New staff need a 4-digit PIN.",
        );
        return;
      }

      setIsSaving(
        true,
      );

      setError("");
      setSuccess("");

      try {
        if (isNew) {
          await createCloudStaff(
            {
              name,
              role:
                form.role,
              pin:
                form.pin,
              locationId:
                form.locationId,
            },
          );

          await refreshStaff();

          setSuccess(
            `${name} was added to the cloud staff list.`,
          );

          resetForm();
          return;
        }

        const currentRecord =
          staff.find(
            (member) =>
              member.id ===
              form.id,
          );

        if (!currentRecord) {
          throw new Error(
            "Staff member could not be found.",
          );
        }

        const isCurrentOperator =
          currentRecord.id ===
          activeStaff.id;

        // Keep the currently signed-in Manager from removing
        // their own access during the active till session.
        if (
          isCurrentOperator &&
          (
            form.role !==
              "Manager" ||
            !form.isActive
          )
        ) {
          throw new Error(
            "Switch to another Manager before changing your own Manager role or deactivating your own account.",
          );
        }

        await updateCloudStaff(
          {
            staffId:
              currentRecord.id,

            name,

            role:
              form.role,

            locationId:
              form.locationId,

            isActive:
              form.isActive,
          },
        );

        const rows =
          await refreshStaff();

        const updated =
          rows.find(
            (member) =>
              member.id ===
              currentRecord.id,
          );

        if (
          isCurrentOperator &&
          updated
        ) {
          onActiveStaffChange(
            {
              id:
                updated.id,

              name:
                updated.name,

              role:
                updated.role,

              locationId:
                updated.locationId,
            },
          );
        }

        setSuccess(
          `${name} was updated in Supabase.`,
        );

        resetForm();
      } catch (
        saveError
      ) {
        setError(
          saveError instanceof
            Error
            ? saveError.message
            : "Unable to save staff changes.",
        );
      } finally {
        setIsSaving(
          false,
        );
      }
    };

  const toggleActive =
    async (
      member: CloudStaffRecord,
    ) => {
      if (
        !activeStaff ||
        activeStaff.role !==
          "Manager"
      ) {
        setError(
          "A Manager must be signed in.",
        );
        return;
      }

      if (
        member.id ===
          activeStaff.id &&
        member.isActive
      ) {
        setError(
          "You cannot deactivate the Manager who is currently signed in. Switch to another Manager first.",
        );
        return;
      }

      setIsSaving(
        true,
      );

      setError("");
      setSuccess("");

      try {
        await updateCloudStaff(
          {
            staffId:
              member.id,

            name:
              member.name,

            role:
              member.role,

            locationId:
              member.locationId,

            isActive:
              !member.isActive,
          },
        );

        await refreshStaff();

        setSuccess(
          `${member.name} is now ${
            member.isActive
              ? "inactive"
              : "active"
          }.`,
        );

        if (
          form.id ===
          member.id
        ) {
          resetForm();
        }
      } catch (
        toggleError
      ) {
        setError(
          toggleError instanceof
            Error
            ? toggleError.message
            : "Unable to change staff status.",
        );
      } finally {
        setIsSaving(
          false,
        );
      }
    };

  const openPinReset = (
    member: CloudStaffRecord,
  ) => {
    setPinResetStaff(
      member,
    );

    setNewPin("");
    setConfirmPin("");
    setError("");
    setSuccess("");
  };

  const closePinReset =
    () => {
      if (isPinSaving) {
        return;
      }

      setPinResetStaff(
        null,
      );

      setNewPin("");
      setConfirmPin("");
    };

  const saveNewPin =
    async () => {
      if (!pinResetStaff) {
        return;
      }

      if (
        !/^\d{4}$/.test(
          newPin,
        )
      ) {
        setError(
          "PIN must contain exactly 4 digits.",
        );
        return;
      }

      if (
        newPin !==
        confirmPin
      ) {
        setError(
          "The PIN confirmation does not match.",
        );
        return;
      }

      setIsPinSaving(
        true,
      );

      setError("");
      setSuccess("");

      try {
        await changeCloudStaffPin(
          pinResetStaff.id,
          newPin,
        );

        const name =
          pinResetStaff.name;

        closePinReset();

        setSuccess(
          `${name}'s PIN was reset securely.`,
        );
      } catch (
        pinError
      ) {
        setError(
          pinError instanceof
            Error
            ? pinError.message
            : "Unable to reset the staff PIN.",
        );
      } finally {
        setIsPinSaving(
          false,
        );
      }
    };

  const getLocationName = (
    locationId:
      string | null,
  ) => {
    if (!locationId) {
      return "All / default branch";
    }

    const location =
      locations.find(
        (item) =>
          item.id ===
          locationId,
      );

    return location
      ? `${location.name} (${location.code})`
      : "Unknown branch";
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Staff management"
    >
      <section className="flex max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-slate-100 shadow-2xl">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 bg-white p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">
              Manager
            </p>

            <h2 className="mt-1 text-3xl font-black text-slate-950">
              Staff Management
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Add staff, assign
              roles, manage branch
              access and reset PINs.
            </p>
          </div>

          <button
            type="button"
            disabled={
              isSaving ||
              isPinSaving
            }
            onClick={
              onClose
            }
            className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-500 transition hover:bg-red-100 hover:text-red-600 disabled:opacity-50"
            aria-label="Close staff management"
          >
            ×
          </button>
        </header>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_400px]">
          <section className="min-h-0 overflow-y-auto p-5">
            {(error ||
              success) && (
              <div className="mb-4">
                {error && (
                  <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
                    {error}
                  </p>
                )}

                {success && (
                  <p className="rounded-xl bg-green-50 p-3 text-sm font-bold text-green-700">
                    {success}
                  </p>
                )}
              </div>
            )}

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <input
                type="search"
                value={
                  search
                }
                onChange={(
                  event,
                ) =>
                  setSearch(
                    event.target
                      .value,
                  )
                }
                placeholder="Search staff or role..."
                className="min-w-64 flex-1 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 font-semibold outline-none focus:border-orange-500"
              />

              <p className="text-sm font-bold text-slate-500">
                {
                  staff.filter(
                    (member) =>
                      member.isActive,
                  ).length
                }{" "}
                active
              </p>
            </div>

            {isLoading ? (
              <div className="rounded-2xl bg-white p-10 text-center font-bold text-slate-500">
                Loading staff from
                Supabase...
              </div>
            ) : (
              <div className="space-y-3">
                {filteredStaff.map(
                  (member) => (
                    <article
                      key={
                        member.id
                      }
                      className={`rounded-2xl border bg-white p-4 shadow-sm ${
                        member.isActive
                          ? "border-slate-200"
                          : "border-slate-200 opacity-65"
                      }`}
                    >
                      <div className="flex flex-wrap items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-lg font-black text-white">
                          {member.name
                            .charAt(
                              0,
                            )
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-black text-slate-950">
                              {
                                member.name
                              }
                            </h3>

                            {member.id ===
                              activeStaff?.id && (
                              <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
                                Signed in
                              </span>
                            )}

                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-bold ${getRoleClasses(
                                member.role,
                              )}`}
                            >
                              {
                                member.role
                              }
                            </span>

                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                                member.isActive
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {member.isActive
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </div>

                          <p className="mt-2 text-sm text-slate-500">
                            {
                              getLocationName(
                                member.locationId,
                              )
                            }
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={
                              isSaving
                            }
                            onClick={() =>
                              editStaff(
                                member,
                              )
                            }
                            className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            disabled={
                              isSaving
                            }
                            onClick={() =>
                              openPinReset(
                                member,
                              )
                            }
                            className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
                          >
                            Reset PIN
                          </button>

                          <button
                            type="button"
                            disabled={
                              isSaving
                            }
                            onClick={() => {
                              void toggleActive(
                                member,
                              );
                            }}
                            className={`rounded-lg px-3 py-2 text-sm font-bold transition disabled:opacity-50 ${
                              member.isActive
                                ? "bg-red-50 text-red-700 hover:bg-red-100"
                                : "bg-green-50 text-green-700 hover:bg-green-100"
                            }`}
                          >
                            {member.isActive
                              ? "Deactivate"
                              : "Reactivate"}
                          </button>
                        </div>
                      </div>
                    </article>
                  ),
                )}

                {filteredStaff.length ===
                  0 && (
                  <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
                    No staff match
                    your search.
                  </div>
                )}
              </div>
            )}
          </section>

          <aside className="overflow-y-auto border-l border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange-500">
                  Staff editor
                </p>

                <h3 className="mt-1 text-xl font-black">
                  {form.id
                    ? "Edit staff"
                    : "Add staff"}
                </h3>
              </div>

              {form.id && (
                <button
                  type="button"
                  disabled={
                    isSaving
                  }
                  onClick={
                    resetForm
                  }
                  className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700"
                >
                  Cancel
                </button>
              )}
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Staff name
                </span>

                <input
                  type="text"
                  value={
                    form.name
                  }
                  disabled={
                    isSaving
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        name:
                          event
                            .target
                            .value,
                      }),
                    )
                  }
                  className="mt-2 w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none focus:border-orange-500 disabled:bg-slate-100"
                  placeholder="Staff name"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Role
                </span>

                <select
                  value={
                    form.role
                  }
                  disabled={
                    isSaving ||
                    form.id ===
                      activeStaff?.id
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        role:
                          event
                            .target
                            .value as StaffRole,
                      }),
                    )
                  }
                  className="mt-2 w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 font-semibold outline-none focus:border-orange-500 disabled:bg-slate-100"
                >
                  <option value="Manager">
                    Manager
                  </option>

                  <option value="Supervisor">
                    Supervisor
                  </option>

                  <option value="Cashier">
                    Cashier
                  </option>
                </select>

                {form.id ===
                  activeStaff?.id && (
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    Switch to another
                    Manager before
                    changing your own
                    role.
                  </p>
                )}
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Branch
                </span>

                <select
                  value={
                    form.locationId
                  }
                  disabled={
                    isSaving
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        locationId:
                          event
                            .target
                            .value,
                      }),
                    )
                  }
                  className="mt-2 w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 font-semibold outline-none focus:border-orange-500 disabled:bg-slate-100"
                >
                  <option value="">
                    Choose branch
                  </option>

                  {locations.map(
                    (
                      location,
                    ) => (
                      <option
                        key={
                          location.id
                        }
                        value={
                          location.id
                        }
                      >
                        {
                          location.name
                        }{" "}
                        ({
                          location.code
                        })
                      </option>
                    ),
                  )}
                </select>
              </label>

              {!form.id && (
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">
                    4-digit PIN
                  </span>

                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={
                      form.pin
                    }
                    disabled={
                      isSaving
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,
                          pin:
                            event
                              .target
                              .value.replace(
                                /\D/g,
                                "",
                              )
                              .slice(
                                0,
                                4,
                              ),
                        }),
                      )
                    }
                    className="mt-2 w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-xl font-black tracking-[0.35em] outline-none focus:border-orange-500 disabled:bg-slate-100"
                    placeholder="••••"
                  />

                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    The PIN is hashed
                    in Supabase and is
                    never shown again.
                  </p>
                </label>
              )}

              {form.id && (
                <label className="flex items-center justify-between rounded-xl bg-slate-100 p-4">
                  <div>
                    <p className="font-bold">
                      Active account
                    </p>

                    <p className="text-xs text-slate-500">
                      Inactive staff
                      cannot sign in.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={
                      form.isActive
                    }
                    disabled={
                      isSaving ||
                      form.id ===
                        activeStaff?.id
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,
                          isActive:
                            event
                              .target
                              .checked,
                        }),
                      )
                    }
                    className="h-6 w-6 accent-orange-500"
                  />
                </label>
              )}

              <button
                type="button"
                disabled={
                  isSaving ||
                  isLoading
                }
                onClick={() => {
                  void saveStaff();
                }}
                className="w-full rounded-xl bg-orange-500 px-5 py-4 font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isSaving
                  ? "Saving to Supabase..."
                  : form.id
                    ? "Update staff"
                    : "Add staff"}
              </button>
            </div>
          </aside>
        </div>
      </section>

      {pinResetStaff && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/60 p-4">
          <section className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">
                  Security
                </p>

                <h3 className="mt-1 text-2xl font-black">
                  Reset PIN
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  {
                    pinResetStaff.name
                  }
                </p>
              </div>

              <button
                type="button"
                disabled={
                  isPinSaving
                }
                onClick={
                  closePinReset
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl"
              >
                ×
              </button>
            </div>

            <label className="mt-5 block">
              <span className="text-sm font-bold">
                New 4-digit PIN
              </span>

              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={
                  newPin
                }
                disabled={
                  isPinSaving
                }
                onChange={(
                  event,
                ) =>
                  setNewPin(
                    event.target.value
                      .replace(
                        /\D/g,
                        "",
                      )
                      .slice(
                        0,
                        4,
                      ),
                  )
                }
                className="mt-2 w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-xl font-black tracking-[0.35em] outline-none focus:border-blue-500"
                placeholder="••••"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-bold">
                Confirm PIN
              </span>

              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={
                  confirmPin
                }
                disabled={
                  isPinSaving
                }
                onChange={(
                  event,
                ) =>
                  setConfirmPin(
                    event.target.value
                      .replace(
                        /\D/g,
                        "",
                      )
                      .slice(
                        0,
                        4,
                      ),
                  )
                }
                className="mt-2 w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-xl font-black tracking-[0.35em] outline-none focus:border-blue-500"
                placeholder="••••"
              />
            </label>

            <button
              type="button"
              disabled={
                isPinSaving
              }
              onClick={() => {
                void saveNewPin();
              }}
              className="mt-5 w-full rounded-xl bg-blue-600 px-5 py-4 font-black text-white transition hover:bg-blue-700 disabled:bg-slate-300"
            >
              {isPinSaving
                ? "Resetting..."
                : "Reset PIN"}
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
