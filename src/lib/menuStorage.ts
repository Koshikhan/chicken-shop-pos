export const menuCategories = [
  "Meals",
  "Chicken",
  "Burgers",
  "Wraps",
  "Sides",
  "Drinks",
] as const;

/**
 * Categories are now business-defined.
 *
 * menuCategories remains only as the Fast Food local fallback.
 */
export type Category = string;

export type ProductSource =
  | "LOCAL"
  | "CLOUD";

export type Product = {
  id: number;

  // Real Supabase UUID for cloud-backed products.
  cloudId?: string;

  source?: ProductSource;

  name: string;
  description: string;
  category: Category;
  price: number;
  emoji: string;
  available: boolean;
  trackStock: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
};

export type StockItemRequest = {
  id: number;
  quantity: number;
};

export type ProductStockStatus =
  | "UNTRACKED"
  | "OUT_OF_STOCK"
  | "LOW_STOCK"
  | "IN_STOCK";

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 1,
    source: "LOCAL",
    name: "2 Piece Chicken Meal",
    description: "2 chicken pieces, fries and drink",
    category: "Meals",
    price: 8.99,
    emoji: "🍗",
    available: true,
    trackStock: true,
    stockQuantity: 30,
    lowStockThreshold: 5,
  },
  {
    id: 2,
    source: "LOCAL",
    name: "Spicy Burger Meal",
    description: "Spicy burger, fries and drink",
    category: "Meals",
    price: 9.49,
    emoji: "🍔",
    available: true,
    trackStock: true,
    stockQuantity: 25,
    lowStockThreshold: 5,
  },
  {
    id: 3,
    source: "LOCAL",
    name: "Family Bucket",
    description: "10 chicken pieces and 4 fries",
    category: "Meals",
    price: 24.99,
    emoji: "🪣",
    available: true,
    trackStock: true,
    stockQuantity: 10,
    lowStockThreshold: 3,
  },
  {
    id: 4,
    source: "LOCAL",
    name: "Chicken Piece",
    description: "Original fried chicken",
    category: "Chicken",
    price: 2.49,
    emoji: "🍗",
    available: true,
    trackStock: true,
    stockQuantity: 60,
    lowStockThreshold: 10,
  },
  {
    id: 5,
    source: "LOCAL",
    name: "6 Hot Wings",
    description: "Six spicy chicken wings",
    category: "Chicken",
    price: 5.99,
    emoji: "🔥",
    available: true,
    trackStock: true,
    stockQuantity: 30,
    lowStockThreshold: 6,
  },
  {
    id: 6,
    source: "LOCAL",
    name: "12 Hot Wings",
    description: "Twelve spicy chicken wings",
    category: "Chicken",
    price: 10.49,
    emoji: "🔥",
    available: true,
    trackStock: true,
    stockQuantity: 20,
    lowStockThreshold: 5,
  },
  {
    id: 7,
    source: "LOCAL",
    name: "Classic Chicken Burger",
    description: "Chicken fillet, lettuce and mayo",
    category: "Burgers",
    price: 5.99,
    emoji: "🍔",
    available: true,
    trackStock: true,
    stockQuantity: 35,
    lowStockThreshold: 6,
  },
  {
    id: 8,
    source: "LOCAL",
    name: "Spicy Tower Burger",
    description: "Spicy fillet, hash brown and cheese",
    category: "Burgers",
    price: 7.49,
    emoji: "🍔",
    available: true,
    trackStock: true,
    stockQuantity: 25,
    lowStockThreshold: 5,
  },
  {
    id: 9,
    source: "LOCAL",
    name: "Chicken Wrap",
    description: "Chicken strips, salad and sauce",
    category: "Wraps",
    price: 5.49,
    emoji: "🌯",
    available: true,
    trackStock: true,
    stockQuantity: 30,
    lowStockThreshold: 5,
  },
  {
    id: 10,
    source: "LOCAL",
    name: "Regular Fries",
    description: "Crispy seasoned fries",
    category: "Sides",
    price: 2.49,
    emoji: "🍟",
    available: true,
    trackStock: true,
    stockQuantity: 50,
    lowStockThreshold: 10,
  },
  {
    id: 11,
    source: "LOCAL",
    name: "Coleslaw",
    description: "Fresh creamy coleslaw",
    category: "Sides",
    price: 1.99,
    emoji: "🥗",
    available: true,
    trackStock: true,
    stockQuantity: 20,
    lowStockThreshold: 5,
  },
  {
    id: 12,
    source: "LOCAL",
    name: "Pepsi",
    description: "330ml canned drink",
    category: "Drinks",
    price: 1.79,
    emoji: "🥤",
    available: true,
    trackStock: true,
    stockQuantity: 48,
    lowStockThreshold: 12,
  },
  {
    id: 13,
    source: "LOCAL",
    name: "Water",
    description: "500ml bottled water",
    category: "Drinks",
    price: 1.29,
    emoji: "💧",
    available: false,
    trackStock: true,
    stockQuantity: 0,
    lowStockThreshold: 10,
  },
];

