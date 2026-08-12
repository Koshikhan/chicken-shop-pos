"use client";

import {
  DEFAULT_PRODUCTS,
  menuCategories,
  type Category,
  type Product,
} from "@/lib/menuStorage";

import {
  createClient,
} from "@/lib/supabase/client";

type CloudMembership = {
  business_id: string;
  default_location_id: string | null;
};

type CloudCategory = {
  id: string;
  name: string;
};

type CloudProduct = {
  id: string;
  category_id: string | null;
  name: string;
  description: string;
  price: number | string;
  emoji: string;
  available: boolean;
  track_stock: boolean;
  low_stock_threshold: number;
};

type CloudInventory = {
  product_id: string;
  stock_quantity: number;
};

export type CloudMenuResult = {
  products: Product[];
  businessId: string;
  locationId: string;
};

function isCategory(
  value: string,
): value is Category {
  return menuCategories.includes(
    value as Category,
  );
}

function getLegacyNumericId(
  cloudProduct: CloudProduct,
) {
  const matchingDefault =
    DEFAULT_PRODUCTS.find(
      (product) =>
        product.name ===
        cloudProduct.name,
    );

  if (matchingDefault) {
    return matchingDefault.id;
  }

  // Existing POS code still uses numeric IDs in the cart.
  // Derive a stable compatibility ID from the cloud UUID so
  // a newly added product keeps the same local ID after reload.
  let hash = 0;

  for (
    let index = 0;
    index <
    cloudProduct.id.length;
    index += 1
  ) {
    hash =
      (
        hash * 31 +
        cloudProduct.id.charCodeAt(
          index,
        )
      ) | 0;
  }

  return (
    1_000_000_000 +
    Math.abs(hash)
  );
}

export async function loadCloudMenu():
  Promise<CloudMenuResult> {
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
        "business_id, default_location_id",
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

  const [
    categoriesResult,
    productsResult,
    inventoryResult,
  ] =
    await Promise.all([
      supabase
        .from("categories")
        .select("id, name")
        .eq(
          "business_id",
          membership.business_id,
        )
        .eq(
          "is_active",
          true,
        ),

      supabase
        .from("products")
        .select(
          "id, category_id, name, description, price, emoji, available, track_stock, low_stock_threshold",
        )
        .eq(
          "business_id",
          membership.business_id,
        )
        .eq(
          "is_active",
          true,
        )
        .order("name"),

      supabase
        .from("inventory")
        .select(
          "product_id, stock_quantity",
        )
        .eq(
          "location_id",
          membership.default_location_id,
        ),
    ]);

  if (categoriesResult.error) {
    throw new Error(
      categoriesResult.error.message,
    );
  }

  if (productsResult.error) {
    throw new Error(
      productsResult.error.message,
    );
  }

  if (inventoryResult.error) {
    throw new Error(
      inventoryResult.error.message,
    );
  }

  const categories =
    (categoriesResult.data ??
      []) as CloudCategory[];

  const cloudProducts =
    (productsResult.data ??
      []) as CloudProduct[];

  const inventory =
    (inventoryResult.data ??
      []) as CloudInventory[];

  const categoryById =
    new Map(
      categories.map(
        (category) => [
          category.id,
          category.name,
        ],
      ),
    );

  const stockByProductId =
    new Map(
      inventory.map(
        (item) => [
          item.product_id,
          item.stock_quantity,
        ],
      ),
    );

  const products: Product[] =
    cloudProducts.flatMap(
      (
        cloudProduct,
      ) => {
        const categoryName =
          cloudProduct.category_id
            ? categoryById.get(
                cloudProduct.category_id,
              )
            : undefined;

        if (
          !categoryName ||
          !isCategory(
            categoryName,
          )
        ) {
          console.warn(
            `Skipping ${cloudProduct.name}: unsupported category ${categoryName ?? "none"}.`,
          );

          return [];
        }

        return [
          {
            id:
              getLegacyNumericId(
                cloudProduct,
              ),
            cloudId:
              cloudProduct.id,
            source: "CLOUD",
            name:
              cloudProduct.name,
            description:
              cloudProduct.description,
            category:
              categoryName,
            price:
              Number(
                cloudProduct.price,
              ),
            emoji:
              cloudProduct.emoji,
            available:
              cloudProduct.available,
            trackStock:
              cloudProduct.track_stock,
            stockQuantity:
              stockByProductId.get(
                cloudProduct.id,
              ) ?? 0,
            lowStockThreshold:
              cloudProduct.low_stock_threshold,
          },
        ];
      },
    );

  if (products.length === 0) {
    throw new Error(
      "No cloud products were returned.",
    );
  }

  return {
    products,
    businessId:
      membership.business_id,
    locationId:
      membership.default_location_id,
  };
}
