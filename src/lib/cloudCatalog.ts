"use client";

import type {
  Category,
} from "@/lib/menuStorage";

import {
  createClient,
} from "@/lib/supabase/client";

export type SaveCloudProductInput = {
  cloudProductId?: string;
  category: Category;
  name: string;
  description: string;
  price: number;
  emoji: string;
  available: boolean;
  trackStock: boolean;
  lowStockThreshold: number;
  initialStock: number;
  staffName: string;
  staffRole: string;
};

export async function saveCloudProduct(
  input: SaveCloudProductInput,
) {
  const supabase =
    createClient();

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "save_pos_product",
      {
        p_product_id:
          input.cloudProductId ??
          null,

        p_category_name:
          input.category,

        p_name:
          input.name,

        p_description:
          input.description,

        p_price:
          input.price,

        p_emoji:
          input.emoji,

        p_available:
          input.available,

        p_track_stock:
          input.trackStock,

        p_low_stock_threshold:
          input.lowStockThreshold,

        p_initial_stock:
          input.initialStock,

        p_staff_name:
          input.staffName,

        p_staff_role:
          input.staffRole,
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
    !result.saved_product_id
  ) {
    throw new Error(
      "Supabase did not return the saved product.",
    );
  }

  return {
    productId:
      String(
        result.saved_product_id,
      ),

    name:
      String(
        result.saved_name,
      ),
  };
}

export async function setCloudProductAvailability(
  cloudProductId: string,
  available: boolean,
) {
  const supabase =
    createClient();

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "set_pos_product_availability",
      {
        p_product_id:
          cloudProductId,

        p_available:
          available,
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
    !result.changed_product_id
  ) {
    throw new Error(
      "Supabase did not return the updated product.",
    );
  }
}

export async function archiveCloudProduct(
  cloudProductId: string,
) {
  const supabase =
    createClient();

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "archive_pos_product",
      {
        p_product_id:
          cloudProductId,
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
    !result.archived_product_id
  ) {
    throw new Error(
      "Supabase did not confirm the product removal.",
    );
  }
}
