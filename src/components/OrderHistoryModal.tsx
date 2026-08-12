"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  addInventoryMovements,
  createInventoryMovement,
} from "@/lib/inventoryStorage";

import {
  loadCloudRefundableOrder,
  refundCloudOrder,
  type CloudRefundableOrder,
} from "@/lib/cloudRefunds";

import {
  voidCloudOrder,
} from "@/lib/cloudVoids";

import type {
  Product,
} from "@/lib/menuStorage";

import {
  attachCloudOrderIdLocally,
  getOrderFinancialSummary,
  recordCloudRefundLocally,
  recordCloudVoidLocally,
  type SavedOrder,
} from "@/lib/orderStorage";

import type {
  StaffMember,
} from "@/lib/staffStorage";

type OrderHistoryModalProps = {
  isOpen: boolean;
  orders: SavedOrder[];
  products: Product[];
  activeStaff?: StaffMember | null;
  onOrdersChange?: (
    orders: SavedOrder[],
  ) => void;
  onProductsChange?: (
    products: Product[],
  ) => void;
  onClose: () => void;
};

type StatusFilter =
  | "All"
  | SavedOrder["status"];

type OrderAction =
  | "refund"
  | "void"
  | null;

type RefundSelection = {
  quantity: number;
  restock: boolean;
};

type RefundSelections =
  Record<
    string,
    RefundSelection
  >;

const currencyFormatter =
  new Intl.NumberFormat(
    "en-GB",
    {
      style: "currency",
      currency: "GBP",
    },
  );

const dateFormatter =
  new Intl.DateTimeFormat(
    "en-GB",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );

function escapeHtml(
  value: string,
) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getStatusClasses(
  status: SavedOrder["status"],
) {
  switch (status) {
    case "Voided":
      return "bg-red-100 text-red-700";

    case "Refunded":
      return "bg-purple-100 text-purple-700";

    case "Partially Refunded":
      return "bg-amber-100 text-amber-800";

    default:
      return "bg-green-100 text-green-700";
  }
}

function getAuditActionLabel(
  action: string,
) {
  switch (action) {
    case "ORDER_VOIDED":
      return "Order voided";

    case "ORDER_REFUNDED":
      return "Refund processed";

    default:
      return "Order completed";
  }
}

