"use client";

import {
  useMemo,
} from "react";

import {
  ProductGrid,
} from "@/components/templates/ProductGrid";

import type {
  OrderType,
  PosTemplateProps,
} from "@/components/templates/templateTypes";

export function FastFoodPOS({
  categories,
  selectedCategory,
  onSelectedCategoryChange,
  products,
  orderType,
  onOrderTypeChange,
  taxType,
  onTaxTypeChange,
  onAddProduct,
}: PosTemplateProps) {
  const filteredProducts =
    useMemo(
      () =>
        products.filter(
          (
            product,
          ) =>
            selectedCategory ===
              "All" ||
            product.category ===
              selectedCategory,
        ),
      [
        products,
        selectedCategory,
      ],
    );

  return (
    <>
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
                    onSelectedCategoryChange(
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

      <section className="min-w-0 p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Select products to add them to the order
            </p>

            <h2 className="text-2xl font-black">
              {
                selectedCategory
              }
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
                    onOrderTypeChange(
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

        <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <p className="text-sm font-black text-slate-950">
              Sale type
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Select whether this order includes VAT.
            </p>
          </div>

          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() =>
                onTaxTypeChange(
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
                onTaxTypeChange(
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

        <ProductGrid
          products={
            filteredProducts
          }
          onAddProduct={
            onAddProduct
          }
        />
      </section>
    </>
  );
}