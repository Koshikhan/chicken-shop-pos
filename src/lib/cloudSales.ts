"use client";

import {
  createClient,
} from "@/lib/supabase/client";

export type CloudSaleItem = {
  productId: string;
  quantity: number;
};

export type CompleteCloudSaleInput = {
  locationId: string;
  orderNumber: string;

  orderType:
    | "Takeaway"
    | "Eat In"
    | "Delivery";

  taxType:
    | "VAT"
    | "NON_VAT";

  vatRate: number;
  netAmount: number;
  vatAmount: number;
  subtotal: number;

  paymentMethod:
    | "Cash"
    | "Card";

  amountReceived: number;
  change: number;

  staffName: string;
  staffRole: string;

  items: CloudSaleItem[];
};

export type CompleteCloudSaleResult = {
  orderId: string;
  orderNumber: string;
};

export async function completeCloudSale(
  input: CompleteCloudSaleInput,
): Promise<CompleteCloudSaleResult> {
  const supabase =
    createClient();

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "complete_pos_sale",
      {
        p_location_id:
          input.locationId,

        p_order_number:
          input.orderNumber,

        p_order_type:
          input.orderType,

        p_tax_type:
          input.taxType,

        p_vat_rate:
          input.vatRate,

        p_net_amount:
          input.netAmount,

        p_vat_amount:
          input.vatAmount,

        p_subtotal:
          input.subtotal,

        p_payment_method:
          input.paymentMethod,

        p_amount_received:
          input.amountReceived,

        p_change:
          input.change,

        p_staff_name:
          input.staffName,

        p_staff_role:
          input.staffRole,

        p_items:
          input.items.map(
            (item) => ({
              product_id:
                item.productId,

              quantity:
                item.quantity,
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
    typeof result.order_id !==
      "string"
  ) {
    throw new Error(
      "The cloud sale completed without returning an order ID.",
    );
  }

  return {
    orderId:
      result.order_id,

    orderNumber:
      typeof result.order_number ===
      "string"
        ? result.order_number
        : input.orderNumber,
  };
}