const MENU_STORAGE_KEY =
  "chicken-shop-pos-menu";

type StoredProduct =
  Partial<Product> & {
    id: number;
    name: string;
    description: string;
    category: string;
    price: number;
    emoji: string;
    available: boolean;
  };

function isStoredProduct(
  value: unknown,
): value is StoredProduct {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const product =
    value as Partial<Product>;

  return (
    typeof product.id === "number" &&
    typeof product.name === "string" &&
    typeof product.description === "string" &&
    typeof product.category === "string" &&
    product.category.trim().length > 0 &&
    typeof product.price === "number" &&
    Number.isFinite(product.price) &&
    typeof product.emoji === "string" &&
    typeof product.available === "boolean"
  );
}

function toNonNegativeInteger(
  value: unknown,
  fallback: number,
) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return fallback;
  }

  return Math.max(
    0,
    Math.floor(value),
  );
}

export function normaliseProduct(
  product: StoredProduct,
): Product {
  const trackStock =
    typeof product.trackStock ===
      "boolean"
      ? product.trackStock
      : true;

  const defaultStock =
    product.available
      ? 20
      : 0;

  const source:
    ProductSource =
    product.source === "CLOUD"
      ? "CLOUD"
      : "LOCAL";

  return {
    id:
      product.id,

    cloudId:
      typeof product.cloudId ===
        "string"
        ? product.cloudId
        : undefined,

    source,

    name:
      product.name,

    description:
      product.description,

    category:
      product.category.trim(),

    price:
      product.price,

    emoji:
      product.emoji,

    available:
      product.available,

    trackStock,

    stockQuantity:
      toNonNegativeInteger(
        product.stockQuantity,
        defaultStock,
      ),

    lowStockThreshold:
      toNonNegativeInteger(
        product.lowStockThreshold,
        5,
      ),
  };
}

export function loadMenu():
  Product[] {
  if (
    typeof window ===
    "undefined"
  ) {
    return DEFAULT_PRODUCTS;
  }

  try {
    const storedMenu =
      window.localStorage.getItem(
        MENU_STORAGE_KEY,
      );

    if (!storedMenu) {
      return DEFAULT_PRODUCTS;
    }

    const parsedMenu:
      unknown =
      JSON.parse(
        storedMenu,
      );

    if (
      !Array.isArray(
        parsedMenu,
      ) ||
      !parsedMenu.every(
        isStoredProduct,
      )
    ) {
      return DEFAULT_PRODUCTS;
    }

    return parsedMenu.map(
      normaliseProduct,
    );
  } catch (error) {
    console.error(
      "Unable to load menu:",
      error,
    );

    return DEFAULT_PRODUCTS;
  }
}

export function saveMenu(
  products: Product[],
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  try {
    window.localStorage.setItem(
      MENU_STORAGE_KEY,
      JSON.stringify(
        products.map(
          normaliseProduct,
        ),
      ),
    );
  } catch (error) {
    console.error(
      "Unable to save menu:",
      error,
    );
  }
}

export function getProductStockStatus(
  product: Product,
): ProductStockStatus {
  if (!product.trackStock) {
    return "UNTRACKED";
  }

  if (
    product.stockQuantity <=
    0
  ) {
    return "OUT_OF_STOCK";
  }

  if (
    product.stockQuantity <=
    product.lowStockThreshold
  ) {
    return "LOW_STOCK";
  }

  return "IN_STOCK";
}

export function isProductSellable(
  product: Product,
) {
  return (
    product.available &&
    (
      !product.trackStock ||
      product.stockQuantity >
        0
    )
  );
}

export function validateStockForItems(
  products: Product[],
  items: StockItemRequest[],
) {
  for (
    const item of items
  ) {
    const product =
      products.find(
        (candidate) =>
          candidate.id ===
          item.id,
      );

    if (!product) {
      return "A product in the order no longer exists.";
    }

    if (!product.available) {
      return `${product.name} is not available for sale.`;
    }

    if (
      product.trackStock &&
      item.quantity >
        product.stockQuantity
    ) {
      return `${product.name} only has ${product.stockQuantity} remaining.`;
    }
  }

  return null;
}

export function deductStockForItems(
  products: Product[],
  items: StockItemRequest[],
) {
  const validationError =
    validateStockForItems(
      products,
      items,
    );

  if (validationError) {
    throw new Error(
      validationError,
    );
  }

  const itemQuantityById =
    new Map(
      items.map(
        (item) => [
          item.id,
          item.quantity,
        ],
      ),
    );

  return products.map(
    (product) => {
      const quantity =
        itemQuantityById.get(
          product.id,
        );

      if (
        !quantity ||
        !product.trackStock
      ) {
        return product;
      }

      return {
        ...product,
        stockQuantity:
          Math.max(
            0,
            product.stockQuantity -
              quantity,
          ),
      };
    },
  );
}

export function createProductId() {
  return Date.now();
}
