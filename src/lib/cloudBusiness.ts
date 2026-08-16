"use client";

import {
  createClient,
} from "@/lib/supabase/client";

export type BusinessType =
  | "FAST_FOOD"
  | "DELI"
  | "RESTAURANT"
  | "RETAIL";

export type PosTemplate =
  | "FAST_FOOD"
  | "DELI"
  | "RESTAURANT"
  | "RETAIL";

export type CloudBusinessSettings = {
  businessId: string;

  businessName: string;

  businessType:
    BusinessType;

  posTemplate:
    PosTemplate;

  currency: string;

  country: string;

  timezone: string;

  vatRegistered: boolean;

  vatNumber: string;

  receiptName: string;

  phone: string;

  addressLine1: string;

  addressLine2: string;

  city: string;

  postcode: string;

  locationId: string | null;

  locationName: string;

  locationCode: string;
};

function toBusinessType(
  value: unknown,
): BusinessType {
  if (
    value === "DELI" ||
    value === "RESTAURANT" ||
    value === "RETAIL"
  ) {
    return value;
  }

  return "FAST_FOOD";
}

function toPosTemplate(
  value: unknown,
): PosTemplate {
  if (
    value === "DELI" ||
    value === "RESTAURANT" ||
    value === "RETAIL"
  ) {
    return value;
  }

  return "FAST_FOOD";
}

export async function loadCloudBusinessSettings():
  Promise<CloudBusinessSettings> {
  const supabase =
    createClient();

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "get_pos_business_settings",
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
      "Supabase did not return the current business settings.",
    );
  }

  return {
    businessId:
      String(
        row.business_id,
      ),

    businessName:
      String(
        row.business_name ??
          "Business",
      ),

    businessType:
      toBusinessType(
        row.business_type,
      ),

    posTemplate:
      toPosTemplate(
        row.pos_template,
      ),

    currency:
      String(
        row.currency ??
          "GBP",
      ),

    country:
      String(
        row.country ??
          "GB",
      ),

    timezone:
      String(
        row.timezone ??
          "Europe/London",
      ),

    vatRegistered:
      Boolean(
        row.vat_registered,
      ),

    vatNumber:
      String(
        row.vat_number ??
          "",
      ),

    receiptName:
      String(
        row.receipt_name ??
          "",
      ),

    phone:
      String(
        row.phone ??
          "",
      ),

    addressLine1:
      String(
        row.address_line1 ??
          "",
      ),

    addressLine2:
      String(
        row.address_line2 ??
          "",
      ),

    city:
      String(
        row.city ??
          "",
      ),

    postcode:
      String(
        row.postcode ??
          "",
      ),

    locationId:
      row.location_id
        ? String(
            row.location_id,
          )
        : null,

    locationName:
      String(
        row.location_name ??
          "Main Branch",
      ),

    locationCode:
      String(
        row.location_code ??
          "MAIN",
      ),
  };
}

export async function updateCloudBusinessSettings(
  input: {
    businessName: string;

    businessType:
      BusinessType;

    posTemplate:
      PosTemplate;

    receiptName: string;

    phone: string;

    addressLine1: string;

    addressLine2: string;

    city: string;

    postcode: string;

    vatRegistered: boolean;

    vatNumber: string;
  },
): Promise<CloudBusinessSettings> {
  const supabase =
    createClient();

  const {
    error,
  } =
    await supabase.rpc(
      "update_pos_business_settings",
      {
        p_business_name:
          input.businessName,

        p_business_type:
          input.businessType,

        p_pos_template:
          input.posTemplate,

        p_receipt_name:
          input.receiptName,

        p_phone:
          input.phone,

        p_address_line1:
          input.addressLine1,

        p_address_line2:
          input.addressLine2,

        p_city:
          input.city,

        p_postcode:
          input.postcode,

        p_vat_registered:
          input.vatRegistered,

        p_vat_number:
          input.vatNumber,
      },
    );

  if (error) {
    throw new Error(
      error.message,
    );
  }

  return loadCloudBusinessSettings();
}

export function getPosTemplateLabel(
  template:
    PosTemplate,
) {
  switch (template) {
    case "DELI":
      return "Deli";

    case "RESTAURANT":
      return "Restaurant";

    case "RETAIL":
      return "Retail";

    default:
      return "Fast Food";
  }
}

export function getTerminalLabel(
  template:
    PosTemplate,
) {
  switch (template) {
    case "DELI":
      return "Deli Terminal";

    case "RESTAURANT":
      return "Restaurant Terminal";

    case "RETAIL":
      return "Retail Terminal";

    default:
      return "Cashier Terminal";
  }
}
