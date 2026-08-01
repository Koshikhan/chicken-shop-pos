export type StaffRole =
  | "Cashier"
  | "Supervisor"
  | "Manager";

export type StaffMember = {
  id: string;
  name: string;
  role: StaffRole;
  pin: string;
};

export const DEMO_STAFF: StaffMember[] = [
  {
    id: "staff-kay",
    name: "Kay",
    role: "Manager",
    pin: "1234",
  },
  {
    id: "staff-sam",
    name: "Sam",
    role: "Supervisor",
    pin: "2468",
  },
  {
    id: "staff-alex",
    name: "Alex",
    role: "Cashier",
    pin: "1111",
  },
];

const ACTIVE_STAFF_KEY =
  "chicken-shop-pos-active-staff";

export function loadActiveStaff():
  StaffMember | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedStaff =
      window.sessionStorage.getItem(
        ACTIVE_STAFF_KEY,
      );

    if (!storedStaff) {
      return null;
    }

    const storedStaffId =
      JSON.parse(
        storedStaff,
      ) as string;

    const matchingStaff =
      DEMO_STAFF.find(
        (staff) =>
          staff.id === storedStaffId,
      );

    return matchingStaff ?? null;
  } catch (error) {
    console.error(
      "Unable to load active staff:",
      error,
    );

    return null;
  }
}

export function saveActiveStaff(
  staff: StaffMember,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    ACTIVE_STAFF_KEY,
    JSON.stringify(staff.id),
  );
}

export function clearActiveStaff() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(
    ACTIVE_STAFF_KEY,
  );
}