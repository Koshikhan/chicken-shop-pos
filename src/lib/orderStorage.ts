import type {
  TaxType,
} from "@/lib/tax";

// Structure of an individual item
// stored inside a completed order.
export type SavedOrderItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
};

// Structure of a completed order.
export type SavedOrder = {
  id: string;

  orderNumber: string;

  orderType:
    | "Takeaway"
    | "Eat In"
    | "Delivery";

  items: SavedOrderItem[];

  itemCount: number;

  // Final amount paid by the customer.
  // Prices are treated as VAT-inclusive.
  subtotal: number;

  // VAT or non-VAT sale.
  taxType: TaxType;

  // Stored as a decimal:
  // 0.2 means 20%.
  vatRate: number;

  // Order value before VAT.
  netAmount: number;

  // VAT contained within the subtotal.
  vatAmount: number;

  paymentMethod:
    | "Cash"
    | "Card";

  amountReceived: number;

  change: number;

  status: "Completed";

  createdAt: string;
};

const ORDER_STORAGE_KEY =
  "chicken-shop-pos-orders";

/*
 * Older orders were saved before VAT fields
 * were introduced. This type represents the
 * older stored format.
 */
type LegacySavedOrder =
  Omit<
    SavedOrder,
    | "taxType"
    | "vatRate"
    | "netAmount"
    | "vatAmount"
  > & {
    taxType?: TaxType;
    vatRate?: number;
    netAmount?: number;
    vatAmount?: number;
  };

/*
 * Adds safe tax defaults to older orders.
 *
 * Existing orders are treated as non-VAT
 * because they were completed before tax
 * selection was available.
 */
function normaliseOrder(
  order: LegacySavedOrder,
): SavedOrder {
  const taxType =
    order.taxType ?? "NON_VAT";

  const vatRate =
    typeof order.vatRate ===
    "number"
      ? order.vatRate
      : 0;

  const netAmount =
    typeof order.netAmount ===
    "number"
      ? order.netAmount
      : order.subtotal;

  const vatAmount =
    typeof order.vatAmount ===
    "number"
      ? order.vatAmount
      : 0;

  return {
    ...order,
    taxType,
    vatRate,
    netAmount,
    vatAmount,
  };
}

// Load completed orders from localStorage.
export function loadOrders():
  SavedOrder[] {
  if (
    typeof window === "undefined"
  ) {
    return [];
  }

  try {
    const storedOrders =
      window.localStorage.getItem(
        ORDER_STORAGE_KEY,
      );

    if (!storedOrders) {
      return [];
    }

    const parsedOrders: unknown =
      JSON.parse(storedOrders);

    if (
      !Array.isArray(parsedOrders)
    ) {
      return [];
    }

    return parsedOrders.map(
      (order) =>
        normaliseOrder(
          order as LegacySavedOrder,
        ),
    );
  } catch (error) {
    console.error(
      "Unable to load orders:",
      error,
    );

    return [];
  }
}

// Save completed orders to localStorage.
export function saveOrders(
  orders: SavedOrder[],
) {
  if (
    typeof window === "undefined"
  ) {
    return;
  }

  try {
    window.localStorage.setItem(
      ORDER_STORAGE_KEY,
      JSON.stringify(orders),
    );
  } catch (error) {
    console.error(
      "Unable to save orders:",
      error,
    );
  }
}

// Add a newly completed order.
export function addOrder(
  order: SavedOrder,
) {
  const currentOrders =
    loadOrders();

  const updatedOrders = [
    order,
    ...currentOrders,
  ];

  saveOrders(updatedOrders);

  return updatedOrders;
}

// Create a unique internal order ID.
export function createOrderId() {
  return `order-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}