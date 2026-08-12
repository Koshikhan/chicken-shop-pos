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
  created_at?: string;
  updated_at?: string;
};

type StaffLocationRow = {
  id: string;
  name: string;
  code: string;
};

export type CloudStaffRecord = {
  id: string;
  name: string;
  role: StaffRole;
  locationId: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CloudStaffLocation = {
  id: string;
  name: string;
  code: string;
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

function mapStaffRow(
  row: StaffListRow,
): CloudStaffRecord {
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

    isActive:
      Boolean(
        row.is_active,
      ),

    createdAt:
      row.created_at
        ? String(
            row.created_at,
          )
        : undefined,

    updatedAt:
      row.updated_at
        ? String(
            row.updated_at,
          )
        : undefined,
  };
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

export async function listCloudStaff():
  Promise<CloudStaffRecord[]> {
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

  return rows.map(
    mapStaffRow,
  );
}

export async function validateCloudStaffSession(
  staffId: string,
): Promise<StaffMember | null> {
  const staff =
    (
      await listCloudStaff()
    ).find(
      (item) =>
        item.id ===
          staffId &&
        item.isActive,
    );

  if (!staff) {
    return null;
  }

  return {
    id:
      staff.id,

    name:
      staff.name,

    role:
      staff.role,

    locationId:
      staff.locationId,
  };
}

export async function loadCloudStaffLocations():
  Promise<CloudStaffLocation[]> {
  const supabase =
    createClient();

  const {
    data: userData,
    error: userError,
  } =
    await supabase.auth.getUser();

  if (
    userError ||
    !userData.user
  ) {
    throw new Error(
      "No authenticated Supabase user.",
    );
  }

  const {
    data: membership,
    error: membershipError,
  } =
    await supabase
      .from(
        "business_memberships",
      )
      .select(
        "business_id",
      )
      .eq(
        "user_id",
        userData.user.id,
      )
      .eq(
        "is_active",
        true,
      )
      .limit(1)
      .maybeSingle();

  if (
    membershipError ||
    !membership
  ) {
    throw new Error(
      membershipError?.message ??
        "No active business membership found.",
    );
  }

  const {
    data,
    error,
  } =
    await supabase
      .from("locations")
      .select(
        "id, name, code",
      )
      .eq(
        "business_id",
        membership.business_id,
      )
      .order(
        "name",
        {
          ascending: true,
        },
      );

  if (error) {
    throw new Error(
      error.message,
    );
  }

  return (
    (
      data ??
      []
    ) as StaffLocationRow[]
  ).map(
    (row) => ({
      id:
        String(
          row.id,
        ),

      name:
        String(
          row.name,
        ),

      code:
        String(
          row.code,
        ),
    }),
  );
}

export async function createCloudStaff(
  input: {
    name: string;
    role: StaffRole;
    pin: string;
    locationId: string | null;
  },
) {
  const supabase =
    createClient();

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "create_pos_staff",
      {
        p_name:
          input.name,

        p_role:
          input.role,

        p_pin:
          input.pin,

        p_location_id:
          input.locationId,
      },
    );

  if (error) {
    throw new Error(
      error.message,
    );
  }

  const result =
    Array.isArray(data)
      ? data[0]
      : data;

  if (
    !result ||
    !result.staff_id
  ) {
    throw new Error(
      "Supabase did not return the new staff member.",
    );
  }

  return String(
    result.staff_id,
  );
}

export async function updateCloudStaff(
  input: {
    staffId: string;
    name: string;
    role: StaffRole;
    locationId: string | null;
    isActive: boolean;
  },
) {
  const supabase =
    createClient();

  const {
    error,
  } =
    await supabase.rpc(
      "update_pos_staff",
      {
        p_staff_id:
          input.staffId,

        p_name:
          input.name,

        p_role:
          input.role,

        p_location_id:
          input.locationId,

        p_is_active:
          input.isActive,
      },
    );

  if (error) {
    throw new Error(
      error.message,
    );
  }
}

export async function changeCloudStaffPin(
  staffId: string,
  newPin: string,
) {
  if (
    !/^\d{4}$/.test(
      newPin,
    )
  ) {
    throw new Error(
      "PIN must contain exactly 4 digits.",
    );
  }

  const supabase =
    createClient();

  const {
    error,
  } =
    await supabase.rpc(
      "change_pos_staff_pin",
      {
        p_staff_id:
          staffId,

        p_new_pin:
          newPin,
      },
    );

  if (error) {
    throw new Error(
      error.message,
    );
  }
}
