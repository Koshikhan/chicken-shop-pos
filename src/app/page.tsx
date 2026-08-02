"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

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
  DEFAULT_PRODUCTS,
  loadMenu,
  menuCategories,
  saveMenu,
  type Category,
  type Product,
} from "@/lib/menuStorage";

import {
  addOrder,
  createOrderId,
  loadOrders,
  type SavedOrder,
} from "@/lib/orderStorage";

import {
  clearActiveStaff,
  DEMO_STAFF,
  loadActiveStaff,
  saveActiveStaff,
  type StaffMember,
} from "@/lib/staffStorage";

import {
  calculateTaxBreakdown,
  type TaxType,
} from "@/lib/tax";

const categories = [
  "All",
  ...menuCategories,
] as const;

type SelectedCategory =
  | "All"
  | Category;

type OrderType =
  | "Takeaway"
  | "Eat In"
  | "Delivery";

type CartItem = Product & {
  quantity: number;
};

const currencyFormatter =
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  });

export default function Home() {
  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState<SelectedCategory>("All");

  const [orderType, setOrderType] =
    useState<OrderType>("Takeaway");

  const [taxType, setTaxType] =
    useState<TaxType>("VAT");

  const [products, setProducts] =
    useState<Product[]>(
      DEFAULT_PRODUCTS,
    );

  const [cart, setCart] =
    useState<CartItem[]>([]);

  const [notice, setNotice] =
    useState("");

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
  ] = useState<SavedOrder[]>([]);

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
    activeStaff,
    setActiveStaff,
  ] = useState<StaffMember | null>(null);

  const [
    isStaffLoginOpen,
    setIsStaffLoginOpen,
  ] = useState(true);

  useEffect(() => {
    const storedStaff =
      loadActiveStaff();

    setActiveStaff(storedStaff);
    setIsStaffLoginOpen(!storedStaff);

    setProducts(loadMenu());

    const existingOrders =
      loadOrders();

    setSavedOrders(
      existingOrders,
    );

    const highestOrderNumber =
      existingOrders.reduce(
        (highest, order) => {
          const number =
            Number.parseInt(
              order.orderNumber.replace(
                /\D/g,
                "",
              ),
              10,
            );

          if (
            Number.isNaN(number)
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
  }, []);

  const canViewOrderHistory =
    activeStaff?.role === "Supervisor" ||
    activeStaff?.role === "Manager";

  const canManageMenu =
    activeStaff?.role === "Manager";

  const canViewSalesReport =
    activeStaff?.role === "Manager";

  const handleStaffLogin = (
    staff: StaffMember,
  ) => {
    saveActiveStaff(staff);
    setActiveStaff(staff);
    setIsStaffLoginOpen(false);
    setNotice(
      `${staff.name} signed in as ${staff.role}.`,
    );
  };

  const handleSwitchStaff = () => {
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
    setIsPaymentOpen(false);
    setIsOrderHistoryOpen(false);
    setIsSalesReportOpen(false);
    setIsMenuManagementOpen(false);
    setIsStaffLoginOpen(true);
  };

  const filteredProducts =
    useMemo(() => {
      if (selectedCategory === "All") {
        return products;
      }

      return products.filter(
        (product) =>
          product.category ===
          selectedCategory,
      );
    }, [products, selectedCategory]);

  const addProduct = (
    product: Product,
  ) => {
    if (!product.available) {
      return;
    }

    setNotice("");

    setCart((currentCart) => {
      const existingItem =
        currentCart.find(
          (item) =>
            item.id === product.id,
        );

      if (existingItem) {
        return currentCart.map(
          (item) =>
            item.id === product.id
              ? {
                  ...item,
                  quantity:
                    item.quantity + 1,
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
    });
  };

  const updateQuantity = (
    productId: number,
    change: number,
  ) => {
    setNotice("");

    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === productId
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
            item.quantity > 0,
        ),
    );
  };

  const removeItem = (
    productId: number,
  ) => {
    setCart((currentCart) =>
      currentCart.filter(
        (item) =>
          item.id !== productId,
      ),
    );

    setNotice("");
  };

  const clearOrder = () => {
    setCart([]);
    setTaxType("VAT");
    setNotice("");
  };

  const itemCount = cart.reduce(
    (total, item) =>
      total + item.quantity,
    0,
  );

  const subtotal = cart.reduce(
    (total, item) =>
      total +
      item.price * item.quantity,
    0,
  );

  const taxBreakdown =
    calculateTaxBreakdown(
      subtotal,
      taxType,
    );

  const formattedOrderNumber =
    `A${String(orderNumber).padStart(
      3,
      "0",
    )}`;

  const handleMenuSave = (
    updatedProducts: Product[],
  ) => {
    setProducts(updatedProducts);
    saveMenu(updatedProducts);

    setCart((currentCart) =>
      currentCart.flatMap(
        (cartItem) => {
          const updatedProduct =
            updatedProducts.find(
              (product) =>
                product.id ===
                cartItem.id,
            );

          if (
            !updatedProduct ||
            !updatedProduct.available
          ) {
            return [];
          }

          return [
            {
              ...updatedProduct,
              quantity:
                cartItem.quantity,
            },
          ];
        },
      ),
    );

    setNotice(
      "Menu changes saved successfully.",
    );

    setIsMenuManagementOpen(false);
  };

  const handlePaymentComplete = (
    payment: CompletedPayment,
  ) => {
    const completedOrder: SavedOrder =
      {
        id: createOrderId(),
        orderNumber:
          formattedOrderNumber,
        orderType,
        items: cart.map(
          (item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
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
        change: payment.change,
        status: "Completed",
        createdAt:
          new Date().toISOString(),
      };

    const updatedOrders =
      addOrder(
        completedOrder,
      );

    setSavedOrders(
      updatedOrders,
    );

    const paymentMessage =
      payment.method === "Cash"
        ? `Cash payment completed. Change: ${currencyFormatter.format(
            payment.change,
          )}.`
        : "Card payment completed.";

    setNotice(
      `Order #${formattedOrderNumber} completed. ${paymentMessage}`,
    );

    setCart([]);
    setTaxType("VAT");

    setOrderNumber(
      (currentNumber) =>
        currentNumber + 1,
    );

    setIsPaymentOpen(false);
  };

  const completeOrder = () => {
    if (cart.length === 0) {
      return;
    }

    setNotice("");
    setIsPaymentOpen(true);
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="flex flex-wrap items-center justify-between gap-4 bg-slate-950 px-6 py-4 text-white shadow-lg">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">
            Chicken Shop POS
          </p>

          <h1 className="text-2xl font-black">
            Cashier Terminal
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
              className="rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
            >
              Manage Menu
            </button>
          )}

          {canViewSalesReport && (
            <button
              type="button"
              onClick={() =>
                setIsSalesReportOpen(true)
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
                setIsOrderHistoryOpen(true)
              }
              className="rounded-xl bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/20"
            >
              Order History
            </button>
          )}

          <button
            type="button"
            onClick={handleSwitchStaff}
            className="rounded-xl bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/20"
          >
            Switch Staff
          </button>

          <div className="text-right">
            <p className="text-sm font-semibold">
              Main Branch
            </p>

            <p className="text-xs text-slate-400">
              {activeStaff
                ? `${activeStaff.role}: ${activeStaff.name}`
                : "No staff signed in"}
            </p>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-500 font-black">
            {activeStaff?.name
              .slice(0, 1)
              .toUpperCase() ?? "?"}
          </div>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-76px)] grid-cols-1 xl:grid-cols-[150px_minmax(0,1fr)_390px]">
        <aside className="border-r border-slate-200 bg-white p-3">
          <p className="mb-3 px-3 pt-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            Categories
          </p>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-1">
            {categories.map(
              (category) => {
                const isSelected =
                  category ===
                  selectedCategory;

                return (
                  <button
                    key={category}
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
                    {category}
                  </button>
                );
              },
            )}
          </div>
        </aside>

        <section className="min-w-0 p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Select products to add
                them to the order
              </p>

              <h2 className="text-2xl font-black">
                {selectedCategory}
              </h2>
            </div>

            <div className="flex rounded-xl bg-white p-1 shadow-sm">
              {(
                [
                  "Takeaway",
                  "Eat In",
                  "Delivery",
                ] as OrderType[]
              ).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    setOrderType(type)
                  }
                  className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                    orderType === type
                      ? "bg-slate-950 text-white"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <p className="text-sm font-black text-slate-950">
                Sale type
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Select whether this order
                includes VAT.
              </p>
            </div>

            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() =>
                  setTaxType("VAT")
                }
                className={`rounded-lg px-5 py-3 text-sm font-bold transition ${
                  taxType === "VAT"
                    ? "bg-orange-500 text-white shadow-sm"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                VAT Sale
              </button>

              <button
                type="button"
                onClick={() =>
                  setTaxType("NON_VAT")
                }
                className={`rounded-lg px-5 py-3 text-sm font-bold transition ${
                  taxType === "NON_VAT"
                    ? "bg-slate-950 text-white shadow-sm"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                Non-VAT Sale
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 2xl:grid-cols-4">
            {filteredProducts.map(
              (product) => (
                <button
                  key={product.id}
                  type="button"
                  disabled={
                    !product.available
                  }
                  onClick={() =>
                    addProduct(product)
                  }
                  className={`relative min-h-48 rounded-2xl border p-5 text-left shadow-sm transition ${
                    product.available
                      ? "border-slate-200 bg-white hover:-translate-y-1 hover:border-orange-400 hover:shadow-lg"
                      : "cursor-not-allowed border-slate-200 bg-slate-200 opacity-60"
                  }`}
                >
                  {!product.available && (
                    <span className="absolute right-3 top-3 rounded-full bg-red-600 px-2 py-1 text-xs font-bold text-white">
                      Out of stock
                    </span>
                  )}

                  <span className="block text-5xl">
                    {product.emoji}
                  </span>

                  <h3 className="mt-4 font-black leading-tight">
                    {product.name}
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {product.description}
                  </p>

                  <p className="mt-3 text-lg font-black text-orange-600">
                    {currencyFormatter.format(
                      product.price,
                    )}
                  </p>
                </button>
              ),
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
                  Order #{formattedOrderNumber}
                </h2>

                <p className="mt-1 text-sm font-semibold text-orange-600">
                  {orderType}
                </p>

                <p className="mt-1 text-xs font-bold text-slate-500">
                  {taxType === "VAT"
                    ? "VAT Sale"
                    : "Non-VAT Sale"}
                </p>
              </div>

              <button
                type="button"
                onClick={clearOrder}
                disabled={
                  cart.length === 0
                }
                className="rounded-lg px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="flex h-full min-h-72 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
                <span className="text-5xl">
                  🧾
                </span>

                <h3 className="mt-4 font-black">
                  No products added
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Select a product to
                  start this order.
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-slate-200 p-3"
                >
                  <div className="flex gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-2xl">
                      {item.emoji}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold leading-tight">
                        {item.name}
                      </h3>

                      <p className="mt-1 text-sm font-black text-orange-600">
                        {currencyFormatter.format(
                          item.price *
                            item.quantity,
                        )}
                      </p>
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
                      {item.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(
                          item.id,
                          1,
                        )
                      }
                      className="h-9 w-9 rounded-lg bg-slate-950 text-lg font-black text-white hover:bg-slate-800"
                    >
                      +
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="border-t border-slate-200 bg-slate-50 p-5">
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-semibold text-slate-600">
                <span>Items</span>
                <span>{itemCount}</span>
              </div>

              {taxType === "VAT" ? (
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
                <span>Total</span>

                <span>
                  {currencyFormatter.format(
                    subtotal,
                  )}
                </span>
              </div>
            </div>

            {notice && (
              <p className="mt-4 rounded-lg bg-green-100 p-3 text-sm font-semibold text-green-800">
                {notice}
              </p>
            )}

            <button
              type="button"
              disabled={
                cart.length === 0
              }
              onClick={completeOrder}
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
        isOpen={isStaffLoginOpen}
        staffMembers={DEMO_STAFF}
        onLogin={handleStaffLogin}
      />

      <MenuManagementModal
        isOpen={isMenuManagementOpen}
        products={products}
        onClose={() =>
          setIsMenuManagementOpen(false)
        }
        onSave={handleMenuSave}
      />

<OrderHistoryModal
  isOpen={isOrderHistoryOpen}
  orders={savedOrders}
  activeStaff={activeStaff}
  onOrdersChange={
    setSavedOrders
  }
  onClose={() =>
    setIsOrderHistoryOpen(false)
  }
/>

      <SalesReportModal
        isOpen={isSalesReportOpen}
        orders={savedOrders}
        onClose={() =>
          setIsSalesReportOpen(false)
        }
      />

<PaymentModal
        isOpen={isPaymentOpen}
        orderNumber={
          formattedOrderNumber
        }
        total={subtotal}
        taxType={taxType}
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
          setIsPaymentOpen(false)
        }
        onPaymentComplete={
          handlePaymentComplete
        }
      />
    </main>
  );
}