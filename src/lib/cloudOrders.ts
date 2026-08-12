"use client";

import type {
  Product,
} from "@/lib/menuStorage";

import type {
  SavedOrder,
  SavedOrderAuditEntry,
  SavedOrderRefund,
  SavedOrderRefundItem,
  SavedOrderStatus,
} from "@/lib/orderStorage";

import {
  createClient,
} from "@/lib/supabase/client";

type CloudOrder = {
  id: string;
  order_number: string;
  order_type:
    | "Takeaway"
    | "Eat In"
    | "Delivery";
  tax_type:
    | "VAT"
    | "NON_VAT";
  vat_rate: number | string;
  net_amount: number | string;
  vat_amount: number | string;
  subtotal: number | string;
  item_count: number;
  payment_method:
    | "Cash"
    | "Card";
  amount_received: number | string;
  change: number | string;
  status: string;
  created_at: string;
  staff_name: string | null;
  staff_role: string | null;
  refunded_amount: number | string | null;
  refunded_net_amount: number | string | null;
  refunded_vat_amount: number | string | null;
  void_reason: string | null;
  voided_at: string | null;
  void_staff_name: string | null;
  void_staff_role: string | null;
};

type CloudOrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  unit_price: number | string;
  quantity: number;
  refunded_quantity: number;
  created_at: string;
};

type CloudRefund = {
  id: string;
  order_id: string;
  gross_amount: number | string;
  net_amount: number | string;
  vat_amount: number | string;
  reason: string;
  staff_name: string | null;
  staff_role: string | null;
  created_at: string;
};

type CloudRefundItem = {
  id: string;
  refund_id: string;
  order_item_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number | string;
  gross_amount: number | string;
  stock_restored: boolean;
};

function normaliseStatus(
  status: string,
): SavedOrderStatus {
  switch (status) {
    case "Partially Refunded":
    case "Refunded":
    case "Voided":
      return status;

    default:
      return "Completed";
  }
}

function getFallbackProductId(
  productId: string,
) {
  let hash = 0;

  for (
    let index = 0;
    index < productId.length;
    index += 1
  ) {
    hash =
      (
        hash * 31 +
        productId.charCodeAt(
          index,
        )
      ) | 0;
  }

  return (
    1_000_000_000 +
    Math.abs(hash)
  );
}

function getProductNumericId(
  productId: string,
  products: Product[],
) {
  const product =
    products.find(
      (item) =>
        item.cloudId ===
        productId,
    );

  return (
    product?.id ??
    getFallbackProductId(
      productId,
    )
  );
}

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

  return membership.default_location_id;
}

