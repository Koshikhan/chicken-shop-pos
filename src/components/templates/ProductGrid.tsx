"use client";

import {
  getProductStockStatus,
  isProductSellable,
  type Product,
} from "@/lib/menuStorage";

const currencyFormatter =
  new Intl.NumberFormat(
    "en-GB",
    {
      style: "currency",
      currency: "GBP",
    },
  );

type ProductGridProps = {
  products: Product[];
  isDeli?: boolean;
  onAddProduct: (
    product: Product,
  ) => void;
};

export function ProductGrid({
  products,
  isDeli = false,
  onAddProduct,
}: ProductGridProps) {
  return (
    <div
      className={`grid gap-4 ${
        isDeli
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          : "grid-cols-2 md:grid-cols-3 2xl:grid-cols-4"
      }`}
    >
      {products.map(
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
                onAddProduct(
                  product,
                )
              }
              className={`relative rounded-2xl border p-5 text-left shadow-sm transition ${
                isDeli
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
                  isDeli
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

      {products.length ===
        0 && (
        <div className="col-span-full rounded-2xl border-2 border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-4xl">
            {isDeli
              ? "🥪"
              : "📦"}
          </p>

          <h3 className="mt-3 font-black text-slate-900">
            No products here yet
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            {isDeli
              ? "Use Manage Menu to add the deli's first sandwiches, paninis, drinks or other products."
              : "No products match this category."}
          </p>
        </div>
      )}
    </div>
  );
}