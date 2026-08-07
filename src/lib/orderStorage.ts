import type {
  TaxType,
} from "@/lib/tax";

export type SavedOrderItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
};

export type SavedOrderStatus =
  | "Completed"
  | "Partially Refunded"
  | "Refunded"
  | "Voided";

export type OrderActionStaff = {
  id?: string;
  name: string;
  role: string;
};

export type SavedOrderAuditAction =
  | "ORDER_COMPLETED"
  | "ORDER_VOIDED"
  | "ORDER_REFUNDED";

export type SavedOrderRefundItem = {
  id: number;
  name: string;
  unitPrice: number;
  quantity: number;
  grossAmount: number;
  restocked: boolean;
};

export type SavedOrderRefund = {
  id: string;

  // Gross refund amount.
  amount: number;

  // Net amount contained in this refund.
  netAmount: number;

  // VAT contained in this refund.
  vatAmount: number;

  // Item details are present for new item-level refunds.
  // Older refunds may not contain this field.
  items?: SavedOrderRefundItem[];

  reason: string;

  performedBy: OrderActionStaff;

  createdAt: string;
};

export type SavedOrderAuditEntry = {
  id: string;

  action: SavedOrderAuditAction;

  reason?: string;

  amount?: number;

  performedBy: OrderActionStaff;

  createdAt: string;
};

export type SavedOrder = {
  id: string;

  orderNumber: string;

  orderType:
    | "Takeaway"
    | "Eat In"
    | "Delivery";

  items: SavedOrderItem[];

  itemCount: number;

  // Final gross amount paid.
  // VAT prices are treated as VAT-inclusive.
  subtotal: number;

  taxType: TaxType;

  // Stored as a decimal:
  // 0.2 means 20%.
  vatRate: number;

  // Original order amount before VAT.
  netAmount: number;

  // Original VAT contained in subtotal.
  vatAmount: number;

  paymentMethod:
    | "Cash"
    | "Card";

  amountReceived: number;

  change: number;

  status: SavedOrderStatus;

  createdAt: string;

  /*
   * These fields are optional so existing
   * order-creation code continues to work.
   * loadOrders() always adds safe defaults.
   */
  voidReason?: string;

  voidedAt?: string;

  voidedBy?: OrderActionStaff;

  refunds?: SavedOrderRefund[];

  refundedAmount?: number;

  refundedNetAmount?: number;

  refundedVatAmount?: number;

  auditTrail?: SavedOrderAuditEntry[];
};

export type VoidOrderInput = {
  orderId: string;
  reason: string;
  performedBy: OrderActionStaff;
  createdAt?: string;
};

export type RefundOrderItemInput = {
  id: number;
  quantity: number;
  restock: boolean;
};

export type RefundOrderInput = {
  orderId: string;

  // Gross amount to refund.
  amount: number;

  // Optional for backwards compatibility.
  // New refunds should provide item selections.
  items?: RefundOrderItemInput[];

  reason: string;

  performedBy: OrderActionStaff;

  createdAt?: string;
};

export type OrderFinancialSummary = {
  originalGrossAmount: number;
  originalNetAmount: number;
  originalVatAmount: number;

  refundedGrossAmount: number;
  refundedNetAmount: number;
  refundedVatAmount: number;

  recognisedGrossAmount: number;
  recognisedNetAmount: number;
  recognisedVatAmount: number;

  remainingRefundableAmount: number;
};

const ORDER_STORAGE_KEY =
  "chicken-shop-pos-orders";

type LegacySavedOrder =
  Omit<
    SavedOrder,
    | "taxType"
    | "vatRate"
    | "netAmount"
    | "vatAmount"
    | "status"
  > & {
    taxType?: TaxType;
    vatRate?: number;
    netAmount?: number;
    vatAmount?: number;
    status?: SavedOrderStatus;
  };

function roundCurrency(
  amount: number,
) {
  return Math.round(
    (amount + Number.EPSILON) *
      100,
  ) / 100;
}

function isSavedOrderStatus(
  value: unknown,
): value is SavedOrderStatus {
  return (
    value === "Completed" ||
    value ===
      "Partially Refunded" ||
    value === "Refunded" ||
    value === "Voided"
  );
}