export async function loadCloudOrders(
  products: Product[],
): Promise<SavedOrder[]> {
  const supabase =
    createClient();

  const locationId =
    await getDefaultLocationId();

  const {
    data: ordersData,
    error: ordersError,
  } =
    await supabase
      .from("orders")
      .select(
        `
        id,
        order_number,
        order_type,
        tax_type,
        vat_rate,
        net_amount,
        vat_amount,
        subtotal,
        item_count,
        payment_method,
        amount_received,
        change,
        status,
        created_at,
        staff_name,
        staff_role,
        refunded_amount,
        refunded_net_amount,
        refunded_vat_amount,
        void_reason,
        voided_at,
        void_staff_name,
        void_staff_role
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
      );

  if (ordersError) {
    throw new Error(
      ordersError.message,
    );
  }

  const orders =
    (ordersData ??
      []) as CloudOrder[];

  if (
    orders.length === 0
  ) {
    return [];
  }

  const orderIds =
    orders.map(
      (order) =>
        order.id,
    );

  const [
    orderItemsResult,
    refundsResult,
  ] =
    await Promise.all([
      supabase
        .from("order_items")
        .select(
          `
          id,
          order_id,
          product_id,
          product_name,
          unit_price,
          quantity,
          refunded_quantity,
          created_at
          `,
        )
        .in(
          "order_id",
          orderIds,
        )
        .order(
          "created_at",
          {
            ascending: true,
          },
        ),

      supabase
        .from("refunds")
        .select(
          `
          id,
          order_id,
          gross_amount,
          net_amount,
          vat_amount,
          reason,
          staff_name,
          staff_role,
          created_at
          `,
        )
        .in(
          "order_id",
          orderIds,
        )
        .order(
          "created_at",
          {
            ascending: true,
          },
        ),
    ]);

  if (
    orderItemsResult.error
  ) {
    throw new Error(
      orderItemsResult.error.message,
    );
  }

  if (
    refundsResult.error
  ) {
    throw new Error(
      refundsResult.error.message,
    );
  }

  const orderItems =
    (orderItemsResult.data ??
      []) as CloudOrderItem[];

  const refunds =
    (refundsResult.data ??
      []) as CloudRefund[];

  const refundIds =
    refunds.map(
      (refund) =>
        refund.id,
    );

  let refundItems:
    CloudRefundItem[] = [];

  if (
    refundIds.length >
    0
  ) {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          "refund_items",
        )
        .select(
          `
          id,
          refund_id,
          order_item_id,
          product_id,
          product_name,
          quantity,
          unit_price,
          gross_amount,
          stock_restored
          `,
        )
        .in(
          "refund_id",
          refundIds,
        );

    if (error) {
      throw new Error(
        error.message,
      );
    }

    refundItems =
      (data ??
        []) as CloudRefundItem[];
  }

  return orders.map(
    (order) => {
      const itemsForOrder =
        orderItems.filter(
          (item) =>
            item.order_id ===
            order.id,
        );

      const refundsForOrder =
        refunds.filter(
          (refund) =>
            refund.order_id ===
            order.id,
        );

      const mappedRefunds:
        SavedOrderRefund[] =
        refundsForOrder.map(
          (refund) => {
            const itemsForRefund =
              refundItems.filter(
                (item) =>
                  item.refund_id ===
                  refund.id,
              );

            const mappedItems:
              SavedOrderRefundItem[] =
              itemsForRefund.map(
                (item) => ({
                  id:
                    getProductNumericId(
                      item.product_id,
                      products,
                    ),
                  name:
                    item.product_name,
                  unitPrice:
                    Number(
                      item.unit_price,
                    ),
                  quantity:
                    item.quantity,
                  grossAmount:
                    Number(
                      item.gross_amount,
                    ),
                  restocked:
                    item.stock_restored,
                }),
              );

            return {
              id:
                refund.id,
              amount:
                Number(
                  refund.gross_amount,
                ),
              netAmount:
                Number(
                  refund.net_amount,
                ),
              vatAmount:
                Number(
                  refund.vat_amount,
                ),
              items:
                mappedItems,
              reason:
                refund.reason,
              performedBy: {
                name:
                  refund.staff_name ??
                  "Unknown staff",
                role:
                  refund.staff_role ??
                  "Unknown role",
              },
              createdAt:
                refund.created_at,
            };
          },
        );

      const auditTrail:
        SavedOrderAuditEntry[] =
        [];

      if (
        order.staff_name
      ) {
        auditTrail.push(
          {
            id:
              `cloud-completed-${order.id}`,
            action:
              "ORDER_COMPLETED",
            amount:
              Number(
                order.subtotal,
              ),
            performedBy: {
              name:
                order.staff_name,
              role:
                order.staff_role ??
                "Unknown role",
            },
            createdAt:
              order.created_at,
          },
        );
      }

      mappedRefunds.forEach(
        (refund) => {
          auditTrail.push(
            {
              id:
                `cloud-refund-${refund.id}`,
              action:
                "ORDER_REFUNDED",
              reason:
                refund.reason,
              amount:
                refund.amount,
              performedBy:
                refund.performedBy,
              createdAt:
                refund.createdAt,
            },
          );
        },
      );

      if (
        order.status ===
          "Voided" &&
        order.voided_at
      ) {
        auditTrail.push(
          {
            id:
              `cloud-void-${order.id}`,
            action:
              "ORDER_VOIDED",
            reason:
              order.void_reason ??
              undefined,
            amount:
              Number(
                order.subtotal,
              ),
            performedBy: {
              name:
                order.void_staff_name ??
                "Unknown staff",
              role:
                order.void_staff_role ??
                "Unknown role",
            },
            createdAt:
              order.voided_at,
          },
        );
      }

      auditTrail.sort(
        (
          first,
          second,
        ) =>
          new Date(
            first.createdAt,
          ).getTime() -
          new Date(
            second.createdAt,
          ).getTime(),
      );

      return {
        id:
          order.id,

        cloudOrderId:
          order.id,

        orderNumber:
          order.order_number,

        orderType:
          order.order_type,

        items:
          itemsForOrder.map(
            (item) => ({
              id:
                getProductNumericId(
                  item.product_id,
                  products,
                ),
              name:
                item.product_name,
              price:
                Number(
                  item.unit_price,
                ),
              quantity:
                item.quantity,
            }),
          ),

        itemCount:
          order.item_count,

        subtotal:
          Number(
            order.subtotal,
          ),

        taxType:
          order.tax_type,

        vatRate:
          Number(
            order.vat_rate,
          ),

        netAmount:
          Number(
            order.net_amount,
          ),

        vatAmount:
          Number(
            order.vat_amount,
          ),

        paymentMethod:
          order.payment_method,

        amountReceived:
          Number(
            order.amount_received,
          ),

        change:
          Number(
            order.change,
          ),

        status:
          normaliseStatus(
            order.status,
          ),

        createdAt:
          order.created_at,

        voidReason:
          order.void_reason ??
          undefined,

        voidedAt:
          order.voided_at ??
          undefined,

        voidedBy:
          order.voided_at
            ? {
                name:
                  order.void_staff_name ??
                  "Unknown staff",
                role:
                  order.void_staff_role ??
                  "Unknown role",
              }
            : undefined,

        refunds:
          mappedRefunds,

        refundedAmount:
          Number(
            order.refunded_amount ??
            0,
          ),

        refundedNetAmount:
          Number(
            order.refunded_net_amount ??
            0,
          ),

        refundedVatAmount:
          Number(
            order.refunded_vat_amount ??
            0,
          ),

        auditTrail,
      };
    },
  );
}
