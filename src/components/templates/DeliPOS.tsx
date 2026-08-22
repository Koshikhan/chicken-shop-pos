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

export function DeliPOS({
  categories,
  selectedCategory,
  onSelectedCategoryChange,
  products,
  productSearch,
  onProductSearchChange,
  orderType,
  onOrderTypeChange,
  taxType,
  onTaxTypeChange,
  onAddProduct,
}: PosTemplateProps) {
  const filteredProducts =
    useMemo(() => {
      const searchValue =
        productSearch
          .trim()
          .toLowerCase();

      return products.filter(
        (
          product,
        ) => {
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

  return (
    <section className="min-w-0 p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Build the customer order from the deli counter
          </p>

          <h2 className="text-2xl font-black">
            Deli Counter
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

      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-slate-950">
              Deli categories
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Choose a counter section or search the menu.
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
              onProductSearchChange(
                event.target.value,
              )
            }
            placeholder="Search sandwiches, paninis, drinks..."
            className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-orange-500 sm:w-80"
          />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {categories.map(
            (
              category,
            ) => {
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
                    onSelectedCategoryChange(
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
        isDeli
        onAddProduct={
          onAddProduct
        }
      />
    </section>
  );
}
