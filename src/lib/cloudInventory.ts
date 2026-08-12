"use client";

import type {
  InventoryMovement,
  InventoryMovementType,
} from "@/lib/inventoryStorage";

import type {
  Product,
} from "@/lib/menuStorage";

import {
  createClient,
} from "@/lib/supabase/client";

export type CloudInventoryAdjustmentType =
  | "RESTOCK"
  | "WASTE"
  | "CORRECTION";

export type CloudInventoryAdjustmentResult = {
  productId: string;
  previousStock: number;
  newStock: number;
  quantityChange: number;
  movementType:
    CloudInventoryAdjustmentType;
  createdAt: string;
};

async function getDefaultLocationId() {
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
        "default_location_id",
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

  if (
    !membership.default_location_id
  ) {
    throw new Error(
      "No default branch is assigned to this user.",
    );
  }

  return membership.default_location_id as string;
}

export async function adjustCloudInventory(
  input: {
    productId: string;
    adjustmentType:
      CloudInventoryAdjustmentType;
    quantity: number;
    note?: string;
    staffName: string;
    staffRole: string;
  },
): Promise<CloudInventoryAdjustmentResult> {
  const supabase =
    createClient();

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "adjust_pos_inventory",
      {
        p_product_id:
          input.productId,

        p_adjustment_type:
          input.adjustmentType,

        p_quantity:
          input.quantity,

        p_note:
          input.note ?? "",

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

  if (!result) {
    throw new Error(
      "Supabase did not return the inventory adjustment.",
    );
  }

  return {
    productId:
      String(
        result.product_id,
      ),

    previousStock:
      Number(
        result.previous_stock,
      ),

    newStock:
      Number(
        result.new_stock,
      ),

    quantityChange:
      Number(
        result.quantity_change,
      ),

    movementType:
      result.movement_type as
        CloudInventoryAdjustmentType,

    createdAt:
      String(
        result.created_at,
      ),
  };
}

function getLocalProductId(
  cloudProductId: string,
  products: Product[],
) {
  return (
    products.find(
      (product) =>
        product.cloudId ===
        cloudProductId,
    )?.id ??
    0
  );
}

export async function loadCloudInventoryMovements(
  products: Product[],
): Promise<InventoryMovement[]> {
  const supabase =
    createClient();

  const locationId =
    await getDefaultLocationId();

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "inventory_movements",
      )
      .select(
        `
        id,
        product_id,
        movement_type,
        quantity_change,
        previous_stock,
        new_stock,
        note,
        order_id,
        staff_name,
        staff_role,
        created_at
        `,
      )
      .eq(
        "location_id",
        locationId,
      )
      .order(
        "created_at",
        {
          ascending: false,
        },
      )
      .limit(250);

  if (error) {
    throw new Error(
      error.message,
    );
  }

  return (data ?? []).map(
    (row) => {
      const cloudProductId =
        String(
          row.product_id,
        );

      const localProduct =
        products.find(
          (product) =>
            product.cloudId ===
            cloudProductId,
        );

      return {
        id:
          String(
            row.id,
          ),

        productId:
          getLocalProductId(
            cloudProductId,
            products,
          ),

        productName:
          localProduct?.name ??
          "Unknown product",

        type:
          row.movement_type as
            InventoryMovementType,

        quantityChange:
          Number(
            row.quantity_change,
          ),

        previousStock:
          Number(
            row.previous_stock,
          ),

        newStock:
          Number(
            row.new_stock,
          ),

        note:
          row.note ??
          undefined,

        orderId:
          row.order_id ??
          undefined,

        performedBy:
          row.staff_name
            ? {
                name:
                  row.staff_name,
                role:
                  row.staff_role ??
                  "Unknown",
              }
            : undefined,

        createdAt:
          String(
            row.created_at,
          ),
      };
    },
  );
}
