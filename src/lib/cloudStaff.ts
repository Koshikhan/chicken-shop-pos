"use client";

import {
  createClient,
} from "@/lib/supabase/client";

import type {
  StaffMember,
  StaffRole,
} from "@/lib/staffStorage";

type VerifyStaffRow = {
  staff_id: string;
  staff_name: string;
  staff_role: string;
  location_id: string | null;
};

type StaffListRow = {
  id: string;
  name: string;
  role: string;
  location_id: string | null;
  is_active: boolean;
};

function toStaffRole(
  value: string,
): StaffRole {
  if (
    value === "Manager" ||
    value === "Supervisor" ||
    value === "Cashier"
  ) {
    return value;
  }

  throw new Error(
    `Unsupported staff role: ${value}`,
  );
}

export async function verifyCloudStaffPin(
  pin: string,
): Promise<StaffMember | null> {
  if (
    !/^\d{4}$/.test(
      pin,
    )
  ) {
    return null;
  }

  const supabase =
    createClient();

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "verify_pos_staff_pin",
      {
        p_pin: pin,
      },
    );

  if (error) {
    throw new Error(
      error.message,
    );
  }

  const row =
    (
      Array.isArray(data)
        ? data[0]
        : data
    ) as VerifyStaffRow | undefined;

  if (
    !row ||
    !row.staff_id
  ) {
    return null;
  }

  return {
    id:
      String(
        row.staff_id,
      ),

    name:
      String(
        row.staff_name,
      ),

    role:
      toStaffRole(
        String(
          row.staff_role,
        ),
      ),

    locationId:
      row.location_id
        ? String(
            row.location_id,
          )
        : null,
  };
}

/**
 * Re-check a cached till operator against Supabase after a refresh.
 * This prevents a staff member who was disabled on another device
 * from remaining trusted indefinitely on this till.
 */
export async function validateCloudStaffSession(
  staffId: string,
): Promise<StaffMember | null> {
  const supabase =
    createClient();

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "list_pos_staff",
    );

  if (error) {
    throw new Error(
      error.message,
    );
  }

  const rows =
    (
      Array.isArray(data)
        ? data
        : []
    ) as StaffListRow[];

  const row =
    rows.find(
      (staff) =>
        String(staff.id) ===
          staffId &&
        staff.is_active ===
          true,
    );

  if (!row) {
    return null;
  }

  return {
    id:
      String(
        row.id,
      ),

    name:
      String(
        row.name,
      ),

    role:
      toStaffRole(
        String(
          row.role,
        ),
      ),

    locationId:
      row.location_id
        ? String(
            row.location_id,
          )
        : null,
  };
}
