"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createProductId,
  menuCategories,
  type Category,
  type Product,
} from "@/lib/menuStorage";

type MenuManagementModalProps = {
  isOpen: boolean;
  products: Product[];
  onClose: () => void;
  onSave: (products: Product[]) => void;
};

type ProductForm = {
  id: number | null;
  name: string;
  description: string;
  category: Category;
  price: string;
  emoji: string;
  available: boolean;
};

const emptyForm: ProductForm = {
  id: null,
  name: "",
  description: "",
  category: "Meals",
  price: "",
  emoji: "🍗",
  available: true,
};

const currencyFormatter =
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  });

export function MenuManagementModal({
  isOpen,
  products,
  onClose,
  onSave,
}: MenuManagementModalProps) {
  const [draftProducts, setDraftProducts] =
    useState<Product[]>([]);

  const [form, setForm] =
    useState<ProductForm>(emptyForm);

  const [search, setSearch] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDraftProducts(
      products.map((product) => ({
        ...product,
      })),
    );
    setForm(emptyForm);
    setSearch("");
    setError("");
  }, [isOpen, products]);

  const filteredProducts =
    useMemo(() => {
      const value =
        search.trim().toLowerCase();

      if (!value) {
        return draftProducts;
      }

      return draftProducts.filter(
        (product) =>
          product.name
            .toLowerCase()
            .includes(value) ||
          product.category
            .toLowerCase()
            .includes(value),
      );
    }, [draftProducts, search]);

  if (!isOpen) {
    return null;
  }

  const updateForm = <
    Key extends keyof ProductForm,
  >(
    key: Key,
    value: ProductForm[Key],
  ) => {
    setForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));

    setError("");
  };

  const resetForm = () => {
    setForm(emptyForm);
    setError("");
  };

  const editProduct = (
    product: Product,
  ) => {
    setForm({
      id: product.id,
      name: product.name,
      description:
        product.description,
      category: product.category,
      price: product.price.toFixed(2),
      emoji: product.emoji,
      available: product.available,
    });

    setError("");
  };

  const saveProduct = () => {
    const name = form.name.trim();
    const description =
      form.description.trim();
    const emoji =
      form.emoji.trim() || "🍗";
    const price = Number.parseFloat(
      form.price,
    );

    if (!name) {
      setError(
        "Enter a product name.",
      );
      return;
    }

    if (
      !Number.isFinite(price) ||
      price <= 0
    ) {
      setError(
        "Enter a valid price greater than £0.00.",
      );
      return;
    }

    if (form.id === null) {
      const newProduct: Product = {
        id: createProductId(),
        name,
        description,
        category: form.category,
        price,
        emoji,
        available: form.available,
      };

      setDraftProducts(
        (currentProducts) => [
          ...currentProducts,
          newProduct,
        ],
      );
    } else {
      setDraftProducts(
        (currentProducts) =>
          currentProducts.map(
            (product) =>
              product.id === form.id
                ? {
                    ...product,
                    name,
                    description,
                    category:
                      form.category,
                    price,
                    emoji,
                    available:
                      form.available,
                  }
                : product,
          ),
      );
    }

    resetForm();
  };

  const toggleAvailability = (
    productId: number,
  ) => {
    setDraftProducts(
      (currentProducts) =>
        currentProducts.map(
          (product) =>
            product.id === productId
              ? {
                  ...product,
                  available:
                    !product.available,
                }
              : product,
        ),
    );

    if (form.id === productId) {
      setForm((currentForm) => ({
        ...currentForm,
        available:
          !currentForm.available,
      }));
    }
  };

  const deleteProduct = (
    product: Product,
  ) => {
    const confirmed =
      window.confirm(
        `Delete ${product.name} from the menu?`,
      );

    if (!confirmed) {
      return;
    }

    setDraftProducts(
      (currentProducts) =>
        currentProducts.filter(
          (item) =>
            item.id !== product.id,
        ),
    );

    if (form.id === product.id) {
      resetForm();
    }
  };

  const saveMenuChanges = () => {
    onSave(draftProducts);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Menu management"
    >
      <section className="flex max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-slate-100 shadow-2xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white p-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-orange-500">
              Manager
            </p>

            <h2 className="mt-1 text-3xl font-black text-slate-950">
              Menu Management
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Add products, change prices
              and control availability.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-500 transition hover:bg-red-100 hover:text-red-600"
            aria-label="Close menu management"
          >
            ×
          </button>
        </header>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="min-h-0 overflow-y-auto p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search product or category..."
                className="min-w-64 flex-1 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 font-semibold outline-none focus:border-orange-500"
              />

              <p className="text-sm font-bold text-slate-500">
                {draftProducts.length}{" "}
                products
              </p>
            </div>

            <div className="space-y-3">
              {filteredProducts.map(
                (product) => (
                  <article
                    key={product.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-3xl">
                        {product.emoji}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-black text-slate-950">
                            {product.name}
                          </h3>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                              product.available
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {product.available
                              ? "Available"
                              : "Out of stock"}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                          {product.category}
                          {" · "}
                          {currencyFormatter.format(
                            product.price,
                          )}
                        </p>

                        <p className="mt-2 text-sm text-slate-600">
                          {product.description ||
                            "No description"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            toggleAvailability(
                              product.id,
                            )
                          }
                          className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
                        >
                          {product.available
                            ? "Mark out"
                            : "Make available"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            editProduct(
                              product,
                            )
                          }
                          className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteProduct(
                              product,
                            )
                          }
                          className="rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ),
              )}

              {filteredProducts.length ===
                0 && (
                <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-10 text-center">
                  <p className="text-4xl">
                    🍽️
                  </p>

                  <h3 className="mt-3 font-black">
                    No products found
                  </h3>
                </div>
              )}
            </div>
          </div>

          <aside className="overflow-y-auto border-l border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
                  Product editor
                </p>

                <h3 className="mt-1 text-xl font-black">
                  {form.id === null
                    ? "Add new product"
                    : "Edit product"}
                </h3>
              </div>

              {form.id !== null && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700"
                >
                  Cancel edit
                </button>
              )}
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Product name
                </span>

                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    updateForm(
                      "name",
                      event.target.value,
                    )
                  }
                  className="mt-2 w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
                  placeholder="Chicken burger"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Description
                </span>

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    updateForm(
                      "description",
                      event.target.value,
                    )
                  }
                  className="mt-2 min-h-24 w-full resize-none rounded-xl border-2 border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
                  placeholder="Chicken fillet, lettuce and sauce"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">
                    Category
                  </span>

                  <select
                    value={form.category}
                    onChange={(event) =>
                      updateForm(
                        "category",
                        event.target
                          .value as Category,
                      )
                    }
                    className="mt-2 w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-3 outline-none focus:border-orange-500"
                  >
                    {menuCategories.map(
                    (category: Category) => (
                        <option
                          key={category}
                          value={category}
                        >
                          {category}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-bold text-slate-700">
                    Price
                  </span>

                  <div className="mt-2 flex rounded-xl border-2 border-slate-200 px-3 focus-within:border-orange-500">
                    <span className="py-3 font-black text-slate-500">
                      £
                    </span>

                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.price}
                      onChange={(event) =>
                        updateForm(
                          "price",
                          event.target.value,
                        )
                      }
                      className="min-w-0 flex-1 px-2 py-3 outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Product icon or emoji
                </span>

                <input
                  type="text"
                  value={form.emoji}
                  onChange={(event) =>
                    updateForm(
                      "emoji",
                      event.target.value,
                    )
                  }
                  className="mt-2 w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-2xl outline-none focus:border-orange-500"
                  placeholder="🍗"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between rounded-xl bg-slate-100 p-4">
                <div>
                  <p className="font-bold text-slate-950">
                    Available for sale
                  </p>

                  <p className="text-xs text-slate-500">
                    Turn this off when the
                    item is out of stock.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={form.available}
                  onChange={(event) =>
                    updateForm(
                      "available",
                      event.target.checked,
                    )
                  }
                  className="h-6 w-6 accent-orange-500"
                />
              </label>

              {error && (
                <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={saveProduct}
                className="w-full rounded-xl bg-orange-500 px-5 py-4 font-black text-white transition hover:bg-orange-600"
              >
                {form.id === null
                  ? "Add product"
                  : "Update product"}
              </button>
            </div>
          </aside>
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 bg-white p-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-200"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={saveMenuChanges}
            className="rounded-xl bg-green-600 px-6 py-3 font-black text-white transition hover:bg-green-700"
          >
            Save menu changes
          </button>
        </footer>
      </section>
    </div>
  );
}
