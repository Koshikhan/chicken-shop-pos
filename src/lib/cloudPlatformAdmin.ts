"use client";

import {
  createClient,
} from "@/lib/supabase/client";

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

export async function isPlatformAdmin() {
  const supabase =
    createClient();

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "is_pos_platform_admin",
    );

  if (error) {
    throw new Error(
      error.message,
    );
  }

  return Boolean(data);
}

export async function listPlatformBusinesses():
  Promise<PlatformBusinessSummary[]> {
  const supabase =
    createClient();

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "admin_list_pos_businesses",
    );

  if (error) {
    throw new Error(
      error.message,
    );
  }

  return (
    Array.isArray(data)
      ? data
      : []
  ).map(
    (row) => ({
      businessId:
        String(
          row.business_id,
        ),

      businessName:
        String(
          row.business_name,
        ),

      slug:
        String(
          row.slug,
        ),

      businessType:
        String(
          row.business_type,
        ),

      posTemplate:
        String(
          row.pos_template,
        ),

      locationsCount:
        Number(
          row.locations_count ??
            0,
        ),

      staffCount:
        Number(
          row.staff_count ??
            0,
        ),

      membersCount:
        Number(
          row.members_count ??
            0,
        ),
    }),
  );
}
