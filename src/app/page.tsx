"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  InventoryManagementModal,
} from "@/components/InventoryManagementModal";

import {
  MenuManagementModal,
} from "@/components/MenuManagementModal";

import {
  OrderHistoryModal,
} from "@/components/OrderHistoryModal";

import {
  PaymentModal,
  type CompletedPayment,
} from "@/components/PaymentModal";

import {
  SalesReportModal,
} from "@/components/SalesReportModal";

import {
  StaffLoginModal,
} from "@/components/StaffLoginModal";

import {
  StaffManagementModal,
} from "@/components/StaffManagementModal";

import {
  BusinessSettingsModal,
} from "@/components/BusinessSettingsModal";

import {
  addInventoryMovements,
  createInventoryMovement,
} from "@/lib/inventoryStorage";

import {
  loadCloudMenu,
} from "@/lib/cloudMenu";

import {
  completeCloudSale,
} from "@/lib/cloudSales";

import {
  loadCloudOrders,
} from "@/lib/cloudOrders";

import {
  validateCloudStaffSession,
} from "@/lib/cloudStaff";

import {
  getPosTemplateLabel,
  getTerminalLabel,
  loadCloudBusinessSettings,
  type CloudBusinessSettings,
} from "@/lib/cloudBusiness";

import {
  DEFAULT_PRODUCTS,
  deductStockForItems,
  getProductStockStatus,
  isProductSellable,
  loadMenu,
  saveMenu,
  validateStockForItems,
  type Category,
  type Product,
} from "@/lib/menuStorage";

import {
  addOrder,
  createOrderId,
  loadOrders,
  saveOrders,
  type SavedOrder,
} from "@/lib/orderStorage";

import {
  clearActiveStaff,
  loadActiveStaff,
  saveActiveStaff,
  type StaffMember,
} from "@/lib/staffStorage";

import {
  calculateTaxBreakdown,
  type TaxType,
} from "@/lib/tax";

type SelectedCategory =
  | "All"
  | Category;

type OrderType =
  | "Takeaway"
  | "Eat In"
  | "Delivery";

type CartItem =
  Product & {
    quantity: number;
  };

const currencyFormatter =
  new Intl.NumberFormat(
    "en-GB",
    {
      style: "currency",
      currency: "GBP",
    },
  );

