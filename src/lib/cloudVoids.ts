"use client";

import {
  createClient,
} from "@/lib/supabase/client";

export type CloudVoidOrderIdentity = {
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

export type CloudVoidResult = {
  orderId: string;
  orderNumber: string;
  orderStatus: "Voided";
  voidedAt: string;
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

async function resolveCloudOrderId(
  identity: CloudVoidOrderIdentity,
) {
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
        subtotal,
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
    error,
  } =
    await query.maybeSingle();

  if (
    error ||
    !order
  ) {
    throw new Error(
      error?.message ??
        `Cloud order ${identity.orderNumber} was not found.`,
    );
  }

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

  return order.id as string;
}

export async function voidCloudOrder(
  input: {
    identity:
      CloudVoidOrderIdentity;

    reason: string;

    staffName: string;

    staffRole: string;
  },
): Promise<CloudVoidResult> {
  const supabase =
    createClient();

  const cloudOrderId =
    await resolveCloudOrderId(
      input.identity,
    );

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "void_pos_order",
      {
        p_order_id:
          cloudOrderId,

        p_reason:
          input.reason,

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
    typeof result.order_id !==
      "string"
  ) {
    throw new Error(
      "Void completed without returning a cloud order ID.",
    );
  }

  if (
    result.order_status !==
    "Voided"
  ) {
    throw new Error(
      "Supabase returned an unexpected void status.",
    );
  }

  return {
    orderId:
      result.order_id,

    orderNumber:
      String(
        result.order_number,
      ),

    orderStatus:
      "Voided",

    voidedAt:
      String(
        result.voided_at,
      ),
  };
}
