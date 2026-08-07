"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  addInventoryMovements,
  createInventoryMovement,
  loadInventoryMovements,
  type InventoryMovement,
  type InventoryMovementType,
} from "@/lib/inventoryStorage";

import {
  getProductStockStatus,
  type Product,
  type ProductStockStatus,
} from "@/lib/menuStorage";

import type {
  StaffMember,
} from "@/lib/staffStorage";

type InventoryManagementModalProps = {
  isOpen: boolean;
  products: Product[];
  activeStaff: StaffMember | null;
  onClose: () => void;
  onProductsChange: (
    products: Product[],
  ) => void;
};

type InventoryFilter =
  | "ALL"
  | ProductStockStatus;

type AdjustmentType =
  | "RESTOCK"
  | "WASTE"
  | "CORRECTION";

const dateTimeFormatter =
  new Intl.DateTimeFormat(
    "en-GB",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );

function getStatusLabel(
  product: Product,
) {
  const status =
    getProductStockStatus(
      product,
    );

  switch (status) {
    case "OUT_OF_STOCK":
      return {
        label: "Out of stock",
        classes:
          "bg-red-100 text-red-700",
      };

    case "LOW_STOCK":
      return {
        label: "Low stock",
        classes:
          "bg-amber-100 text-amber-800",
      };

    case "UNTRACKED":
      return {
        label: "Not tracked",
        classes:
          "bg-slate-200 text-slate-700",
      };

    default:
      return {
        label: "In stock",
        classes:
          "bg-green-100 text-green-700",
      };
  }
}

function getMovementLabel(
  type: InventoryMovementType,
) {
  switch (type) {
    case "SALE":
      return "Sale";

    case "RESTOCK":
      return "Restock";

    case "WASTE":
      return "Waste";

    case "CORRECTION":
      return "Correction";

    case "VOID_RESTORE":
      return "Void restore";

    case "REFUND_RESTORE":
      return "Refund restore";
  }
}

function getMovementClasses(
  quantityChange: number,
) {
  if (quantityChange > 0) {
    return "bg-green-100 text-green-700";
  }

  if (quantityChange < 0) {
    return "bg-red-100 text-red-700";
  }

  return "bg-slate-100 text-slate-700";
}

