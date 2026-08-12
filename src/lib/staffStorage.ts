"use client";

export type StaffRole =
  | "Manager"
  | "Supervisor"
  | "Cashier";

export type StaffMember = {
  // Supabase pos_staff UUID.
  id: string;

  name: string;

  role: StaffRole;

  locationId?: string | null;
};

const ACTIVE_STAFF_KEY =
  "chicken-shop-pos-active-staff-session";

function isStaffRole(
  value: unknown,
): value is StaffRole {
  return (
    value === "Manager" ||
    value === "Supervisor" ||
    value === "Cashier"
  );
}

function isStaffMember(
  value: unknown,
): value is StaffMember {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return false;
  }

  const candidate =
    value as Partial<StaffMember>;

  return (
    typeof candidate.id ===
      "string" &&
    candidate.id.length > 0 &&
    typeof candidate.name ===
      "string" &&
    candidate.name.length > 0 &&
    isStaffRole(
      candidate.role,
    )
  );
}

/**
 * The active till operator is a device/session concern,
 * not business master data.
 *
 * Staff master data and PINs now live in Supabase.
 * We keep only the already-verified operator identity in
 * sessionStorage so a browser refresh does not immediately
 * sign the cashier out.
 *
 * Closing the browser tab/window ends this local staff session.
 */
export function saveActiveStaff(
  staff: StaffMember,
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  window.sessionStorage.setItem(
    ACTIVE_STAFF_KEY,
    JSON.stringify(staff),
  );

  // Remove the old MVP localStorage session if it exists.
  window.localStorage.removeItem(
    "chicken-shop-pos-active-staff",
  );
}

export function loadActiveStaff():
  StaffMember | null {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  const raw =
    window.sessionStorage.getItem(
      ACTIVE_STAFF_KEY,
    );

  if (!raw) {
    return null;
  }

  try {
    const parsed:
      unknown =
      JSON.parse(raw);

    if (
      !isStaffMember(
        parsed,
      )
    ) {
      clearActiveStaff();
      return null;
    }

    return parsed;
  } catch {
    clearActiveStaff();
    return null;
  }
}

export function clearActiveStaff() {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  window.sessionStorage.removeItem(
    ACTIVE_STAFF_KEY,
  );

  // Also clear the legacy MVP key so an old hard-coded
  // staff session cannot come back.
  window.localStorage.removeItem(
    "chicken-shop-pos-active-staff",
  );
}
