export type InventoryMovementType =
  | "SALE"
  | "RESTOCK"
  | "WASTE"
  | "CORRECTION"
  | "VOID_RESTORE"
  | "REFUND_RESTORE";

export type InventoryMovement = {
  id: string;
  productId: number;
  productName: string;
  type: InventoryMovementType;
  quantityChange: number;
  previousStock: number;
  newStock: number;
  note?: string;
  orderId?: string;
  orderNumber?: string;
  performedBy?: {
    name: string;
    role: string;
  };
  createdAt: string;
};

const INVENTORY_STORAGE_KEY =
  "chicken-shop-pos-inventory-movements";

function createMovementId() {
  return `stock-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function createInventoryMovement(
  movement: Omit<
    InventoryMovement,
    "id" | "createdAt"
  > & {
    createdAt?: string;
  },
): InventoryMovement {
  return {
    ...movement,
    id: createMovementId(),
    createdAt:
      movement.createdAt ??
      new Date().toISOString(),
  };
}

export function loadInventoryMovements():
  InventoryMovement[] {
  if (
    typeof window === "undefined"
  ) {
    return [];
  }

  try {
    const stored =
      window.localStorage.getItem(
        INVENTORY_STORAGE_KEY,
      );

    if (!stored) {
      return [];
    }

    const parsed: unknown =
      JSON.parse(stored);

    return Array.isArray(parsed)
      ? parsed as InventoryMovement[]
      : [];
  } catch (error) {
    console.error(
      "Unable to load inventory movements:",
      error,
    );

    return [];
  }
}

export function saveInventoryMovements(
  movements: InventoryMovement[],
) {
  if (
    typeof window === "undefined"
  ) {
    return;
  }

  try {
    window.localStorage.setItem(
      INVENTORY_STORAGE_KEY,
      JSON.stringify(movements),
    );
  } catch (error) {
    console.error(
      "Unable to save inventory movements:",
      error,
    );
  }
}

export function addInventoryMovements(
  movements: InventoryMovement[],
) {
  if (movements.length === 0) {
    return loadInventoryMovements();
  }

  const current =
    loadInventoryMovements();

  const updated = [
    ...movements,
    ...current,
  ];

  saveInventoryMovements(
    updated,
  );

  return updated;
}