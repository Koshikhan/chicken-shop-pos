"use client";

import {
  createClient,
} from "@/lib/supabase/client";

export type CloudRefundableItem = {
  orderItemId: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  refundedQuantity: number;
  remainingQuantity: number;
};

export type CloudRefundableOrder = {
  orderId: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  refundedAmount: number;
  items: CloudRefundableItem[];
};

export type CloudRefundItemRequest = {
  orderItemId: string;
  quantity: number;
  restock: boolean;
};

export type CloudRefundOrderIdentity = {
  cloudOrderId?: string;
  orderNumber: string;
  subtotal: number;
  orderType:
    | "Takeaway"
    | "Eat In"
    | "Delivery";
  paymentMethod:
    | "Cash"
    | "Card";
  createdAt: string;
};

export type CloudRefundResult = {
  refundId: string;
  orderNumber: string;
  orderStatus:
    | "Partially Refunded"
    | "Refunded";
  refundedGross: number;
  refundedNet: number;
  refundedVat: number;
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

  return membership.default_location_id;
}

export async function loadCloudRefundableOrder(
  identity: CloudRefundOrderIdentity,
): Promise<CloudRefundableOrder> {
  const supabase =
    createClient();

  const locationId =
    await getDefaultLocationId();

  let query =
    supabase
      .from("orders")
      .select(
        `
        id,
        order_number,
        order_type,
        payment_method,
        status,
        subtotal,
        refunded_amount,
        created_at
        `,
      )
      .eq(
        "location_id",
        locationId,
      );

  if (identity.cloudOrderId) {
    query =
      query.eq(
        "id",
        identity.cloudOrderId,
      );
  } else {
    query =
      query.eq(
        "order_number",
        identity.orderNumber,
      );
  }

  const {
    data: order,
    error: orderError,
  } =
    await query.maybeSingle();

  if (
    orderError ||
    !order
  ) {
    throw new Error(
      orderError?.message ??
        `Cloud order ${identity.orderNumber} was not found.`,
    );
  }

  // Older localStorage orders can share an order number with
  // newer cloud orders. Never trust order_number alone.
  if (!identity.cloudOrderId) {
    const cloudCreatedAt =
      new Date(
        order.created_at,
      ).getTime();

    const localCreatedAt =
      new Date(
        identity.createdAt,
      ).getTime();

    const timeDifference =
      Math.abs(
        cloudCreatedAt -
          localCreatedAt,
      );

    const sameSubtotal =
      Math.abs(
        Number(
          order.subtotal,
        ) -
          identity.subtotal,
      ) < 0.01;

    const sameOrderType =
      order.order_type ===
      identity.orderType;

    const samePaymentMethod =
      order.payment_method ===
      identity.paymentMethod;

    // A cloud sale and its local mirror are created only seconds
    // apart. Five minutes gives plenty of tolerance while still
    // rejecting old local-only orders with the same order number.
    const sameSaleTime =
      Number.isFinite(
        cloudCreatedAt,
      ) &&
      Number.isFinite(
        localCreatedAt,
      ) &&
      timeDifference <=
        5 * 60 * 1000;

    if (
      !sameSubtotal ||
      !sameOrderType ||
      !samePaymentMethod ||
      !sameSaleTime
    ) {
      throw new Error(
        `Order ${identity.orderNumber} is a legacy/local-only order and does not match the cloud order with the same number.`,
      );
    }
  }

  const {
    data: items,
    error: itemsError,
  } =
    await supabase
      .from("order_items")
      .select(
        `
        id,
        product_id,
        product_name,
        unit_price,
        quantity,
        refunded_quantity
        `,
      )
      .eq(
        "order_id",
        order.id,
      )
      .order("created_at");

  if (itemsError) {
    throw new Error(
      itemsError.message,
    );
  }

  return {
    orderId:
      order.id,

    orderNumber:
      order.order_number,

    status:
      order.status,

    subtotal:
      Number(
        order.subtotal,
      ),

    refundedAmount:
      Number(
        order.refunded_amount ??
        0,
      ),

    items:
      (items ?? []).map(
        (item) => {
          const quantity =
            Number(
              item.quantity,
            );

          const refundedQuantity =
            Number(
              item.refunded_quantity ??
              0,
            );

          return {
            orderItemId:
              item.id,

            productId:
              item.product_id,

            productName:
              item.product_name,

            unitPrice:
              Number(
                item.unit_price,
              ),

            quantity,

            refundedQuantity,

            remainingQuantity:
              Math.max(
                0,
                quantity -
                  refundedQuantity,
              ),
          };
        },
      ),
  };
}


export async function refundCloudOrder(
  input: {
    orderId: string;
    reason: string;
    staffName: string;
    staffRole: string;
    items: CloudRefundItemRequest[];
  },
): Promise<CloudRefundResult> {
  const supabase =
    createClient();

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "refund_pos_order",
      {
        p_order_id:
          input.orderId,

        p_reason:
          input.reason,

        p_staff_name:
          input.staffName,

        p_staff_role:
          input.staffRole,

        p_items:
          input.items.map(
            (item) => ({
              order_item_id:
                item.orderItemId,

              quantity:
                item.quantity,

              restock:
                item.restock,
            }),
          ),
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
    typeof result.refund_id !==
      "string"
  ) {
    throw new Error(
      "Refund completed without returning a refund ID.",
    );
  }

  const returnedStatus =
    String(
      result.order_status,
    );

  if (
    returnedStatus !==
      "Partially Refunded" &&
    returnedStatus !==
      "Refunded"
  ) {
    throw new Error(
      "Supabase returned an unexpected refund status.",
    );
  }

  return {
    refundId:
      result.refund_id,

    orderNumber:
      String(
        result.order_number,
      ),

    orderStatus:
      returnedStatus,

    refundedGross:
      Number(
        result.refunded_gross,
      ),

    refundedNet:
      Number(
        result.refunded_net,
      ),

    refundedVat:
      Number(
        result.refunded_vat,
      ),
  };
}
