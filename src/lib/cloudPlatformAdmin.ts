"use client";

import { createClient } from "@/lib/supabase/client";

export type PlatformBusinessSummary = {
  businessId: string;
  businessName: string;
  slug: string;
  businessType: string;
  posTemplate: string;
  locationsCount: number;
  staffCount: number;
  membersCount: number;
};

export type PlatformBusinessDetails = {
  business: {
    id: string;
    name: string;
    slug: string;
    businessType: string;
    posTemplate: string;
    businessStatus:
      "ACTIVE" | "SUSPENDED";
    currency: string;
    country: string;
    timezone: string;
    vatRegistered: boolean;
    receiptName: string;
    phone: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    postcode: string;
    vatNumber: string;
  };
  locations: Array<{ id: string; name: string; code: string }>;
  staff: Array<{ id: string; name: string; role: string; isActive: boolean; locationName: string | null }>;
  members: Array<{ userId: string; email: string; role: string; isActive: boolean; defaultLocationName: string | null }>;
  counts: { locations: number; activeStaff: number; activeLoginAccounts: number };
};

const text = (value: unknown) => typeof value === "string" ? value : "";
const nullableText = (value: unknown) => typeof value === "string" ? value : null;
const numberValue = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;

export async function isPlatformAdmin() {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("is_pos_platform_admin");
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function listPlatformBusinesses(): Promise<PlatformBusinessSummary[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("admin_list_pos_businesses");
  if (error) throw new Error(error.message);

  return (Array.isArray(data) ? data : []).map((row) => ({
    businessId: String(row.business_id),
    businessName: String(row.business_name),
    slug: String(row.slug),
    businessType: String(row.business_type),
    posTemplate: String(row.pos_template),
    locationsCount: Number(row.locations_count ?? 0),
    staffCount: Number(row.staff_count ?? 0),
    membersCount: Number(row.members_count ?? 0),
  }));
}

export async function getPlatformBusinessDetails(businessId: string): Promise<PlatformBusinessDetails> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("admin_get_pos_business_details", {
    p_business_id: businessId,
  });
  if (error) throw new Error(error.message);

  const raw = data && typeof data === "object" ? data as Record<string, unknown> : {};
  const b = raw.business && typeof raw.business === "object" ? raw.business as Record<string, unknown> : {};
  const c = raw.counts && typeof raw.counts === "object" ? raw.counts as Record<string, unknown> : {};
  const locations = Array.isArray(raw.locations) ? raw.locations : [];
  const staff = Array.isArray(raw.staff) ? raw.staff : [];
  const members = Array.isArray(raw.members) ? raw.members : [];

  return {
    business: {
      id: text(b.id), name: text(b.name), slug: text(b.slug),
      businessType: text(b.business_type), posTemplate: text(b.pos_template),
      businessStatus:
        b.account_status === "SUSPENDED"
          ? "SUSPENDED"
          : "ACTIVE",
      currency: text(b.currency), country: text(b.country), timezone: text(b.timezone),
      vatRegistered: Boolean(b.vat_registered), receiptName: text(b.receipt_name),
      phone: text(b.phone), addressLine1: text(b.address_line1), addressLine2: text(b.address_line2),
      city: text(b.city), postcode: text(b.postcode), vatNumber: text(b.vat_number),
    },
    locations: locations.map((row) => {
      const x = row as Record<string, unknown>;
      return { id: text(x.id), name: text(x.name), code: text(x.code) };
    }),
    staff: staff.map((row) => {
      const x = row as Record<string, unknown>;
      return { id: text(x.id), name: text(x.name), role: text(x.role), isActive: Boolean(x.is_active), locationName: nullableText(x.location_name) };
    }),
    members: members.map((row) => {
      const x = row as Record<string, unknown>;
      return { userId: text(x.user_id), email: text(x.email), role: text(x.role), isActive: Boolean(x.is_active), defaultLocationName: nullableText(x.default_location_name) };
    }),
    counts: {
      locations: numberValue(c.locations),
      activeStaff: numberValue(c.active_staff),
      activeLoginAccounts: numberValue(c.active_login_accounts),
    },
  };
}


export async function setPlatformBusinessStatus(
  businessId: string,
  status:
    "ACTIVE" | "SUSPENDED",
): Promise<
  "ACTIVE" | "SUSPENDED"
> {
  const supabase =
    createClient();

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "admin_set_pos_business_status",
      {
        p_business_id:
          businessId,

        p_status:
          status,
      },
    );

  if (error) {
    throw new Error(
      error.message,
    );
  }

  return data ===
    "SUSPENDED"
    ? "SUSPENDED"
    : "ACTIVE";
}