function createActionId(
  prefix: string,
) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function getRefundTotals(
  refunds: SavedOrderRefund[],
) {
  return refunds.reduce(
    (totals, refund) => ({
      gross: roundCurrency(
        totals.gross +
          refund.amount,
      ),
      net: roundCurrency(
        totals.net +
          refund.netAmount,
      ),
      vat: roundCurrency(
        totals.vat +
          refund.vatAmount,
      ),
    }),
    {
      gross: 0,
      net: 0,
      vat: 0,
    },
  );
}

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

  const refunds =
    Array.isArray(order.refunds)
      ? order.refunds
      : [];

  const refundTotals =
    getRefundTotals(refunds);

  const refundedAmount =
    typeof order.refundedAmount ===
    "number"
      ? order.refundedAmount
      : refundTotals.gross;

  const refundedNetAmount =
    typeof order.refundedNetAmount ===
    "number"
      ? order.refundedNetAmount
      : refundTotals.net;

  const refundedVatAmount =
    typeof order.refundedVatAmount ===
    "number"
      ? order.refundedVatAmount
      : refundTotals.vat;

  const status =
    isSavedOrderStatus(
      order.status,
    )
      ? order.status
      : "Completed";

  const auditTrail =
    Array.isArray(
      order.auditTrail,
    )
      ? order.auditTrail
      : [];

  return {
    ...order,
    taxType,
    vatRate,
    netAmount:
      roundCurrency(netAmount),
    vatAmount:
      roundCurrency(vatAmount),
    status,
    refunds,
    refundedAmount:
      roundCurrency(
        refundedAmount,
      ),
    refundedNetAmount:
      roundCurrency(
        refundedNetAmount,
      ),
    refundedVatAmount:
      roundCurrency(
        refundedVatAmount,
      ),
    auditTrail,
  };
}