export function OrderHistoryModal({
  isOpen,
  orders,
  products,
  activeStaff,
  onOrdersChange,
  onProductsChange,
  onClose,
}: OrderHistoryModalProps) {
  const [
    displayOrders,
    setDisplayOrders,
  ] =
    useState<SavedOrder[]>(
      orders,
    );

  const [search, setSearch] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>(
      "All",
    );

  const [
    actionType,
    setActionType,
  ] =
    useState<OrderAction>(
      null,
    );

  const [
    actionOrderId,
    setActionOrderId,
  ] = useState("");

  const [
    refundSelections,
    setRefundSelections,
  ] =
    useState<RefundSelections>(
      {},
    );

  const [
    actionReason,
    setActionReason,
  ] = useState("");

  const [
    actionError,
    setActionError,
  ] = useState("");

  const [notice, setNotice] =
    useState("");

  const [
    cloudRefundOrder,
    setCloudRefundOrder,
  ] =
    useState<CloudRefundableOrder | null>(
      null,
    );

  const [
    isRefundLoading,
    setIsRefundLoading,
  ] = useState(false);

  const [
    isActionSubmitting,
    setIsActionSubmitting,
  ] = useState(false);

  useEffect(() => {
    setDisplayOrders(
      orders,
    );
  }, [orders]);

  const canManageOrders =
    activeStaff?.role ===
      "Manager" ||
    activeStaff?.role ===
      "Supervisor";

  const filteredOrders =
    useMemo(() => {
      const searchValue =
        search
          .trim()
          .toLowerCase();

      return displayOrders.filter(
        (order) => {
          const matchesStatus =
            statusFilter ===
              "All" ||
            order.status ===
              statusFilter;

          if (!matchesStatus) {
            return false;
          }

          if (!searchValue) {
            return true;
          }

          const productNames =
            order.items
              .map(
                (item) =>
                  item.name,
              )
              .join(" ")
              .toLowerCase();

          const saleType =
            order.taxType ===
            "VAT"
              ? "vat sale"
              : "non-vat sale";

          const refundReasons =
            (
              order.refunds ??
              []
            )
              .map(
                (refund) =>
                  refund.reason,
              )
              .join(" ")
              .toLowerCase();

          const auditStaff =
            (
              order.auditTrail ??
              []
            )
              .map(
                (entry) =>
                  entry
                    .performedBy
                    .name,
              )
              .join(" ")
              .toLowerCase();

          const voidDetails = [
            order.voidReason ??
              "",
            order.voidedBy
              ?.name ?? "",
          ]
            .join(" ")
            .toLowerCase();

          return (
            order.orderNumber
              .toLowerCase()
              .includes(
                searchValue,
              ) ||
            order.paymentMethod
              .toLowerCase()
              .includes(
                searchValue,
              ) ||
            order.orderType
              .toLowerCase()
              .includes(
                searchValue,
              ) ||
            order.status
              .toLowerCase()
              .includes(
                searchValue,
              ) ||
            saleType.includes(
              searchValue,
            ) ||
            productNames.includes(
              searchValue,
            ) ||
            refundReasons.includes(
              searchValue,
            ) ||
            auditStaff.includes(
              searchValue,
            ) ||
            voidDetails.includes(
              searchValue,
            )
          );
        },
      );
    }, [
      displayOrders,
      search,
      statusFilter,
    ]);

  const actionOrder =
    displayOrders.find(
      (order) =>
        order.id ===
        actionOrderId,
    ) ?? null;

  const refundableItems =
    actionType === "refund" &&
    actionOrder &&
    cloudRefundOrder
      ? cloudRefundOrder.items.map(
          (cloudItem) => {
            const matchingProduct =
              products.find(
                (product) =>
                  product.cloudId ===
                  cloudItem.productId,
              ) ??
              products.find(
                (product) =>
                  product.name ===
                  cloudItem.productName,
              );

            const matchingLocalItem =
              actionOrder.items.find(
                (item) =>
                  matchingProduct
                    ? item.id ===
                      matchingProduct.id
                    : item.name ===
                      cloudItem.productName,
              );

            return {
              id:
                cloudItem.orderItemId,
              orderItemId:
                cloudItem.orderItemId,
              productId:
                cloudItem.productId,
              localProductId:
                matchingLocalItem?.id ??
                matchingProduct?.id ??
                null,
              name:
                cloudItem.productName,
              price:
                cloudItem.unitPrice,
              quantity:
                cloudItem.quantity,
              refundedQuantity:
                cloudItem.refundedQuantity,
              remainingQuantity:
                cloudItem.remainingQuantity,
            };
          },
        )
      : [];

  const selectedRefundItems =
    refundableItems.flatMap(
      (item) => {
        const selection =
          refundSelections[
            String(
              item.id,
            )
          ];

        if (
          !selection ||
          selection.quantity <=
            0
        ) {
          return [];
        }

        return [
          {
            orderItemId:
              item.orderItemId,
            productId:
              item.productId,
            localProductId:
              item.localProductId,
            name: item.name,
            price: item.price,
            quantity:
              selection.quantity,
            restock:
              selection.restock,
          },
        ];
      },
    );

  const selectedRefundAmount =
    Math.round(
      (
        selectedRefundItems.reduce(
          (total, item) =>
            total +
            item.price *
              item.quantity,
          0,
        ) +
        Number.EPSILON
      ) * 100,
    ) / 100;

  const selectedRefundQuantity =
    selectedRefundItems.reduce(
      (total, item) =>
        total +
        item.quantity,
      0,
    );

  const selectedRestockQuantity =
    selectedRefundItems.reduce(
      (total, item) =>
        total +
        (item.restock
          ? item.quantity
          : 0),
      0,
    );

  if (!isOpen) {
    return null;
  }

  const closeActionModal =
    () => {
      setActionType(null);
      setActionOrderId("");
      setRefundSelections(
        {},
      );
      setActionReason("");
      setActionError("");
      setCloudRefundOrder(
        null,
      );
      setIsRefundLoading(
        false,
      );
      setIsActionSubmitting(
        false,
      );
    };

  const publishOrders = (
    updatedOrders:
      SavedOrder[],
  ) => {
    setDisplayOrders(
      updatedOrders,
    );

    onOrdersChange?.(
      updatedOrders,
    );
  };

  const openRefund = async (
    order: SavedOrder,
  ) => {
    setActionType(
      "refund",
    );

    setActionOrderId(
      order.id,
    );

    setRefundSelections(
      {},
    );

    setActionReason("");
    setActionError("");
    setCloudRefundOrder(
      null,
    );
    setIsRefundLoading(
      true,
    );

    try {
      const cloudOrder =
        await loadCloudRefundableOrder(
          {
            cloudOrderId:
              order.cloudOrderId,
            orderNumber:
              order.orderNumber,
            subtotal:
              order.subtotal,
            orderType:
              order.orderType,
            paymentMethod:
              order.paymentMethod,
            createdAt:
              order.createdAt,
          },
        );

      setCloudRefundOrder(
        cloudOrder,
      );

      // Existing cloud sales created before cloudOrderId was
      // added can be safely linked after their details match.
      if (
        !order.cloudOrderId
      ) {
        const updatedOrders =
          attachCloudOrderIdLocally(
            order.id,
            cloudOrder.orderId,
          );

        publishOrders(
          updatedOrders,
        );
      }

      const selections:
        RefundSelections = {};

      cloudOrder.items.forEach(
        (item) => {
          selections[
            item.orderItemId
          ] = {
            quantity: 0,
            restock: false,
          };
        },
      );

      setRefundSelections(
        selections,
      );
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to load the cloud order for refund.",
      );
    } finally {
      setIsRefundLoading(
        false,
      );
    }
  };

  const openVoid = (
    order: SavedOrder,
  ) => {
    setActionType("void");
    setActionOrderId(
      order.id,
    );
    setActionReason("");
    setActionError("");
  };

  const updateRefundQuantity = (
    itemId: string,
    nextQuantity: number,
    maximum: number,
  ) => {
    const quantity =
      Math.max(
        0,
        Math.min(
          maximum,
          Math.floor(
            nextQuantity,
          ),
        ),
      );

    setRefundSelections(
      (current) => ({
        ...current,
        [String(itemId)]: {
          quantity,
          restock:
            current[
              String(
                itemId,
              )
            ]?.restock ??
            false,
        },
      }),
    );

    setActionError("");
  };

  const toggleRefundRestock = (
    itemId: string,
    restock: boolean,
  ) => {
    setRefundSelections(
      (current) => ({
        ...current,
        [String(itemId)]: {
          quantity:
            current[
              String(
                itemId,
              )
            ]?.quantity ??
            0,
          restock,
        },
      }),
    );

    setActionError("");
  };

  const selectAllRefundItems =
    () => {
      if (
        !actionOrder ||
        !cloudRefundOrder
      ) {
        return;
      }

      const selections:
        RefundSelections = {};

      refundableItems.forEach(
        (item) => {
          selections[
            item.orderItemId
          ] = {
            quantity:
              item.remainingQuantity,
            restock: false,
          };
        },
      );

      setRefundSelections(
        selections,
      );
      setActionError("");
    };

  const handleRefund =
    async () => {
      if (
        !activeStaff ||
        !canManageOrders ||
        !actionOrder ||
        !cloudRefundOrder
      ) {
        setActionError(
          "A manager or supervisor must be signed in and the cloud order must be loaded.",
        );
        return;
      }

      if (
        selectedRefundItems.length ===
          0 ||
        selectedRefundAmount <=
          0
      ) {
        setActionError(
          "Select at least one item to refund.",
        );
        return;
      }

      if (
        !actionReason.trim()
      ) {
        setActionError(
          "Enter a refund reason.",
        );
        return;
      }

      const missingLocalMapping =
        selectedRefundItems.find(
          (item) =>
            item.localProductId ===
            null,
        );

      if (
        missingLocalMapping
      ) {
        setActionError(
          `Unable to match ${missingLocalMapping.name} to the current POS product list.`,
        );
        return;
      }

      setIsActionSubmitting(
        true,
      );

      try {
        const cloudResult =
          await refundCloudOrder(
            {
              orderId:
                cloudRefundOrder.orderId,
              reason:
                actionReason,
              staffName:
                activeStaff.name,
              staffRole:
                activeStaff.role,
              items:
                selectedRefundItems.map(
                  (item) => ({
                    orderItemId:
                      item.orderItemId,
                    quantity:
                      item.quantity,
                    restock:
                      item.restock,
                  }),
                ),
            },
          );

        const localRefundItems =
          selectedRefundItems.map(
            (item) => ({
              id:
                item.localProductId as number,
              name:
                item.name,
              unitPrice:
                item.price,
              quantity:
                item.quantity,
              grossAmount:
                Math.round(
                  (
                    item.price *
                    item.quantity +
                    Number.EPSILON
                  ) *
                    100,
                ) / 100,
              restocked:
                item.restock,
            }),
          );

        const updatedOrders =
          recordCloudRefundLocally(
            {
              orderId:
                actionOrder.id,
              refundId:
                cloudResult.refundId,
              amount:
                cloudResult.refundedGross,
              netAmount:
                cloudResult.refundedNet,
              vatAmount:
                cloudResult.refundedVat,
              items:
                localRefundItems,
              reason:
                actionReason,
              performedBy: {
                name:
                  activeStaff.name,
                role:
                  activeStaff.role,
              },
              status:
                cloudResult.orderStatus,
            },
          );

        const restoreByProductId =
          new Map<number, number>();

        selectedRefundItems
          .filter(
            (item) =>
              item.restock,
          )
          .forEach(
            (item) => {
              const localProductId =
                item.localProductId as number;

              restoreByProductId.set(
                localProductId,
                (
                  restoreByProductId.get(
                    localProductId,
                  ) ?? 0
                ) +
                  item.quantity,
              );
            },
          );

        const restoredProducts =
          products.map(
            (product) => {
              const quantityToRestore =
                restoreByProductId.get(
                  product.id,
                ) ?? 0;

              if (
                !product.trackStock ||
                quantityToRestore <=
                  0
              ) {
                return product;
              }

              return {
                ...product,
                stockQuantity:
                  product.stockQuantity +
                  quantityToRestore,
              };
            },
          );

        const stockMovements =
          selectedRefundItems.flatMap(
            (item) => {
              if (
                !item.restock
              ) {
                return [];
              }

              const localProductId =
                item.localProductId as number;

              const previousProduct =
                products.find(
                  (product) =>
                    product.id ===
                    localProductId,
                );

              const restoredProduct =
                restoredProducts.find(
                  (product) =>
                    product.id ===
                    localProductId,
                );

              if (
                !previousProduct ||
                !restoredProduct ||
                !previousProduct.trackStock
              ) {
                return [];
              }

              return [
                createInventoryMovement(
                  {
                    productId:
                      previousProduct.id,
                    productName:
                      previousProduct.name,
                    type:
                      "REFUND_RESTORE",
                    quantityChange:
                      item.quantity,
                    previousStock:
                      previousProduct.stockQuantity,
                    newStock:
                      restoredProduct.stockQuantity,
                    note:
                      `Cloud refund on order #${cloudResult.orderNumber}. ${actionReason.trim()}`,
                    orderId:
                      actionOrder.id,
                    orderNumber:
                      cloudResult.orderNumber,
                    performedBy: {
                      name:
                        activeStaff.name,
                      role:
                        activeStaff.role,
                    },
                  },
                ),
              ];
            },
          );

        addInventoryMovements(
          stockMovements,
        );

        if (
          selectedRestockQuantity >
          0
        ) {
          onProductsChange?.(
            restoredProducts,
          );
        }

        publishOrders(
          updatedOrders,
        );

        const restockMessage =
          selectedRestockQuantity >
          0
            ? ` ${selectedRestockQuantity} returned unit${selectedRestockQuantity === 1 ? " was" : "s were"} restored to stock.`
            : " No items were returned to sellable stock.";

        setNotice(
          `Cloud refund of ${currencyFormatter.format(
            cloudResult.refundedGross,
          )} completed for order #${cloudResult.orderNumber}.${restockMessage}`,
        );

        closeActionModal();
      } catch (error) {
        setActionError(
          error instanceof
            Error
            ? error.message
            : "Unable to process the cloud refund.",
        );
      } finally {
        setIsActionSubmitting(
          false,
        );
      }
    };

  const handleVoid =
    async () => {
      if (
        !activeStaff ||
        !canManageOrders ||
        !actionOrder
      ) {
        setActionError(
          "A manager or supervisor must be signed in.",
        );
        return;
      }

      if (
        !actionReason.trim()
      ) {
        setActionError(
          "Enter a void reason.",
        );
        return;
      }

      setIsActionSubmitting(
        true,
      );

      try {
        const cloudResult =
          await voidCloudOrder(
            {
              identity: {
                cloudOrderId:
                  actionOrder.cloudOrderId,
                orderNumber:
                  actionOrder.orderNumber,
                subtotal:
                  actionOrder.subtotal,
                orderType:
                  actionOrder.orderType,
                paymentMethod:
                  actionOrder.paymentMethod,
                createdAt:
                  actionOrder.createdAt,
              },
              reason:
                actionReason,
              staffName:
                activeStaff.name,
              staffRole:
                activeStaff.role,
            },
          );

        const updatedOrders =
          recordCloudVoidLocally(
            {
              orderId:
                actionOrder.id,
              cloudOrderId:
                cloudResult.orderId,
              reason:
                actionReason,
              performedBy: {
                name:
                  activeStaff.name,
                role:
                  activeStaff.role,
              },
              voidedAt:
                cloudResult.voidedAt,
            },
          );

        const quantityByProductId =
          new Map<number, number>();

        actionOrder.items.forEach(
          (item) => {
            quantityByProductId.set(
              item.id,
              (
                quantityByProductId.get(
                  item.id,
                ) ?? 0
              ) +
                item.quantity,
            );
          },
        );

        const restoredProducts =
          products.map(
            (product) => {
              const quantityToRestore =
                quantityByProductId.get(
                  product.id,
                ) ?? 0;

              if (
                !product.trackStock ||
                quantityToRestore <=
                  0
              ) {
                return product;
              }

              return {
                ...product,
                stockQuantity:
                  product.stockQuantity +
                  quantityToRestore,
              };
            },
          );

        const stockMovements =
          actionOrder.items.flatMap(
            (item) => {
              const previousProduct =
                products.find(
                  (product) =>
                    product.id ===
                    item.id,
                );

              const restoredProduct =
                restoredProducts.find(
                  (product) =>
                    product.id ===
                    item.id,
                );

              if (
                !previousProduct ||
                !restoredProduct ||
                !previousProduct.trackStock
              ) {
                return [];
              }

              return [
                createInventoryMovement(
                  {
                    productId:
                      previousProduct.id,
                    productName:
                      previousProduct.name,
                    type:
                      "VOID_RESTORE",
                    quantityChange:
                      item.quantity,
                    previousStock:
                      previousProduct.stockQuantity,
                    newStock:
                      restoredProduct.stockQuantity,
                    note:
                      `Cloud void on order #${cloudResult.orderNumber}. ${actionReason.trim()}`,
                    orderId:
                      actionOrder.id,
                    orderNumber:
                      cloudResult.orderNumber,
                    performedBy: {
                      name:
                        activeStaff.name,
                      role:
                        activeStaff.role,
                    },
                  },
                ),
              ];
            },
          );

        addInventoryMovements(
          stockMovements,
        );

        onProductsChange?.(
          restoredProducts,
        );

        publishOrders(
          updatedOrders,
        );

        setNotice(
          `Order #${cloudResult.orderNumber} was voided in the cloud and its tracked stock was restored.`,
        );

        closeActionModal();
      } catch (error) {
        setActionError(
          error instanceof
            Error
            ? error.message
            : "Unable to void the cloud order.",
        );
      } finally {
        setIsActionSubmitting(
          false,
        );
      }
    };

  const printReceipt = (
    order: SavedOrder,
  ) => {
    const receiptWindow =
      window.open(
        "",
        "_blank",
        "width=440,height=760",
      );

    if (!receiptWindow) {
      window.alert(
        "Please allow pop-ups to print the receipt.",
      );
      return;
    }

    const financial =
      getOrderFinancialSummary(
        order,
      );

    const itemRows =
      order.items
        .map(
          (item) => `
            <tr>
              <td>
                ${item.quantity} ×
                ${escapeHtml(
                  item.name,
                )}
              </td>

              <td style="text-align:right">
                ${currencyFormatter.format(
                  item.price *
                    item.quantity,
                )}
              </td>
            </tr>
          `,
        )
        .join("");

    const taxRows =
      order.taxType ===
      "VAT"
        ? `
          <tr>
            <td>Original net</td>

            <td style="text-align:right">
              ${currencyFormatter.format(
                order.netAmount,
              )}
            </td>
          </tr>

          <tr>
            <td>
              Original VAT at
              ${Math.round(
                order.vatRate *
                  100,
              )}%
            </td>

            <td style="text-align:right">
              ${currencyFormatter.format(
                order.vatAmount,
              )}
            </td>
          </tr>
        `
        : `
          <tr>
            <td>VAT</td>

            <td style="text-align:right">
              Not charged
            </td>
          </tr>
        `;

    const refundRows =
      (
        order.refunds ??
        []
      )
        .map(
          (refund) => `
            <tr>
              <td>
                Refund
                ${escapeHtml(
                  dateFormatter.format(
                    new Date(
                      refund.createdAt,
                    ),
                  ),
                )}
              </td>

              <td style="text-align:right">
                −${currencyFormatter.format(
                  refund.amount,
                )}
              </td>
            </tr>

            <tr>
              <td colspan="2" class="note">
                ${escapeHtml(
                  refund.reason,
                )}
                ·
                ${escapeHtml(
                  refund
                    .performedBy
                    .name,
                )}
              </td>
            </tr>
          `,
        )
        .join("");

    const voidRows =
      order.status ===
      "Voided"
        ? `
          <tr>
            <td>
              Void reason
            </td>

            <td style="text-align:right">
              ${escapeHtml(
                order.voidReason ??
                  "Not recorded",
              )}
            </td>
          </tr>

          <tr>
            <td>
              Voided by
            </td>

            <td style="text-align:right">
              ${escapeHtml(
                order.voidedBy
                  ?.name ??
                  "Not recorded",
              )}
            </td>
          </tr>
        `
        : "";

    receiptWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />

          <title>
            Receipt
            ${escapeHtml(
              order.orderNumber,
            )}
          </title>

          <style>
            body {
              width: 310px;
              margin: 0 auto;
              padding: 24px 10px;
              color: #111827;
              font-family:
                Arial,
                sans-serif;
            }

            h1,
            p {
              margin: 0;
            }

            .centre {
              text-align: center;
            }

            .divider {
              margin: 16px 0;
              border-top:
                1px dashed #111827;
            }

            table {
              width: 100%;
              border-collapse:
                collapse;
              font-size: 13px;
            }

            td {
              padding: 5px 0;
              vertical-align: top;
            }

            .total {
              font-size: 19px;
              font-weight: 800;
            }

            .small,
            .note {
              color: #4b5563;
              font-size: 11px;
            }

            .status {
              margin-top: 8px;
              font-weight: 800;
            }

            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>

        <body>
          <div class="centre">
            <h1>
              Chicken Shop
            </h1>

            <p class="small">
              Main Branch
            </p>

            <p class="status">
              ${escapeHtml(
                order.status,
              )}
            </p>
          </div>

          <div class="divider"></div>

          <table>
            <tr>
              <td>
                Order
              </td>

              <td style="text-align:right">
                #${escapeHtml(
                  order.orderNumber,
                )}
              </td>
            </tr>

            <tr>
              <td>
                Type
              </td>

              <td style="text-align:right">
                ${escapeHtml(
                  order.orderType,
                )}
              </td>
            </tr>

            <tr>
              <td>
                Date
              </td>

              <td style="text-align:right">
                ${escapeHtml(
                  dateFormatter.format(
                    new Date(
                      order.createdAt,
                    ),
                  ),
                )}
              </td>
            </tr>
          </table>

          <div class="divider"></div>

          <table>
            ${itemRows}
          </table>

          <div class="divider"></div>

          <table>
            <tr>
              <td>
                Sale type
              </td>

              <td style="text-align:right">
                ${
                  order.taxType ===
                  "VAT"
                    ? "VAT Sale"
                    : "Non-VAT Sale"
                }
              </td>
            </tr>

            ${taxRows}

            <tr>
              <td>
                Original total
              </td>

              <td style="text-align:right">
                ${currencyFormatter.format(
                  order.subtotal,
                )}
              </td>
            </tr>

            ${refundRows}

            ${voidRows}

            <tr class="total">
              <td>
                Recognised total
              </td>

              <td style="text-align:right">
                ${currencyFormatter.format(
                  financial.recognisedGrossAmount,
                )}
              </td>
            </tr>

            <tr>
              <td>
                Payment
              </td>

              <td style="text-align:right">
                ${escapeHtml(
                  order.paymentMethod,
                )}
              </td>
            </tr>
          </table>

          <div class="divider"></div>

          <p class="centre small">
            Order record copy
          </p>

          <script>
            window.onload = () => {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    receiptWindow.document.close();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-label="Order history"
      >
        <section className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-slate-100 shadow-2xl">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white p-6">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-orange-500">
                Sales
              </p>

              <h2 className="mt-1 text-3xl font-black text-slate-950">
                Order History
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {
                  displayOrders.length
                }{" "}
                saved{" "}
                {displayOrders.length ===
                1
                  ? "order"
                  : "orders"}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-500 hover:bg-red-100 hover:text-red-600"
              aria-label="Close order history"
            >
              ×
            </button>
          </header>

          <div className="border-b border-slate-200 bg-white p-5">
            <div className="grid gap-3 md:grid-cols-[1fr_220px]">
              <input
                type="search"
                value={search}
                onChange={(
                  event,
                ) =>
                  setSearch(
                    event.target
                      .value,
                  )
                }
                placeholder="Search order, item, status, staff or reason..."
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 font-semibold text-slate-950 outline-none focus:border-orange-500"
              />

              <select
                value={
                  statusFilter
                }
                onChange={(
                  event,
                ) =>
                  setStatusFilter(
                    event.target
                      .value as StatusFilter,
                  )
                }
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 font-semibold text-slate-950 outline-none focus:border-orange-500"
              >
                <option value="All">
                  All statuses
                </option>

                <option value="Completed">
                  Completed
                </option>

                <option value="Partially Refunded">
                  Partially refunded
                </option>

                <option value="Refunded">
                  Refunded
                </option>

                <option value="Voided">
                  Voided
                </option>
              </select>
            </div>

            {notice && (
              <p className="mt-3 rounded-xl bg-green-100 p-3 text-sm font-bold text-green-800">
                {notice}
              </p>
            )}

            {!activeStaff && (
              <p className="mt-3 rounded-xl bg-amber-100 p-3 text-sm font-bold text-amber-800">
                Sign in as a manager
                or supervisor to
                process refunds and
                voids.
              </p>
            )}
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {filteredOrders.length ===
            0 ? (
              <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center">
                <span className="text-5xl">
                  🧾
                </span>

                <h3 className="mt-4 text-xl font-black">
                  No orders found
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Try another search
                  or status filter.
                </p>
              </div>
            ) : (
              filteredOrders.map(
                (order) => {
                  const financial =
                    getOrderFinancialSummary(
                      order,
                    );

                  const canRefund =
                    canManageOrders &&
                    order.status !==
                      "Voided" &&
                    order.status !==
                      "Refunded" &&
                    financial.remainingRefundableAmount >
                      0;

                  const canVoid =
                    canManageOrders &&
                    order.status ===
                      "Completed";

                  return (
                    <article
                      key={order.id}
                      className={`rounded-2xl border bg-white p-5 shadow-sm ${
                        order.status ===
                        "Voided"
                          ? "border-red-200 opacity-90"
                          : "border-slate-200"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xl font-black">
                              Order #
                              {
                                order.orderNumber
                              }
                            </h3>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClasses(
                                order.status,
                              )}`}
                            >
                              {
                                order.status
                              }
                            </span>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${
                                order.taxType ===
                                "VAT"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {order.taxType ===
                              "VAT"
                                ? "VAT Sale"
                                : "Non-VAT Sale"}
                            </span>
                          </div>

                          <p className="mt-2 text-sm text-slate-500">
                            {dateFormatter.format(
                              new Date(
                                order.createdAt,
                              ),
                            )}
                          </p>

                          <p className="mt-1 text-sm font-semibold text-orange-600">
                            {
                              order.orderType
                            }
                            {" · "}
                            {
                              order.paymentMethod
                            }
                            {" · "}
                            {order.taxType ===
                            "VAT"
                              ? "VAT Sale"
                              : "Non-VAT Sale"}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-500">
                            Recognised
                            sales
                          </p>

                          <p className="text-2xl font-black">
                            {currencyFormatter.format(
                              financial.recognisedGrossAmount,
                            )}
                          </p>

                          {financial.recognisedGrossAmount !==
                            order.subtotal && (
                            <p className="mt-1 text-sm font-semibold text-slate-400 line-through">
                              {currencyFormatter.format(
                                order.subtotal,
                              )}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-5 rounded-xl bg-slate-100 p-4">
                        {order.items.map(
                          (item) => (
                            <div
                              key={
                                item.id
                              }
                              className="flex justify-between gap-4 py-1 text-sm"
                            >
                              <span className="font-semibold text-slate-700">
                                {
                                  item.quantity
                                }
                                {" × "}
                                {
                                  item.name
                                }
                              </span>

                              <span className="font-bold">
                                {currencyFormatter.format(
                                  item.price *
                                    item.quantity,
                                )}
                              </span>
                            </div>
                          ),
                        )}
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 rounded-xl border border-slate-200 p-4">
                          <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                            Original sale
                          </p>

                          <div className="flex justify-between text-sm font-semibold text-slate-600">
                            <span>
                              Net amount
                            </span>

                            <span>
                              {currencyFormatter.format(
                                order.netAmount,
                              )}
                            </span>
                          </div>

                          <div className="flex justify-between text-sm font-semibold text-slate-600">
                            <span>
                              VAT
                            </span>

                            <span>
                              {order.taxType ===
                              "VAT"
                                ? currencyFormatter.format(
                                    order.vatAmount,
                                  )
                                : "Not charged"}
                            </span>
                          </div>

                          <div className="flex justify-between border-t border-slate-200 pt-2 font-black">
                            <span>
                              Original total
                            </span>

                            <span>
                              {currencyFormatter.format(
                                order.subtotal,
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2 rounded-xl border border-slate-200 p-4">
                          <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                            Adjustments
                          </p>

                          <div className="flex justify-between text-sm font-semibold text-slate-600">
                            <span>
                              Refunded
                            </span>

                            <span>
                              {currencyFormatter.format(
                                financial.refundedGrossAmount,
                              )}
                            </span>
                          </div>

                          <div className="flex justify-between text-sm font-semibold text-slate-600">
                            <span>
                              VAT reversed
                            </span>

                            <span>
                              {currencyFormatter.format(
                                financial.refundedVatAmount,
                              )}
                            </span>
                          </div>

                          <div className="flex justify-between border-t border-slate-200 pt-2 font-black">
                            <span>
                              Remaining
                            </span>

                            <span>
                              {currencyFormatter.format(
                                financial.remainingRefundableAmount,
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {order.status ===
                        "Voided" && (
                        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                          <p className="font-black text-red-800">
                            Order voided
                          </p>

                          <p className="mt-2 text-sm font-semibold text-red-700">
                            {order.voidReason ??
                              "No reason recorded"}
                          </p>

                          <p className="mt-2 text-xs text-red-600">
                            {order.voidedBy
                              ?.name ??
                              "Unknown staff"}
                            {" · "}
                            {order.voidedAt
                              ? dateFormatter.format(
                                  new Date(
                                    order.voidedAt,
                                  ),
                                )
                              : "Date unavailable"}
                          </p>
                        </div>
                      )}

                      {(order.refunds ??
                        []).length >
                        0 && (
                        <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50 p-4">
                          <p className="font-black text-purple-800">
                            Refund history
                          </p>

                          <div className="mt-3 space-y-3">
                            {(
                              order.refunds ??
                              []
                            ).map(
                              (
                                refund,
                              ) => (
                                <div
                                  key={
                                    refund.id
                                  }
                                  className="rounded-lg bg-white p-3 text-sm"
                                >
                                  <div className="flex justify-between gap-4 font-black">
                                    <span>
                                      {dateFormatter.format(
                                        new Date(
                                          refund.createdAt,
                                        ),
                                      )}
                                    </span>

                                    <span className="text-purple-700">
                                      −
                                      {currencyFormatter.format(
                                        refund.amount,
                                      )}
                                    </span>
                                  </div>

                                  <p className="mt-2 font-semibold text-slate-700">
                                    {
                                      refund.reason
                                    }
                                  </p>

                                  {(refund.items ?? []).length >
                                    0 && (
                                    <div className="mt-2 rounded-lg bg-purple-50 p-2 text-xs text-purple-900">
                                      {(refund.items ?? []).map(
                                        (item) => (
                                          <p
                                            key={`${refund.id}-${item.id}`}
                                            className="mt-1 first:mt-0"
                                          >
                                            {item.quantity} × {item.name}
                                            {" · "}
                                            {currencyFormatter.format(
                                              item.grossAmount,
                                            )}
                                            {item.restocked
                                              ? " · Returned to stock"
                                              : " · Not restocked"}
                                          </p>
                                        ),
                                      )}
                                    </div>
                                  )}

                                  <p className="mt-1 text-xs text-slate-500">
                                    {
                                      refund
                                        .performedBy
                                        .name
                                    }
                                    {" · "}
                                    {
                                      refund
                                        .performedBy
                                        .role
                                    }
                                  </p>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                      {(order.auditTrail ??
                        []).length >
                        0 && (
                        <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <summary className="cursor-pointer font-black text-slate-700">
                            Audit history
                          </summary>

                          <div className="mt-3 space-y-3">
                            {(
                              order.auditTrail ??
                              []
                            ).map(
                              (
                                entry,
                              ) => (
                                <div
                                  key={
                                    entry.id
                                  }
                                  className="border-l-4 border-slate-300 pl-3 text-sm"
                                >
                                  <p className="font-black">
                                    {getAuditActionLabel(
                                      entry.action,
                                    )}
                                  </p>

                                  <p className="mt-1 text-slate-600">
                                    {
                                      entry
                                        .performedBy
                                        .name
                                    }
                                    {" · "}
                                    {
                                      entry
                                        .performedBy
                                        .role
                                    }
                                    {" · "}
                                    {dateFormatter.format(
                                      new Date(
                                        entry.createdAt,
                                      ),
                                    )}
                                  </p>

                                  {entry.reason && (
                                    <p className="mt-1 text-slate-600">
                                      {
                                        entry.reason
                                      }
                                    </p>
                                  )}
                                </div>
                              ),
                            )}
                          </div>
                        </details>
                      )}

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-500">
                          {
                            order.itemCount
                          }{" "}
                          item
                          {order.itemCount ===
                          1
                            ? ""
                            : "s"}
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {canRefund && (
                            <button
                              type="button"
                              onClick={() =>
                                openRefund(
                                  order,
                                )
                              }
                              className="rounded-xl bg-purple-600 px-5 py-3 font-bold text-white transition hover:bg-purple-700"
                            >
                              Refund
                            </button>
                          )}

                          {canVoid && (
                            <button
                              type="button"
                              onClick={() =>
                                openVoid(
                                  order,
                                )
                              }
                              className="rounded-xl bg-red-600 px-5 py-3 font-bold text-white transition hover:bg-red-700"
                            >
                              Void order
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              printReceipt(
                                order,
                              )
                            }
                            className="rounded-xl bg-slate-950 px-5 py-3 font-bold text-white transition hover:bg-slate-800"
                          >
                            Print record
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                },
              )
            )}
          </div>
        </section>
      </div>

      {actionType &&
        actionOrder && (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-4"
            role="dialog"
            aria-modal="true"
            aria-label={
              actionType ===
              "refund"
                ? "Refund order"
                : "Void order"
            }
          >
            <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest text-orange-500">
                    Manager action
                  </p>

                  <h3 className="mt-1 text-2xl font-black">
                    {actionType ===
                    "refund"
                      ? "Refund order"
                      : "Void order"}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Order #
                    {
                      actionOrder.orderNumber
                    }
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeActionModal
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-500 hover:bg-red-100 hover:text-red-600"
                  aria-label="Close action"
                >
                  ×
                </button>
              </div>

              {actionType ===
                "refund" && (
                <div className="mt-5">
                  {isRefundLoading ? (
                    <div className="rounded-xl bg-slate-100 p-5 text-sm font-bold text-slate-600">
                      Loading refundable items from Supabase...
                    </div>
                  ) : (
                    <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-700">
                        Select items to refund
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Choose the exact quantities being refunded. Only mark Return to stock when the item can be sold again.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={
                        isRefundLoading
                      }
                      onClick={
                        selectAllRefundItems
                      }
                      className="rounded-lg bg-purple-100 px-3 py-2 text-xs font-black text-purple-700 hover:bg-purple-200"
                    >
                      Select all remaining
                    </button>
                  </div>

                  <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
                    {refundableItems.map(
                      (item) => {
                        const selection =
                          refundSelections[
                            String(
                              item.id,
                            )
                          ] ?? {
                            quantity: 0,
                            restock: false,
                          };

                        const unavailable =
                          item.remainingQuantity <=
                          0;

                        return (
                          <div
                            key={item.id}
                            className={`rounded-xl border p-3 ${
                              unavailable
                                ? "border-slate-200 bg-slate-100 opacity-60"
                                : "border-slate-200 bg-white"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="font-black">
                                  {item.name}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {currencyFormatter.format(
                                    item.price,
                                  )} each
                                  {" · "}
                                  Bought {item.quantity}
                                  {" · "}
                                  {item.remainingQuantity} refundable
                                </p>
                              </div>

                              <p className="font-black text-purple-700">
                                {currencyFormatter.format(
                                  item.price *
                                    selection.quantity,
                                )}
                              </p>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={
                                    unavailable ||
                                    selection.quantity <=
                                      0
                                  }
                                  onClick={() =>
                                    updateRefundQuantity(
                                      item.id,
                                      selection.quantity -
                                        1,
                                      item.remainingQuantity,
                                    )
                                  }
                                  className="h-9 w-9 rounded-lg bg-slate-100 text-lg font-black hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  −
                                </button>

                                <span className="w-8 text-center font-black">
                                  {selection.quantity}
                                </span>

                                <button
                                  type="button"
                                  disabled={
                                    unavailable ||
                                    selection.quantity >=
                                      item.remainingQuantity
                                  }
                                  onClick={() =>
                                    updateRefundQuantity(
                                      item.id,
                                      selection.quantity +
                                        1,
                                      item.remainingQuantity,
                                    )
                                  }
                                  className="h-9 w-9 rounded-lg bg-slate-950 text-lg font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                                >
                                  +
                                </button>
                              </div>

                              <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={
                                    selection.restock
                                  }
                                  disabled={
                                    unavailable ||
                                    selection.quantity <=
                                      0
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    toggleRefundRestock(
                                      item.id,
                                      event.target
                                        .checked,
                                    )
                                  }
                                  className="h-5 w-5 accent-green-600"
                                />

                                Return to stock
                              </label>
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>

                  <div className="mt-4 rounded-xl bg-purple-50 p-4">
                    <div className="flex justify-between gap-4 text-sm font-semibold text-purple-800">
                      <span>
                        Selected items
                      </span>

                      <span>
                        {selectedRefundQuantity}
                      </span>
                    </div>

                    <div className="mt-2 flex justify-between gap-4 text-sm font-semibold text-purple-800">
                      <span>
                        Returning to stock
                      </span>

                      <span>
                        {selectedRestockQuantity}
                      </span>
                    </div>

                    <div className="mt-3 flex justify-between gap-4 border-t border-purple-200 pt-3 text-lg font-black text-purple-950">
                      <span>
                        Refund total
                      </span>

                      <span>
                        {currencyFormatter.format(
                          selectedRefundAmount,
                        )}
                      </span>
                    </div>

                    <p className="mt-2 text-xs font-semibold text-purple-700">
                      Maximum remaining refund: {currencyFormatter.format(
                        getOrderFinancialSummary(
                          actionOrder,
                        ).remainingRefundableAmount,
                      )}
                    </p>
                  </div>
                    </>
                  )}
                </div>
              )}

              <label className="mt-5 block text-sm font-black text-slate-700">
                {actionType ===
                "refund"
                  ? "Refund reason"
                  : "Void reason"}

                <textarea
                  value={
                    actionReason
                  }
                  onChange={(
                    event,
                  ) =>
                    setActionReason(
                      event.target
                        .value,
                    )
                  }
                  rows={4}
                  placeholder={
                    actionType ===
                    "refund"
                      ? "Example: Customer returned the order"
                      : "Example: Order entered twice"
                  }
                  className="mt-2 block w-full resize-none rounded-xl border-2 border-slate-200 px-4 py-3 font-semibold outline-none focus:border-orange-500"
                />
              </label>

              <div className="mt-4 rounded-xl bg-slate-100 p-4 text-sm">
                <p className="font-black">
                  Authorised by
                </p>

                <p className="mt-1 text-slate-600">
                  {activeStaff?.name ??
                    "No staff selected"}
                  {" · "}
                  {activeStaff?.role ??
                    "Unknown role"}
                </p>
              </div>

              {actionError && (
                <p className="mt-4 rounded-xl bg-red-100 p-3 text-sm font-bold text-red-700">
                  {actionError}
                </p>
              )}

              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={
                    closeActionModal
                  }
                  className="rounded-xl bg-slate-100 px-5 py-3 font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    isActionSubmitting ||
                    (
                      actionType ===
                        "refund" &&
                      isRefundLoading
                    )
                  }
                  onClick={
                    actionType ===
                    "refund"
                      ? handleRefund
                      : handleVoid
                  }
                  className={`rounded-xl px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                    actionType ===
                    "refund"
                      ? "bg-purple-600 hover:bg-purple-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {isActionSubmitting
                    ? "Processing..."
                    : actionType ===
                        "refund"
                      ? "Confirm refund"
                      : "Confirm void"}
                </button>
              </div>
            </section>
          </div>
        )}
    </>
  );
}