export default function Home() {
  const [
    selectedCategory,
    setSelectedCategory,
  ] =
    useState<SelectedCategory>(
      "All",
    );

  const [
    orderType,
    setOrderType,
  ] =
    useState<OrderType>(
      "Takeaway",
    );

  const [
    taxType,
    setTaxType,
  ] =
    useState<TaxType>(
      "VAT",
    );

  const [
    products,
    setProducts,
  ] =
    useState<Product[]>(
      [],
    );

  const [
    menuCategoryNames,
    setMenuCategoryNames,
  ] =
    useState<Category[]>(
      [],
    );

  const [
    productSearch,
    setProductSearch,
  ] =
    useState("");

  const [
    menuSource,
    setMenuSource,
  ] =
    useState<
      "CLOUD" | "LOCAL"
    >("LOCAL");

  const [
    cloudLocationId,
    setCloudLocationId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    isMenuLoading,
    setIsMenuLoading,
  ] = useState(true);

  const [
    cart,
    setCart,
  ] =
    useState<CartItem[]>(
      [],
    );

  const [
    notice,
    setNotice,
  ] = useState("");

  const [
    isPaymentOpen,
    setIsPaymentOpen,
  ] = useState(false);

  const [
    orderNumber,
    setOrderNumber,
  ] = useState(1);

  const [
    savedOrders,
    setSavedOrders,
  ] =
    useState<SavedOrder[]>(
      [],
    );

  const [
    isOrderHistoryOpen,
    setIsOrderHistoryOpen,
  ] = useState(false);

  const [
    isSalesReportOpen,
    setIsSalesReportOpen,
  ] = useState(false);

  const [
    isMenuManagementOpen,
    setIsMenuManagementOpen,
  ] = useState(false);

  const [
    isInventoryManagementOpen,
    setIsInventoryManagementOpen,
  ] = useState(false);

  const [
    activeStaff,
    setActiveStaff,
  ] =
    useState<StaffMember | null>(
      null,
    );

  const [
    isStaffLoginOpen,
    setIsStaffLoginOpen,
  ] = useState(true);

  const [
    isStaffManagementOpen,
    setIsStaffManagementOpen,
  ] = useState(false);

  const [
    businessSettings,
    setBusinessSettings,
  ] =
    useState<CloudBusinessSettings | null>(
      null,
    );

  const [
    isBusinessSettingsOpen,
    setIsBusinessSettingsOpen,
  ] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadBusinessSettings =
      async () => {
        try {
          const settings =
            await loadCloudBusinessSettings();

          if (!cancelled) {
            setBusinessSettings(
              settings,
            );
          }
        } catch (error) {
          console.error(
            "Unable to load business settings:",
            error,
          );
        }
      };

    void loadBusinessSettings();

    const storedStaff =
      loadActiveStaff();

    // Do not trust a cached operator until Supabase confirms
    // that the staff account is still active.
    setActiveStaff(
      null,
    );

    setIsStaffLoginOpen(
      true,
    );

    if (storedStaff) {
      const validateStoredStaff =
        async () => {
          try {
            const cloudStaff =
              await validateCloudStaffSession(
                storedStaff.id,
              );

            if (cancelled) {
              return;
            }

            if (!cloudStaff) {
              clearActiveStaff();
              setActiveStaff(
                null,
              );
              setIsStaffLoginOpen(
                true,
              );
              return;
            }

            saveActiveStaff(
              cloudStaff,
            );

            setActiveStaff(
              cloudStaff,
            );

            setIsStaffLoginOpen(
              false,
            );
          } catch (error) {
            console.error(
              "Unable to validate cached staff session:",
              error,
            );

            if (!cancelled) {
              clearActiveStaff();
              setActiveStaff(
                null,
              );
              setIsStaffLoginOpen(
                true,
              );
            }
          }
        };

      void validateStoredStaff();
    }

    // Local menu is used only if cloud loading fails.
    // We no longer show Fast Food demo products before we know
    // which business/template is signed in.
    const storedProducts =
      loadMenu();

    const existingOrders =
      loadOrders();

    setSavedOrders(
      existingOrders,
    );

    const highestOrderNumber =
      existingOrders.reduce(
        (
          highest,
          order,
        ) => {
          const number =
            Number.parseInt(
              order.orderNumber.replace(
                /\D/g,
                "",
              ),
              10,
            );

          if (
            Number.isNaN(
              number,
            )
          ) {
            return highest;
          }

          return Math.max(
            highest,
            number,
          );
        },
        0,
      );

    setOrderNumber(
      highestOrderNumber + 1,
    );

    const loadProductsFromCloud =
      async () => {
        try {
          const cloudMenu =
            await loadCloudMenu();

          if (cancelled) {
            return;
          }

          setProducts(
            cloudMenu.products,
          );

          setMenuCategoryNames(
            cloudMenu.categories,
          );

          setCloudLocationId(
            cloudMenu.locationId,
          );

          // Cache the most recent successful cloud menu locally.
          // If Supabase is temporarily unavailable later,
          // loadMenu() can still give us a usable fallback.
          saveMenu(
            cloudMenu.products,
          );

          setMenuSource(
            "CLOUD",
          );

          try {
            const cloudOrders =
              await loadCloudOrders(
                cloudMenu.products,
              );

            if (cancelled) {
              return;
            }

            setSavedOrders(
              cloudOrders,
            );

            // Keep a local cached copy only as a fallback.
            // Supabase is now the authoritative Order History.
            saveOrders(
              cloudOrders,
            );

            const highestCloudOrderNumber =
              cloudOrders.reduce(
                (
                  highest,
                  order,
                ) => {
                  const number =
                    Number.parseInt(
                      order.orderNumber.replace(
                        /\D/g,
                        "",
                      ),
                      10,
                    );

                  if (
                    Number.isNaN(
                      number,
                    )
                  ) {
                    return highest;
                  }

                  return Math.max(
                    highest,
                    number,
                  );
                },
                0,
              );

            if (
              highestCloudOrderNumber >
              0
            ) {
              setOrderNumber(
                highestCloudOrderNumber +
                  1,
              );
            }
          } catch (
            orderError
          ) {
            console.error(
              "Unable to load cloud order history. Using local cached orders:",
              orderError,
            );
          }
        } catch (error) {
          console.error(
            "Unable to load cloud menu. Using local fallback:",
            error,
          );

          if (cancelled) {
            return;
          }

          setProducts(
            storedProducts,
          );

          setMenuCategoryNames(
            Array.from(
              new Set(
                storedProducts.map(
                  (product) =>
                    product.category,
                ),
              ),
            ),
          );

          setCloudLocationId(
            null,
          );

          setMenuSource(
            "LOCAL",
          );
        } finally {
          if (!cancelled) {
            setIsMenuLoading(
              false,
            );
          }
        }
      };

    void loadProductsFromCloud();

    return () => {
      cancelled = true;
    };
  }, []);

  const canViewOrderHistory =
    activeStaff?.role ===
      "Supervisor" ||
    activeStaff?.role ===
      "Manager";

  const canManageMenu =
    activeStaff?.role ===
    "Manager";

  const canManageStaff =
    activeStaff?.role ===
    "Manager";

  const canManageBusinessSettings =
    activeStaff?.role ===
    "Manager";

  const canViewSalesReport =
    activeStaff?.role ===
    "Manager";

  const categories =
    useMemo(
      () => [
        "All",
        ...menuCategoryNames,
      ],
      [
        menuCategoryNames,
      ],
    );

  const isDeliTemplate =
    businessSettings?.posTemplate ===
    "DELI";

  useEffect(() => {
    if (
      selectedCategory ===
        "All" ||
      menuCategoryNames.includes(
        selectedCategory,
      )
    ) {
      return;
    }

    setSelectedCategory(
      "All",
    );
  }, [
    menuCategoryNames,
    selectedCategory,
  ]);

  const filteredProducts =
    useMemo(() => {
      const searchValue =
        productSearch
          .trim()
          .toLowerCase();

      return products.filter(
        (product) => {
          const matchesCategory =
            selectedCategory ===
              "All" ||
            product.category ===
              selectedCategory;

          const matchesSearch =
            !searchValue ||
            product.name
              .toLowerCase()
              .includes(
                searchValue,
              ) ||
            product.description
              .toLowerCase()
              .includes(
                searchValue,
              );

          return (
            matchesCategory &&
            matchesSearch
          );
        },
      );
    }, [
      products,
      selectedCategory,
      productSearch,
    ]);

  const lowStockCount =
    products.filter(
      (product) => {
        const status =
          getProductStockStatus(
            product,
          );

        return (
          status ===
            "LOW_STOCK" ||
          status ===
            "OUT_OF_STOCK"
        );
      },
    ).length;

  const handleStaffLogin = (
    staff: StaffMember,
  ) => {
    saveActiveStaff(
      staff,
    );

    setActiveStaff(
      staff,
    );

    setIsStaffLoginOpen(
      false,
    );

    setNotice(
      `${staff.name} signed in as ${staff.role}.`,
    );
  };

  const handleActiveStaffChange =
    (
      staff:
        StaffMember,
    ) => {
      saveActiveStaff(
        staff,
      );

      setActiveStaff(
        staff,
      );
    };

  const handleSwitchStaff =
    () => {
      if (
        cart.length > 0 &&
        !window.confirm(
          "Switching staff will clear the current order. Continue?",
        )
      ) {
        return;
      }

      clearActiveStaff();
      setActiveStaff(null);
      setCart([]);
      setTaxType("VAT");
      setNotice("");
      setIsPaymentOpen(
        false,
      );
      setIsOrderHistoryOpen(
        false,
      );
      setIsSalesReportOpen(
        false,
      );
      setIsMenuManagementOpen(
        false,
      );
      setIsInventoryManagementOpen(
        false,
      );
      setIsStaffManagementOpen(
        false,
      );
      setIsBusinessSettingsOpen(
        false,
      );
      setIsStaffLoginOpen(
        true,
      );
    };

  const addProduct = (
    product: Product,
  ) => {
    if (
      !isProductSellable(
        product,
      )
    ) {
      setNotice(
        `${product.name} is not available.`,
      );
      return;
    }

    const currentCartItem =
      cart.find(
        (item) =>
          item.id ===
          product.id,
      );

    const nextQuantity =
      (
        currentCartItem?.quantity ??
        0
      ) + 1;

    if (
      product.trackStock &&
      nextQuantity >
        product.stockQuantity
    ) {
      setNotice(
        `${product.name} only has ${product.stockQuantity} remaining.`,
      );
      return;
    }

    setNotice("");

    setCart(
      (
        currentCart,
      ) => {
        const existingItem =
          currentCart.find(
            (item) =>
              item.id ===
              product.id,
          );

        if (
          existingItem
        ) {
          return currentCart.map(
            (item) =>
              item.id ===
              product.id
                ? {
                    ...item,
                    quantity:
                      item.quantity +
                      1,
                  }
                : item,
          );
        }

        return [
          ...currentCart,
          {
            ...product,
            quantity: 1,
          },
        ];
      },
    );
  };

  const updateQuantity = (
    productId: number,
    change: number,
  ) => {
    const product =
      products.find(
        (item) =>
          item.id ===
          productId,
      );

    const cartItem =
      cart.find(
        (item) =>
          item.id ===
          productId,
      );

    if (
      !product ||
      !cartItem
    ) {
      return;
    }

    const nextQuantity =
      cartItem.quantity +
      change;

    if (
      change > 0 &&
      product.trackStock &&
      nextQuantity >
        product.stockQuantity
    ) {
      setNotice(
        `${product.name} only has ${product.stockQuantity} remaining.`,
      );
      return;
    }

    setNotice("");

    setCart(
      (
        currentCart,
      ) =>
        currentCart
          .map(
            (item) =>
              item.id ===
              productId
                ? {
                    ...item,
                    quantity:
                      item.quantity +
                      change,
                  }
                : item,
          )
          .filter(
            (item) =>
              item.quantity >
              0,
          ),
    );
  };

  const removeItem = (
    productId: number,
  ) => {
    setCart(
      (
        currentCart,
      ) =>
        currentCart.filter(
          (item) =>
            item.id !==
            productId,
        ),
    );

    setNotice("");
  };

  const clearOrder =
    () => {
      setCart([]);
      setTaxType("VAT");
      setNotice("");
    };

  const itemCount =
    cart.reduce(
      (
        total,
        item,
      ) =>
        total +
        item.quantity,
      0,
    );

  const subtotal =
    cart.reduce(
      (
        total,
        item,
      ) =>
        total +
        item.price *
          item.quantity,
      0,
    );

  const taxBreakdown =
    calculateTaxBreakdown(
      subtotal,
      taxType,
    );

  const formattedOrderNumber =
    `A${String(
      orderNumber,
    ).padStart(
      3,
      "0",
    )}`;

  const handleInventoryProductsChange = (
    updatedProducts:
      Product[],
  ) => {
    setProducts(
      updatedProducts,
    );

    saveMenu(
      updatedProducts,
    );

    setCart(
      (
        currentCart,
      ) =>
        currentCart.flatMap(
          (
            cartItem,
          ) => {
            const updatedProduct =
              updatedProducts.find(
                (product) =>
                  product.id ===
                  cartItem.id,
              );

            if (
              !updatedProduct ||
              !isProductSellable(
                updatedProduct,
              )
            ) {
              return [];
            }

            const allowedQuantity =
              updatedProduct.trackStock
                ? Math.min(
                    cartItem.quantity,
                    updatedProduct.stockQuantity,
                  )
                : cartItem.quantity;

            if (
              allowedQuantity <=
              0
            ) {
              return [];
            }

            return [
              {
                ...updatedProduct,
                quantity:
                  allowedQuantity,
              },
            ];
          },
        ),
    );

    setNotice(
      "Inventory updated successfully.",
    );
  };

  const handlePaymentComplete = async (
    payment:
      CompletedPayment,
  ) => {
    const stockError =
      validateStockForItems(
        products,
        cart,
      );

    if (
      stockError
    ) {
      setNotice(
        stockError,
      );

      setIsPaymentOpen(
        false,
      );

      return;
    }

    if (
      menuSource !==
        "CLOUD" ||
      !cloudLocationId
    ) {
      setNotice(
        "Cloud connection is required to complete a sale. Offline sale syncing has not been enabled yet.",
      );

      setIsPaymentOpen(
        false,
      );

      return;
    }

    const cloudItems =
      cart.map(
        (item) => {
          if (
            !item.cloudId
          ) {
            throw new Error(
              `${item.name} is missing its cloud product ID.`,
            );
          }

          return {
            productId:
              item.cloudId,
            quantity:
              item.quantity,
          };
        },
      );

    let cloudOrderNumber =
      formattedOrderNumber;

    let cloudOrderId = "";

    try {
      const cloudSale =
        await completeCloudSale(
        {
          locationId:
            cloudLocationId,
          orderNumber:
            formattedOrderNumber,
          orderType,
          taxType,
          vatRate:
            taxBreakdown.vatRate,
          netAmount:
            taxBreakdown.netAmount,
          vatAmount:
            taxBreakdown.vatAmount,
          subtotal,
          paymentMethod:
            payment.method,
          amountReceived:
            payment.amountReceived,
          change:
            payment.change,
          staffName:
            activeStaff?.name ??
            "Unknown",
          staffRole:
            activeStaff?.role ??
            "Unknown",
          items:
            cloudItems,
        },
      );

      cloudOrderNumber =
        cloudSale.orderNumber;

      cloudOrderId =
        cloudSale.orderId;
    } catch (error) {
      console.error(
        "Cloud sale failed:",
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : "Unknown cloud sale error.";

      setNotice(
        `Sale was not saved. ${message}`,
      );

      setIsPaymentOpen(
        false,
      );

      return;
    }

    const completedOrder:
      SavedOrder = {
        id:
          createOrderId(),
        cloudOrderId,
        orderNumber:
          cloudOrderNumber,
        orderType,
        items:
          cart.map(
            (item) => ({
              id: item.id,
              name:
                item.name,
              price:
                item.price,
              quantity:
                item.quantity,
            }),
          ),
        itemCount,
        subtotal,
        taxType,
        vatRate:
          taxBreakdown.vatRate,
        netAmount:
          taxBreakdown.netAmount,
        vatAmount:
          taxBreakdown.vatAmount,
        paymentMethod:
          payment.method,
        amountReceived:
          payment.amountReceived,
        change:
          payment.change,
        status:
          "Completed",
        createdAt:
          new Date().toISOString(),
      };

    const updatedOrders =
      addOrder(
        completedOrder,
      );

    const updatedProducts =
      deductStockForItems(
        products,
        cart,
      );

    const stockMovements =
      cart.flatMap(
        (
          cartItem,
        ) => {
          const previousProduct =
            products.find(
              (product) =>
                product.id ===
                cartItem.id,
            );

          const updatedProduct =
            updatedProducts.find(
              (product) =>
                product.id ===
                cartItem.id,
            );

          if (
            !previousProduct ||
            !updatedProduct ||
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
                  "SALE",
                quantityChange:
                  -cartItem.quantity,
                previousStock:
                  previousProduct.stockQuantity,
                newStock:
                  updatedProduct.stockQuantity,
                note:
                  `Sale ${cloudOrderNumber}`,
                orderId:
                  completedOrder.id,
                orderNumber:
                  completedOrder.orderNumber,
                ...(activeStaff
                  ? {
                      performedBy:
                        {
                          name:
                            activeStaff.name,
                          role:
                            activeStaff.role,
                        },
                    }
                  : {}),
              },
            ),
          ];
        },
      );

    addInventoryMovements(
      stockMovements,
    );

    saveMenu(
      updatedProducts,
    );

    setProducts(
      updatedProducts,
    );

    setSavedOrders(
      updatedOrders,
    );

    const paymentMessage =
      payment.method ===
      "Cash"
        ? `Cash payment completed. Change: ${currencyFormatter.format(
            payment.change,
          )}.`
        : "Card payment completed.";

    setNotice(
      `Order #${cloudOrderNumber} completed and saved to the cloud. Stock updated. ${paymentMessage}`,
    );

    setCart([]);
    setTaxType("VAT");

    const cloudOrderNumeric =
      Number.parseInt(
        cloudOrderNumber.replace(
          /\D/g,
          "",
        ),
        10,
      );

    setOrderNumber(
      (
        currentNumber,
      ) =>
        Number.isNaN(
          cloudOrderNumeric,
        )
          ? currentNumber + 1
          : cloudOrderNumeric + 1,
    );

    setIsPaymentOpen(
      false,
    );
  };

  const completeOrder =
    () => {
      if (
        cart.length === 0
      ) {
        return;
      }

      if (
        menuSource !==
          "CLOUD" ||
        !cloudLocationId
      ) {
        setNotice(
          "Cloud connection is required to complete a sale. You can still view the cached menu, but offline checkout is not enabled yet.",
        );

        return;
      }

      const stockError =
        validateStockForItems(
          products,
          cart,
        );

      if (
        stockError
      ) {
        setNotice(
          stockError,
        );
        return;
      }

      setNotice("");
      setIsPaymentOpen(
        true,
      );
    };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="flex flex-wrap items-center justify-between gap-4 bg-slate-950 px-6 py-4 text-white shadow-lg">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">
            {businessSettings
              ? `${businessSettings.businessName} POS`
              : "POS Platform"}
          </p>

          <h1 className="text-2xl font-black">
            {businessSettings
              ? getTerminalLabel(
                  businessSettings.posTemplate,
                )
              : "Cashier Terminal"}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {canManageMenu && (
            <button
              type="button"
              onClick={() =>
                setIsMenuManagementOpen(
                  true,
                )
              }
              className="relative rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
            >
              Manage Menu

              {lowStockCount >
                0 && (
                <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-black text-white">
                  {
                    lowStockCount
                  }
                </span>
              )}
            </button>
          )}

          {canManageMenu && (
            <button
              type="button"
              onClick={() =>
                setIsInventoryManagementOpen(
                  true,
                )
              }
              className="relative rounded-xl bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/20"
            >
              Inventory

              {lowStockCount >
                0 && (
                <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-black text-white">
                  {
                    lowStockCount
                  }
                </span>
              )}
            </button>
          )}

          {canManageStaff && (
            <button
              type="button"
              onClick={() =>
                setIsStaffManagementOpen(
                  true,
                )
              }
              className="rounded-xl bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/20"
            >
              Staff
            </button>
          )}

          {canManageBusinessSettings && (
            <button
              type="button"
              onClick={() =>
                setIsBusinessSettingsOpen(
                  true,
                )
              }
              className="rounded-xl bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/20"
            >
              Business
            </button>
          )}

          {canViewSalesReport && (
            <button
              type="button"
              onClick={() =>
                setIsSalesReportOpen(
                  true,
                )
              }
              className="rounded-xl bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/20"
            >
              Sales Report
            </button>
          )}

          {canViewOrderHistory && (
            <button
              type="button"
              onClick={() =>
                setIsOrderHistoryOpen(
                  true,
                )
              }
              className="rounded-xl bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/20"
            >
              Order History
            </button>
          )}

          <button
            type="button"
            onClick={
              handleSwitchStaff
            }
            className="rounded-xl bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/20"
          >
            Switch Staff
          </button>

          <div className="text-right">
            <p className="text-sm font-semibold">
              {businessSettings?.locationName ??
                "Main Branch"}
            </p>

            <p className="text-xs text-slate-400">
              {activeStaff
                ? `${activeStaff.role}: ${activeStaff.name}`
                : "No staff signed in"}
            </p>

            {businessSettings && (
              <p className="mt-1 text-[11px] font-bold text-orange-300">
                {getPosTemplateLabel(
                  businessSettings.posTemplate,
                )}{" "}
                template
              </p>
            )}

            <p
              className={`mt-1 text-[11px] font-bold ${
                isMenuLoading
                  ? "text-slate-400"
                  : menuSource ===
                      "CLOUD"
                    ? "text-emerald-400"
                    : "text-amber-400"
              }`}
            >
              {isMenuLoading
                ? "Loading menu..."
                : menuSource ===
                    "CLOUD"
                  ? "● Cloud menu"
                  : "● Local fallback"}
            </p>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-500 font-black">
            {activeStaff?.name
              .slice(0, 1)
              .toUpperCase() ??
              "?"}
          </div>
        </div>
      </header>

      <div
        className={`grid min-h-[calc(100vh-76px)] grid-cols-1 ${
          isDeliTemplate
            ? "xl:grid-cols-[minmax(0,1fr)_420px]"
            : "xl:grid-cols-[150px_minmax(0,1fr)_390px]"
        }`}
      >
        {!isDeliTemplate && (
        <aside className="border-r border-slate-200 bg-white p-3">
          <p className="mb-3 px-3 pt-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            Categories
          </p>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-1">
            {categories.map(
              (
                category,
              ) => {
                const isSelected =
                  category ===
                  selectedCategory;

                return (
                  <button
                    key={
                      category
                    }
                    type="button"
                    onClick={() =>
                      setSelectedCategory(
                        category,
                      )
                    }
                    className={`rounded-xl px-4 py-4 text-left text-sm font-bold transition ${
                      isSelected
                        ? "bg-orange-500 text-white shadow-md"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {
                      category
                    }
                  </button>
                );
              },
            )}
          </div>
        </aside>
        )}

        <section className="min-w-0 p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">
                {isDeliTemplate
                  ? "Build the customer order from the deli counter"
                  : "Select products to add them to the order"}
              </p>

              <h2 className="text-2xl font-black">
                {isDeliTemplate
                  ? "Deli Counter"
                  : selectedCategory}
              </h2>
            </div>

            <div className="flex rounded-xl bg-white p-1 shadow-sm">
              {(
                [
                  "Takeaway",
                  "Eat In",
                  "Delivery",
                ] as OrderType[]
              ).map(
                (
                  type,
                ) => (
                  <button
                    key={
                      type
                    }
                    type="button"
                    onClick={() =>
                      setOrderType(
                        type,
                      )
                    }
                    className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                      orderType ===
                      type
                        ? "bg-slate-950 text-white"
                        : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {type}
                  </button>
                ),
              )}
            </div>
          </div>

          {isDeliTemplate && (
            <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-950">
                    Deli categories
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Choose a counter
                    section or search
                    the menu.
                  </p>
                </div>

                <input
                  type="search"
                  value={
                    productSearch
                  }
                  onChange={(
                    event,
                  ) =>
                    setProductSearch(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Search sandwiches, paninis, drinks..."
                  className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-orange-500 sm:w-80"
                />
              </div>

              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {categories.map(
                  (category) => {
                    const selected =
                      category ===
                      selectedCategory;

                    return (
                      <button
                        key={
                          category
                        }
                        type="button"
                        onClick={() =>
                          setSelectedCategory(
                            category,
                          )
                        }
                        className={`shrink-0 rounded-xl px-4 py-3 text-sm font-black transition ${
                          selected
                            ? "bg-orange-500 text-white shadow-sm"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {
                          category
                        }
                      </button>
                    );
                  },
                )}
              </div>
            </div>
          )}

          <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <p className="text-sm font-black text-slate-950">
                Sale type
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Select whether
                this order includes
                VAT.
              </p>
            </div>

            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() =>
                  setTaxType(
                    "VAT",
                  )
                }
                className={`rounded-lg px-5 py-3 text-sm font-bold transition ${
                  taxType ===
                  "VAT"
                    ? "bg-orange-500 text-white shadow-sm"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                VAT Sale
              </button>

              <button
                type="button"
                onClick={() =>
                  setTaxType(
                    "NON_VAT",
                  )
                }
                className={`rounded-lg px-5 py-3 text-sm font-bold transition ${
                  taxType ===
                  "NON_VAT"
                    ? "bg-slate-950 text-white shadow-sm"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                Non-VAT Sale
              </button>
            </div>
          </div>

          <div
            className={`grid gap-4 ${
              isDeliTemplate
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-2 md:grid-cols-3 2xl:grid-cols-4"
            }`}
          >
            {filteredProducts.map(
              (
                product,
              ) => {
                const stockStatus =
                  getProductStockStatus(
                    product,
                  );

                const sellable =
                  isProductSellable(
                    product,
                  );

                return (
                  <button
                    key={
                      product.id
                    }
                    type="button"
                    disabled={
                      !sellable
                    }
                    onClick={() =>
                      addProduct(
                        product,
                      )
                    }
                    className={`relative rounded-2xl border p-5 text-left shadow-sm transition ${
                      isDeliTemplate
                        ? "min-h-40"
                        : "min-h-48"
                    } ${
                      sellable
                        ? "border-slate-200 bg-white hover:-translate-y-1 hover:border-orange-400 hover:shadow-lg"
                        : "cursor-not-allowed border-slate-200 bg-slate-200 opacity-60"
                    }`}
                  >
                    {!product.available && (
                      <span className="absolute right-3 top-3 rounded-full bg-slate-700 px-2 py-1 text-xs font-bold text-white">
                        Disabled
                      </span>
                    )}

                    {product.available &&
                      stockStatus ===
                        "OUT_OF_STOCK" && (
                        <span className="absolute right-3 top-3 rounded-full bg-red-600 px-2 py-1 text-xs font-bold text-white">
                          Out of stock
                        </span>
                      )}

                    {product.available &&
                      stockStatus ===
                        "LOW_STOCK" && (
                        <span className="absolute right-3 top-3 rounded-full bg-amber-500 px-2 py-1 text-xs font-bold text-white">
                          Low:{" "}
                          {
                            product.stockQuantity
                          }
                        </span>
                      )}

                    <span
                      className={`block ${
                        isDeliTemplate
                          ? "text-4xl"
                          : "text-5xl"
                      }`}
                    >
                      {
                        product.emoji
                      }
                    </span>

                    <h3 className="mt-4 font-black leading-tight">
                      {
                        product.name
                      }
                    </h3>

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {
                        product.description
                      }
                    </p>

                    <div className="mt-3 flex items-end justify-between gap-3">
                      <p className="text-lg font-black text-orange-600">
                        {currencyFormatter.format(
                          product.price,
                        )}
                      </p>

                      <p className="text-xs font-bold text-slate-500">
                        {product.trackStock
                          ? `${product.stockQuantity} left`
                          : "Not tracked"}
                      </p>
                    </div>
                  </button>
                );
              },
            )}

            {filteredProducts.length ===
              0 && (
              <div className="col-span-full rounded-2xl border-2 border-dashed border-slate-300 bg-white p-10 text-center">
                <p className="text-4xl">
                  {isDeliTemplate
                    ? "🥪"
                    : "📦"}
                </p>

                <h3 className="mt-3 font-black text-slate-900">
                  No products here yet
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  {isDeliTemplate
                    ? "Use Manage Menu to add the deli's first sandwiches, paninis, drinks or other products."
                    : "No products match this category."}
                </p>
              </div>
            )}
          </div>
        </section>

        <aside className="flex min-h-[600px] flex-col border-l border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Current order
                </p>

                <h2 className="text-2xl font-black">
                  Order #
                  {
                    formattedOrderNumber
                  }
                </h2>

                <p className="mt-1 text-sm font-semibold text-orange-600">
                  {
                    orderType
                  }
                </p>

                <p className="mt-1 text-xs font-bold text-slate-500">
                  {taxType ===
                  "VAT"
                    ? "VAT Sale"
                    : "Non-VAT Sale"}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  clearOrder
                }
                disabled={
                  cart.length ===
                  0
                }
                className="rounded-lg px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {cart.length ===
            0 ? (
              <div className="flex h-full min-h-72 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
                <span className="text-5xl">
                  🧾
                </span>

                <h3 className="mt-4 font-black">
                  No products
                  added
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Select a
                  product to start
                  this order.
                </p>
              </div>
            ) : (
              cart.map(
                (
                  item,
                ) => {
                  const currentProduct =
                    products.find(
                      (product) =>
                        product.id ===
                        item.id,
                    );

                  const reachedLimit =
                    Boolean(
                      currentProduct?.trackStock &&
                      item.quantity >=
                        currentProduct.stockQuantity,
                    );

                  return (
                    <article
                      key={
                        item.id
                      }
                      className="rounded-xl border border-slate-200 p-3"
                    >
                      <div className="flex gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-2xl">
                          {
                            item.emoji
                          }
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold leading-tight">
                            {
                              item.name
                            }
                          </h3>

                          <p className="mt-1 text-sm font-black text-orange-600">
                            {currencyFormatter.format(
                              item.price *
                                item.quantity,
                            )}
                          </p>

                          {currentProduct?.trackStock && (
                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              {
                                currentProduct.stockQuantity
                              }{" "}
                              in stock
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeItem(
                              item.id,
                            )
                          }
                          className="h-8 w-8 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Remove ${item.name}`}
                        >
                          ×
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              -1,
                            )
                          }
                          className="h-9 w-9 rounded-lg bg-slate-100 text-lg font-black hover:bg-slate-200"
                        >
                          −
                        </button>

                        <span className="w-8 text-center font-black">
                          {
                            item.quantity
                          }
                        </span>

                        <button
                          type="button"
                          disabled={
                            reachedLimit
                          }
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              1,
                            )
                          }
                          className="h-9 w-9 rounded-lg bg-slate-950 text-lg font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          +
                        </button>
                      </div>
                    </article>
                  );
                },
              )
            )}
          </div>

          <div className="border-t border-slate-200 bg-slate-50 p-5">
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-semibold text-slate-600">
                <span>
                  Items
                </span>

                <span>
                  {
                    itemCount
                  }
                </span>
              </div>

              {taxType ===
              "VAT" ? (
                <>
                  <div className="flex justify-between text-sm font-semibold text-slate-600">
                    <span>
                      Net amount
                    </span>

                    <span>
                      {currencyFormatter.format(
                        taxBreakdown.netAmount,
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm font-semibold text-slate-600">
                    <span>
                      VAT at 20%
                    </span>

                    <span>
                      {currencyFormatter.format(
                        taxBreakdown.vatAmount,
                      )}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-sm font-semibold text-slate-600">
                  <span>
                    VAT
                  </span>

                  <span>
                    Not charged
                  </span>
                </div>
              )}

              <div className="flex justify-between text-2xl font-black">
                <span>
                  Total
                </span>

                <span>
                  {currencyFormatter.format(
                    subtotal,
                  )}
                </span>
              </div>
            </div>

            {notice && (
              <p className="mt-4 rounded-lg bg-green-100 p-3 text-sm font-semibold text-green-800">
                {
                  notice
                }
              </p>
            )}

            <button
              type="button"
              disabled={
                cart.length ===
                0
              }
              onClick={
                completeOrder
              }
              className="mt-5 w-full rounded-xl bg-orange-500 px-5 py-4 text-lg font-black text-white shadow-lg transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              Pay{" "}
              {currencyFormatter.format(
                subtotal,
              )}
            </button>
          </div>
        </aside>
      </div>

      <StaffLoginModal
        isOpen={
          isStaffLoginOpen
        }
        onLogin={
          handleStaffLogin
        }
      />

      <BusinessSettingsModal
        isOpen={
          isBusinessSettingsOpen
        }
        settings={
          businessSettings
        }
        activeStaff={
          activeStaff
        }
        onSettingsChange={
          setBusinessSettings
        }
        onClose={() =>
          setIsBusinessSettingsOpen(
            false,
          )
        }
      />

      <StaffManagementModal
        isOpen={
          isStaffManagementOpen
        }
        activeStaff={
          activeStaff
        }
        onActiveStaffChange={
          handleActiveStaffChange
        }
        onClose={() =>
          setIsStaffManagementOpen(
            false,
          )
        }
      />

      <InventoryManagementModal
        isOpen={
          isInventoryManagementOpen
        }
        products={
          products
        }
        activeStaff={
          activeStaff
        }
        onProductsChange={
          handleInventoryProductsChange
        }
        onClose={() =>
          setIsInventoryManagementOpen(
            false,
          )
        }
      />

      <MenuManagementModal
        isOpen={
          isMenuManagementOpen
        }
        products={
          products
        }
        categories={
          menuCategoryNames
        }
        activeStaff={
          activeStaff
        }
        onProductsChange={
          handleInventoryProductsChange
        }
        onClose={() =>
          setIsMenuManagementOpen(
            false,
          )
        }
      />

      <OrderHistoryModal
        isOpen={
          isOrderHistoryOpen
        }
        orders={
          savedOrders
        }
        products={
          products
        }
        activeStaff={
          activeStaff
        }
        onOrdersChange={
          setSavedOrders
        }
        onProductsChange={
          handleInventoryProductsChange
        }
        onClose={() =>
          setIsOrderHistoryOpen(
            false,
          )
        }
      />

      <SalesReportModal
        isOpen={
          isSalesReportOpen
        }
        orders={
          savedOrders
        }
        onClose={() =>
          setIsSalesReportOpen(
            false,
          )
        }
      />

      <PaymentModal
        isOpen={
          isPaymentOpen
        }
        orderNumber={
          formattedOrderNumber
        }
        total={
          subtotal
        }
        taxType={
          taxType
        }
        netAmount={
          taxBreakdown.netAmount
        }
        vatAmount={
          taxBreakdown.vatAmount
        }
        vatRate={
          taxBreakdown.vatRate
        }
        onClose={() =>
          setIsPaymentOpen(
            false,
          )
        }
        onPaymentComplete={
          handlePaymentComplete
        }
      />
    </main>
  );
}