export function loadOrders():
  SavedOrder[] {
  if (
    typeof window ===
    "undefined"
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
      !Array.isArray(
        parsedOrders,
      )
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

export function saveOrders(
  orders: SavedOrder[],
) {
  if (
    typeof window ===
    "undefined"
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

export function addOrder(
  order: SavedOrder,
) {
  const currentOrders =
    loadOrders();

  const normalisedOrder =
    normaliseOrder(
      order as LegacySavedOrder,
    );

  const updatedOrders = [
    normalisedOrder,
    ...currentOrders,
  ];

  saveOrders(
    updatedOrders,
  );

  return updatedOrders;
}

export function updateOrder(
  updatedOrder: SavedOrder,
) {
  const currentOrders =
    loadOrders();

  const orderExists =
    currentOrders.some(
      (order) =>
        order.id ===
        updatedOrder.id,
    );

  if (!orderExists) {
    throw new Error(
      "The selected order could not be found.",
    );
  }

  const updatedOrders =
    currentOrders.map(
      (order) =>
        order.id ===
        updatedOrder.id
          ? normaliseOrder(
              updatedOrder as LegacySavedOrder,
            )
          : order,
    );

  saveOrders(
    updatedOrders,
  );

  return updatedOrders;
}

export function getOrderFinancialSummary(
  order: SavedOrder,
): OrderFinancialSummary {
  const normalisedOrder =
    normaliseOrder(
      order as LegacySavedOrder,
    );

  const refundedGrossAmount =
    Math.min(
      normalisedOrder.subtotal,
      normalisedOrder.refundedAmount ??
        0,
    );

  const refundedNetAmount =
    Math.min(
      normalisedOrder.netAmount,
      normalisedOrder.refundedNetAmount ??
        0,
    );

  const refundedVatAmount =
    Math.min(
      normalisedOrder.vatAmount,
      normalisedOrder.refundedVatAmount ??
        0,
    );

  const isVoided =
    normalisedOrder.status ===
    "Voided";

  const recognisedGrossAmount =
    isVoided
      ? 0
      : roundCurrency(
          normalisedOrder.subtotal -
            refundedGrossAmount,
        );

  const recognisedNetAmount =
    isVoided
      ? 0
      : roundCurrency(
          normalisedOrder.netAmount -
            refundedNetAmount,
        );

  const recognisedVatAmount =
    isVoided
      ? 0
      : roundCurrency(
          normalisedOrder.vatAmount -
            refundedVatAmount,
        );

  return {
    originalGrossAmount:
      roundCurrency(
        normalisedOrder.subtotal,
      ),

    originalNetAmount:
      roundCurrency(
        normalisedOrder.netAmount,
      ),

    originalVatAmount:
      roundCurrency(
        normalisedOrder.vatAmount,
      ),

    refundedGrossAmount:
      roundCurrency(
        refundedGrossAmount,
      ),

    refundedNetAmount:
      roundCurrency(
        refundedNetAmount,
      ),

    refundedVatAmount:
      roundCurrency(
        refundedVatAmount,
      ),

    recognisedGrossAmount,

    recognisedNetAmount,

    recognisedVatAmount,

    remainingRefundableAmount:
      isVoided
        ? 0
        : Math.max(
            0,
            roundCurrency(
              normalisedOrder.subtotal -
                refundedGrossAmount,
            ),
          ),
  };
}


export function getRefundedQuantityForItem(
  order: SavedOrder,
  itemId: number,
) {
  return (order.refunds ?? []).reduce(
    (total, refund) =>
      total +
      (refund.items ?? [])
        .filter(
          (item) =>
            item.id === itemId,
        )
        .reduce(
          (itemTotal, item) =>
            itemTotal +
            item.quantity,
          0,
        ),
    0,
  );
}

export function getRemainingRefundableQuantity(
  order: SavedOrder,
  itemId: number,
) {
  const orderItem =
    order.items.find(
      (item) =>
        item.id === itemId,
    );

  if (!orderItem) {
    return 0;
  }

  return Math.max(
    0,
    orderItem.quantity -
      getRefundedQuantityForItem(
        order,
        itemId,
      ),
  );
}

export function getRemainingRefundableAmount(
  order: SavedOrder,
) {
  return getOrderFinancialSummary(
    order,
  ).remainingRefundableAmount;
}

export function voidOrder({
  orderId,
  reason,
  performedBy,
  createdAt,
}: VoidOrderInput) {
  const trimmedReason =
    reason.trim();

  if (!trimmedReason) {
    throw new Error(
      "A void reason is required.",
    );
  }

  const currentOrders =
    loadOrders();

  const selectedOrder =
    currentOrders.find(
      (order) =>
        order.id === orderId,
    );

  if (!selectedOrder) {
    throw new Error(
      "The selected order could not be found.",
    );
  }

  if (
    selectedOrder.status ===
    "Voided"
  ) {
    throw new Error(
      "This order has already been voided.",
    );
  }

  if (
    selectedOrder.status ===
      "Refunded" ||
    selectedOrder.status ===
      "Partially Refunded"
  ) {
    throw new Error(
      "An order with refunds cannot be voided.",
    );
  }

  const actionTime =
    createdAt ??
    new Date().toISOString();

  const auditEntry:
    SavedOrderAuditEntry = {
      id: createActionId(
        "audit",
      ),
      action:
        "ORDER_VOIDED",
      reason:
        trimmedReason,
      amount:
        selectedOrder.subtotal,
      performedBy,
      createdAt:
        actionTime,
    };

  const updatedOrder:
    SavedOrder = {
      ...selectedOrder,
      status: "Voided",
      voidReason:
        trimmedReason,
      voidedAt:
        actionTime,
      voidedBy:
        performedBy,
      auditTrail: [
        ...(selectedOrder.auditTrail ??
          []),
        auditEntry,
      ],
    };

  return updateOrder(
    updatedOrder,
  );
}

function calculateRefundTax(
  order: SavedOrder,
  amount: number,
  isFinalRefund: boolean,
) {
  const financialSummary =
    getOrderFinancialSummary(
      order,
    );

  if (isFinalRefund) {
    return {
      netAmount:
        roundCurrency(
          financialSummary.recognisedNetAmount,
        ),
      vatAmount:
        roundCurrency(
          financialSummary.recognisedVatAmount,
        ),
    };
  }

  if (
    order.taxType !== "VAT" ||
    order.vatRate <= 0
  ) {
    return {
      netAmount:
        roundCurrency(amount),
      vatAmount: 0,
    };
  }

  const netAmount =
    roundCurrency(
      amount /
        (1 + order.vatRate),
    );

  return {
    netAmount,
    vatAmount:
      roundCurrency(
        amount - netAmount,
      ),
  };
}

export function refundOrder({
  orderId,
  amount,
  items,
  reason,
  performedBy,
  createdAt,
}: RefundOrderInput) {
  const trimmedReason =
    reason.trim();

  if (!trimmedReason) {
    throw new Error(
      "A refund reason is required.",
    );
  }

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    throw new Error(
      "Enter a valid refund amount.",
    );
  }

  const currentOrders =
    loadOrders();

  const selectedOrder =
    currentOrders.find(
      (order) =>
        order.id === orderId,
    );

  if (!selectedOrder) {
    throw new Error(
      "The selected order could not be found.",
    );
  }

  if (
    selectedOrder.status ===
    "Voided"
  ) {
    throw new Error(
      "A voided order cannot be refunded.",
    );
  }

  if (
    selectedOrder.status ===
    "Refunded"
  ) {
    throw new Error(
      "This order has already been fully refunded.",
    );
  }

  let refundItems:
    SavedOrderRefundItem[] |
    undefined;

  if (items) {
    if (items.length === 0) {
      throw new Error(
        "Select at least one item to refund.",
      );
    }

    const selectedById =
      new Map<number, RefundOrderItemInput>();

    items.forEach((item) => {
      if (
        !Number.isInteger(
          item.quantity,
        ) ||
        item.quantity <= 0
      ) {
        throw new Error(
          "Refund quantities must be whole numbers greater than 0.",
        );
      }

      if (selectedById.has(item.id)) {
        throw new Error(
          "A refund item was selected more than once.",
        );
      }

      selectedById.set(
        item.id,
        item,
      );
    });

    refundItems =
      items.map((item) => {
        const orderItem =
          selectedOrder.items.find(
            (candidate) =>
              candidate.id ===
              item.id,
          );

        if (!orderItem) {
          throw new Error(
            "A selected refund item is not part of this order.",
          );
        }

        const remainingQuantity =
          getRemainingRefundableQuantity(
            selectedOrder,
            item.id,
          );

        if (
          item.quantity >
          remainingQuantity
        ) {
          throw new Error(
            `${orderItem.name} only has ${remainingQuantity} refundable item${remainingQuantity === 1 ? "" : "s"} remaining.`,
          );
        }

        return {
          id: orderItem.id,
          name: orderItem.name,
          unitPrice:
            roundCurrency(
              orderItem.price,
            ),
          quantity:
            item.quantity,
          grossAmount:
            roundCurrency(
              orderItem.price *
                item.quantity,
            ),
          restocked:
            item.restock,
        };
      });

    const itemRefundAmount =
      roundCurrency(
        refundItems.reduce(
          (total, item) =>
            total +
            item.grossAmount,
          0,
        ),
      );

    if (
      Math.abs(
        itemRefundAmount -
          roundCurrency(amount),
      ) >= 0.01
    ) {
      throw new Error(
        "The selected item total does not match the refund amount.",
      );
    }
  }

  const financialSummary =
    getOrderFinancialSummary(
      selectedOrder,
    );

  const requestedAmount =
    roundCurrency(amount);

  if (
    requestedAmount >
    financialSummary.remainingRefundableAmount
  ) {
    throw new Error(
      `The maximum refundable amount is ${financialSummary.remainingRefundableAmount.toFixed(
        2,
      )}.`,
    );
  }

  const isFinalRefund =
    Math.abs(
      requestedAmount -
        financialSummary.remainingRefundableAmount,
    ) < 0.01;

  const refundTax =
    calculateRefundTax(
      selectedOrder,
      requestedAmount,
      isFinalRefund,
    );

  const actionTime =
    createdAt ??
    new Date().toISOString();

  const refund:
    SavedOrderRefund = {
      id: createActionId(
        "refund",
      ),
      amount:
        requestedAmount,
      netAmount:
        refundTax.netAmount,
      vatAmount:
        refundTax.vatAmount,
      ...(refundItems
        ? {
            items:
              refundItems,
          }
        : {}),
      reason:
        trimmedReason,
      performedBy,
      createdAt:
        actionTime,
    };

  const updatedRefundedAmount =
    roundCurrency(
      (selectedOrder.refundedAmount ??
        0) +
        refund.amount,
    );

  const updatedRefundedNetAmount =
    roundCurrency(
      (selectedOrder.refundedNetAmount ??
        0) +
        refund.netAmount,
    );

  const updatedRefundedVatAmount =
    roundCurrency(
      (selectedOrder.refundedVatAmount ??
        0) +
        refund.vatAmount,
    );

  const auditEntry:
    SavedOrderAuditEntry = {
      id: createActionId(
        "audit",
      ),
      action:
        "ORDER_REFUNDED",
      reason:
        trimmedReason,
      amount:
        refund.amount,
      performedBy,
      createdAt:
        actionTime,
    };

  const updatedOrder:
    SavedOrder = {
      ...selectedOrder,
      status: isFinalRefund
        ? "Refunded"
        : "Partially Refunded",
      refunds: [
        ...(selectedOrder.refunds ??
          []),
        refund,
      ],
      refundedAmount:
        updatedRefundedAmount,
      refundedNetAmount:
        updatedRefundedNetAmount,
      refundedVatAmount:
        updatedRefundedVatAmount,
      auditTrail: [
        ...(selectedOrder.auditTrail ??
          []),
        auditEntry,
      ],
    };

  return updateOrder(
    updatedOrder,
  );
}

export function createOrderId() {
  return `order-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}
