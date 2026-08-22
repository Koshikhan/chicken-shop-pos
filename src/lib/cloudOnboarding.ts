"use client";

import {
  createClient,
} from "@/lib/supabase/client";

export type OnboardingBusinessType =
  | "FAST_FOOD"
  | "DELI"
  | "RESTAURANT"
  | "RETAIL";

export type BusinessAccountStatus =
  | "ACTIVE"
  | "SUSPENDED";

export type PosOnboardingStatus = {
  hasBusiness: boolean;
  businessId: string | null;
  businessName: string | null;
  posTemplate:
    OnboardingBusinessType | null;
  businessStatus:
    BusinessAccountStatus | null;
};

export async function getPosOnboardingStatus():
  Promise<PosOnboardingStatus> {
  const supabase =
    createClient();

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "get_pos_onboarding_status",
    );

  if (error) {
    throw new Error(
      error.message,
    );
  }

  const row =
    Array.isArray(data)
      ? data[0]
      : data;

  if (!row) {
    throw new Error(
      "Supabase did not return account status.",
    );
  }

  return {
    hasBusiness:
      Boolean(
        row.has_business,
      ),

    businessId:
      row.business_id
        ? String(
            row.business_id,
          )
        : null,

    businessName:
      row.business_name
        ? String(
            row.business_name,
          )
        : null,

    posTemplate:
      row.pos_template
        ? (
            String(
              row.pos_template,
            ) as OnboardingBusinessType
          )
        : null,

    businessStatus:
      row.business_status ===
        "SUSPENDED"
        ? "SUSPENDED"
        : row.business_status ===
            "ACTIVE"
          ? "ACTIVE"
          : null,
  };
}

// Kept only for compatibility with older code.
// Public/self-service onboarding is disabled in the commercial flow.
export async function createPosBusinessFromOnboarding(
  input: {
    businessName: string;
    businessType:
      OnboardingBusinessType;
    branchName: string;
    ownerName: string;
    managerPin: string;
  },
) {
  const supabase =
    createClient();

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "create_pos_business_onboarding",
      {
        p_business_name:
          input.businessName,

        p_business_type:
          input.businessType,

        p_branch_name:
          input.branchName,

        p_owner_name:
          input.ownerName,

        p_manager_pin:
          input.managerPin,
      },
    );

  if (error) {
    throw new Error(
      error.message,
    );
  }

  const row =
    Array.isArray(data)
      ? data[0]
      : data;

  if (
    !row ||
    !row.business_id
  ) {
    throw new Error(
      "Supabase did not return the new business.",
    );
  }

  return {
    businessId:
      String(
        row.business_id,
      ),

    locationId:
      String(
        row.location_id,
      ),

    businessName:
      String(
        row.business_name,
      ),

    posTemplate:
      String(
        row.pos_template,
      ) as OnboardingBusinessType,
  };
}