export function InventoryManagementModal({
  isOpen,
  products,
  activeStaff,
  onClose,
  onProductsChange,
}: InventoryManagementModalProps) {
  const [
    search,
    setSearch,
  ] = useState("");

  const [
    filter,
    setFilter,
  ] =
    useState<InventoryFilter>(
      "ALL",
    );

  const [
    selectedProductId,
    setSelectedProductId,
  ] =
    useState<number | null>(
      null,
    );

  const [
    adjustmentType,
    setAdjustmentType,
  ] =
    useState<AdjustmentType>(
      "RESTOCK",
    );

  const [
    quantityValue,
    setQuantityValue,
  ] = useState("");

  const [
    note,
    setNote,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    movements,
    setMovements,
  ] =
    useState<
      InventoryMovement[]
    >([]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSearch("");
    setFilter("ALL");
    setSelectedProductId(
      null,
    );
    setAdjustmentType(
      "RESTOCK",
    );
    setQuantityValue("");
    setNote("");
    setError("");
    setSuccess("");
    setMovements(
      loadInventoryMovements(),
    );
  }, [isOpen]);

  const filteredProducts =
    useMemo(() => {
      const searchValue =
        search
          .trim()
          .toLowerCase();

      return products.filter(
        (product) => {
          const matchesSearch =
            !searchValue ||
            product.name
              .toLowerCase()
              .includes(
                searchValue,
              ) ||
            product.category
              .toLowerCase()
              .includes(
                searchValue,
              );

          const status =
            getProductStockStatus(
              product,
            );

          const matchesFilter =
            filter === "ALL" ||
            status === filter;

          return (
            matchesSearch &&
            matchesFilter
          );
        },
      );
    }, [
      products,
      search,
      filter,
    ]);

  const selectedProduct =
    useMemo(
      () =>
        products.find(
          (product) =>
            product.id ===
            selectedProductId,
        ) ?? null,
      [
        products,
        selectedProductId,
      ],
    );

  const summary =
    useMemo(() => {
      const tracked =
        products.filter(
          (product) =>
            product.trackStock,
        );

      return {
        tracked:
          tracked.length,
        inStock:
          tracked.filter(
            (product) =>
              getProductStockStatus(
                product,
              ) === "IN_STOCK",
          ).length,
        lowStock:
          tracked.filter(
            (product) =>
              getProductStockStatus(
                product,
              ) === "LOW_STOCK",
          ).length,
        outOfStock:
          tracked.filter(
            (product) =>
              getProductStockStatus(
                product,
              ) ===
              "OUT_OF_STOCK",
          ).length,
        units:
          tracked.reduce(
            (
              total,
              product,
            ) =>
              total +
              product.stockQuantity,
            0,
          ),
      };
    }, [products]);

  if (!isOpen) {
    return null;
  }

  const selectProduct = (
    product: Product,
  ) => {
    setSelectedProductId(
      product.id,
    );
    setQuantityValue("");
    setNote("");
    setError("");
    setSuccess("");
  };

  const applyAdjustment =
    () => {
      if (
        !selectedProduct
      ) {
        setError(
          "Select a product first.",
        );
        return;
      }

      if (
        !selectedProduct.trackStock
      ) {
        setError(
          "Stock tracking is disabled for this product. Enable it in Menu & Inventory first.",
        );
        return;
      }

      const quantity =
        Number.parseInt(
          quantityValue,
          10,
        );

      if (
        !Number.isInteger(
          quantity,
        ) ||
        quantity < 0
      ) {
        setError(
          "Enter a whole number of 0 or more.",
        );
        return;
      }

      if (
        adjustmentType !==
          "CORRECTION" &&
        quantity === 0
      ) {
        setError(
          "Enter a quantity greater than 0.",
        );
        return;
      }

      if (
        (
          adjustmentType ===
            "WASTE" ||
          adjustmentType ===
            "CORRECTION"
        ) &&
        !note.trim()
      ) {
        setError(
          "Enter a reason for this adjustment.",
        );
        return;
      }

      const previousStock =
        selectedProduct.stockQuantity;

      let newStock =
        previousStock;

      if (
        adjustmentType ===
        "RESTOCK"
      ) {
        newStock =
          previousStock +
          quantity;
      }

      if (
        adjustmentType ===
        "WASTE"
      ) {
        if (
          quantity >
          previousStock
        ) {
          setError(
            `Only ${previousStock} units are currently available.`,
          );
          return;
        }

        newStock =
          previousStock -
          quantity;
      }

      if (
        adjustmentType ===
        "CORRECTION"
      ) {
        newStock =
          quantity;
      }

      const quantityChange =
        newStock -
        previousStock;

      if (
        quantityChange === 0
      ) {
        setError(
          "This adjustment does not change the stock quantity.",
        );
        return;
      }

      const updatedProducts =
        products.map(
          (product) =>
            product.id ===
            selectedProduct.id
              ? {
                  ...product,
                  stockQuantity:
                    newStock,
                }
              : product,
        );

      const movement =
        createInventoryMovement(
          {
            productId:
              selectedProduct.id,
            productName:
              selectedProduct.name,
            type:
              adjustmentType,
            quantityChange,
            previousStock,
            newStock,
            note:
              note.trim() ||
              (
                adjustmentType ===
                "RESTOCK"
                  ? "Stock delivery"
                  : undefined
              ),
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
        );

      const updatedMovements =
        addInventoryMovements(
          [movement],
        );

      onProductsChange(
        updatedProducts,
      );

      setMovements(
        updatedMovements,
      );

      setQuantityValue("");
      setNote("");
      setError("");
      setSuccess(
        `${selectedProduct.name} stock changed from ${previousStock} to ${newStock}.`,
      );
    };

  return (
    <div
      className="fixed inset-0 z-[65] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Inventory management"
    >
      <section className="flex max-h-[95vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl bg-slate-100 shadow-2xl">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 bg-white p-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-orange-500">
              Manager
            </p>

            <h2 className="mt-1 text-3xl font-black text-slate-950">
              Inventory Management
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Restock products,
              record waste and review
              stock movements.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-500 transition hover:bg-red-100 hover:text-red-600"
            aria-label="Close inventory management"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <article className="rounded-2xl bg-slate-950 p-5 text-white">
              <p className="text-sm font-semibold text-slate-400">
                Tracked products
              </p>

              <p className="mt-3 text-3xl font-black">
                {summary.tracked}
              </p>
            </article>

            <article className="rounded-2xl border border-green-200 bg-green-50 p-5">
              <p className="text-sm font-semibold text-green-700">
                In stock
              </p>

              <p className="mt-3 text-3xl font-black text-green-900">
                {summary.inStock}
              </p>
            </article>

            <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-sm font-semibold text-amber-700">
                Low stock
              </p>

              <p className="mt-3 text-3xl font-black text-amber-900">
                {summary.lowStock}
              </p>
            </article>

            <article className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <p className="text-sm font-semibold text-red-700">
                Out of stock
              </p>

              <p className="mt-3 text-3xl font-black text-red-900">
                {summary.outOfStock}
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold text-slate-500">
                Total units
              </p>

              <p className="mt-3 text-3xl font-black">
                {summary.units}
              </p>
            </article>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_420px]">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 p-5">
                <p className="text-sm font-bold uppercase tracking-wider text-orange-500">
                  Products
                </p>

                <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
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
                    placeholder="Search product or category..."
                    className="rounded-xl border-2 border-slate-200 px-4 py-3 font-semibold outline-none focus:border-orange-500"
                  />

                  <select
                    value={filter}
                    onChange={(
                      event,
                    ) =>
                      setFilter(
                        event.target
                          .value as InventoryFilter,
                      )
                    }
                    className="rounded-xl border-2 border-slate-200 bg-white px-4 py-3 font-semibold outline-none focus:border-orange-500"
                  >
                    <option value="ALL">
                      All products
                    </option>

                    <option value="IN_STOCK">
                      In stock
                    </option>

                    <option value="LOW_STOCK">
                      Low stock
                    </option>

                    <option value="OUT_OF_STOCK">
                      Out of stock
                    </option>

                    <option value="UNTRACKED">
                      Not tracked
                    </option>
                  </select>
                </div>
              </div>

              <div className="max-h-[520px] overflow-y-auto p-4">
                <div className="space-y-3">
                  {filteredProducts.map(
                    (product) => {
                      const status =
                        getStatusLabel(
                          product,
                        );

                      const selected =
                        selectedProductId ===
                        product.id;

                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() =>
                            selectProduct(
                              product,
                            )
                          }
                          className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
                            selected
                              ? "border-orange-500 bg-orange-50"
                              : "border-slate-200 bg-white hover:border-orange-300"
                          }`}
                        >
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl">
                            {product.emoji}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block font-black text-slate-950">
                              {product.name}
                            </span>

                            <span className="mt-1 block text-sm text-slate-500">
                              {product.category}
                              {" · "}
                              Low warning at{" "}
                              {product.lowStockThreshold}
                            </span>
                          </span>

                          <span className="text-right">
                            <span className="block text-2xl font-black">
                              {product.trackStock
                                ? product.stockQuantity
                                : "—"}
                            </span>

                            <span
                              className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-bold ${status.classes}`}
                            >
                              {status.label}
                            </span>
                          </span>
                        </button>
                      );
                    },
                  )}

                  {filteredProducts.length ===
                    0 && (
                    <p className="rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center text-slate-500">
                      No products match
                      this filter.
                    </p>
                  )}
                </div>
              </div>
            </section>

            <aside className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-bold uppercase tracking-wider text-orange-500">
                Stock adjustment
              </p>

              {!selectedProduct ? (
                <div className="mt-5 rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center">
                  <p className="text-4xl">
                    📦
                  </p>

                  <p className="mt-3 font-black">
                    Select a product
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    Choose a product
                    from the list to
                    adjust its stock.
                  </p>
                </div>
              ) : (
                <div className="mt-5">
                  <div className="rounded-2xl bg-slate-100 p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">
                        {selectedProduct.emoji}
                      </span>

                      <div>
                        <p className="font-black">
                          {selectedProduct.name}
                        </p>

                        <p className="text-sm text-slate-500">
                          Current stock:{" "}
                          <strong>
                            {selectedProduct.trackStock
                              ? selectedProduct.stockQuantity
                              : "Not tracked"}
                          </strong>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {(
                      [
                        "RESTOCK",
                        "WASTE",
                        "CORRECTION",
                      ] as AdjustmentType[]
                    ).map(
                      (type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            setAdjustmentType(
                              type,
                            );
                            setQuantityValue(
                              "",
                            );
                            setError("");
                            setSuccess("");
                          }}
                          className={`rounded-xl px-3 py-3 text-xs font-black transition ${
                            adjustmentType ===
                            type
                              ? "bg-slate-950 text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {type ===
                          "RESTOCK"
                            ? "Restock"
                            : type ===
                                "WASTE"
                              ? "Waste"
                              : "Correction"}
                        </button>
                      ),
                    )}
                  </div>

                  <label className="mt-4 block">
                    <span className="text-sm font-bold text-slate-700">
                      {adjustmentType ===
                      "CORRECTION"
                        ? "Correct stock to"
                        : "Quantity"}
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={quantityValue}
                      onChange={(
                        event,
                      ) => {
                        setQuantityValue(
                          event.target
                            .value,
                        );
                        setError("");
                        setSuccess("");
                      }}
                      className="mt-2 w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-lg font-black outline-none focus:border-orange-500"
                      placeholder={
                        adjustmentType ===
                        "CORRECTION"
                          ? "New stock total"
                          : "Number of units"
                      }
                    />
                  </label>

                  <label className="mt-4 block">
                    <span className="text-sm font-bold text-slate-700">
                      Reason or note
                    </span>

                    <textarea
                      value={note}
                      onChange={(
                        event,
                      ) => {
                        setNote(
                          event.target
                            .value,
                        );
                        setError("");
                        setSuccess("");
                      }}
                      className="mt-2 min-h-24 w-full resize-none rounded-xl border-2 border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
                      placeholder={
                        adjustmentType ===
                        "RESTOCK"
                          ? "Supplier delivery or invoice reference"
                          : "Reason required"
                      }
                    />
                  </label>

                  {error && (
                    <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
                      {error}
                    </p>
                  )}

                  {success && (
                    <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-700">
                      {success}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={
                      applyAdjustment
                    }
                    disabled={
                      !selectedProduct.trackStock
                    }
                    className="mt-4 w-full rounded-xl bg-orange-500 px-5 py-4 font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    Apply adjustment
                  </button>
                </div>
              )}
            </aside>
          </div>

          <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 p-5">
              <p className="text-sm font-bold uppercase tracking-wider text-orange-500">
                Stock movement history
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Latest 100 movements
                are shown.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-sm">
                <thead className="bg-slate-100 text-left">
                  <tr>
                    <th className="px-5 py-3">
                      Date
                    </th>

                    <th className="px-5 py-3">
                      Product
                    </th>

                    <th className="px-5 py-3">
                      Type
                    </th>

                    <th className="px-5 py-3 text-right">
                      Change
                    </th>

                    <th className="px-5 py-3 text-right">
                      Before
                    </th>

                    <th className="px-5 py-3 text-right">
                      After
                    </th>

                    <th className="px-5 py-3">
                      Staff
                    </th>

                    <th className="px-5 py-3">
                      Note
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {movements.length ===
                    0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-5 py-12 text-center text-slate-500"
                      >
                        No inventory
                        movements recorded.
                      </td>
                    </tr>
                  ) : (
                    movements
                      .slice(0, 100)
                      .map(
                        (movement) => (
                          <tr
                            key={movement.id}
                            className="border-t border-slate-200"
                          >
                            <td className="px-5 py-4">
                              {dateTimeFormatter.format(
                                new Date(
                                  movement.createdAt,
                                ),
                              )}
                            </td>

                            <td className="px-5 py-4 font-black">
                              {movement.productName}
                            </td>

                            <td className="px-5 py-4">
                              {getMovementLabel(
                                movement.type,
                              )}
                            </td>

                            <td className="px-5 py-4 text-right">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-black ${getMovementClasses(
                                  movement.quantityChange,
                                )}`}
                              >
                                {movement.quantityChange >
                                0
                                  ? "+"
                                  : ""}
                                {movement.quantityChange}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-right">
                              {movement.previousStock}
                            </td>

                            <td className="px-5 py-4 text-right font-black">
                              {movement.newStock}
                            </td>

                            <td className="px-5 py-4">
                              {movement.performedBy
                                ? `${movement.performedBy.name} (${movement.performedBy.role})`
                                : "System"}
                            </td>

                            <td className="px-5 py-4 text-slate-500">
                              {movement.note ||
                                movement.orderNumber ||
                                "—"}
                            </td>
                          </tr>
                        ),
                      )
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
