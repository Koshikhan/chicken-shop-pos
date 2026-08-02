"use client";

import { useMemo, useState } from "react";
import type { SavedOrder } from "@/lib/orderStorage";

type OrderHistoryModalProps = {
  isOpen: boolean;
  orders: SavedOrder[];
  onClose: () => void;
};

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function OrderHistoryModal({
  isOpen,
  orders,
  onClose,
}: OrderHistoryModalProps) {
  const [search, setSearch] = useState("");

  const filteredOrders = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      return orders;
    }

    return orders.filter((order) => {
      const productNames = order.items
        .map((item) => item.name)
        .join(" ")
        .toLowerCase();

      const saleType =
        order.taxType === "VAT"
          ? "vat sale"
          : "non-vat sale";

      return (
        order.orderNumber.toLowerCase().includes(searchValue) ||
        order.paymentMethod.toLowerCase().includes(searchValue) ||
        order.orderType.toLowerCase().includes(searchValue) ||
        saleType.includes(searchValue) ||
        productNames.includes(searchValue)
      );
    });
  }, [orders, search]);

  if (!isOpen) {
    return null;
  }

  const printReceipt = (order: SavedOrder) => {
    const receiptWindow = window.open(
      "",
      "_blank",
      "width=420,height=720",
    );

    if (!receiptWindow) {
      window.alert("Please allow pop-ups to print the receipt.");
      return;
    }

    const itemRows = order.items
      .map(
        (item) => `
          <tr>
            <td>${item.quantity} × ${escapeHtml(item.name)}</td>
            <td style="text-align:right">
              ${currencyFormatter.format(item.price * item.quantity)}
            </td>
          </tr>
        `,
      )
      .join("");

    const taxRows =
      order.taxType === "VAT"
        ? `
          <tr>
            <td>Sale type</td>
            <td style="text-align:right">VAT Sale</td>
          </tr>
          <tr>
            <td>Net amount</td>
            <td style="text-align:right">
              ${currencyFormatter.format(order.netAmount)}
            </td>
          </tr>
          <tr>
            <td>VAT at ${Math.round(order.vatRate * 100)}%</td>
            <td style="text-align:right">
              ${currencyFormatter.format(order.vatAmount)}
            </td>
          </tr>
        `
        : `
          <tr>
            <td>Sale type</td>
            <td style="text-align:right">Non-VAT Sale</td>
          </tr>
          <tr>
            <td>VAT</td>
            <td style="text-align:right">Not charged</td>
          </tr>
        `;

    receiptWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>Receipt ${escapeHtml(order.orderNumber)}</title>
          <style>
            body {
              width: 300px;
              margin: 0 auto;
              padding: 24px 10px;
              color: #111827;
              font-family: Arial, sans-serif;
            }
            h1, p { margin: 0; }
            .centre { text-align: center; }
            .divider {
              margin: 16px 0;
              border-top: 1px dashed #111827;
            }
            table {
              width: 100%;
              border-collapse: collapse;
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
            .small {
              margin-top: 5px;
              color: #4b5563;
              font-size: 12px;
            }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="centre">
            <h1>Chicken Shop</h1>
            <p class="small">Main Branch</p>
          </div>

          <div class="divider"></div>

          <table>
            <tr>
              <td>Order</td>
              <td style="text-align:right">
                #${escapeHtml(order.orderNumber)}
              </td>
            </tr>
            <tr>
              <td>Type</td>
              <td style="text-align:right">
                ${escapeHtml(order.orderType)}
              </td>
            </tr>
            <tr>
              <td>Date</td>
              <td style="text-align:right">
                ${escapeHtml(
                  dateFormatter.format(new Date(order.createdAt)),
                )}
              </td>
            </tr>
          </table>

          <div class="divider"></div>

          <table>${itemRows}</table>

          <div class="divider"></div>

          <table>
            ${taxRows}
            <tr class="total">
              <td>Total</td>
              <td style="text-align:right">
                ${currencyFormatter.format(order.subtotal)}
              </td>
            </tr>
            <tr>
              <td>Payment</td>
              <td style="text-align:right">
                ${escapeHtml(order.paymentMethod)}
              </td>
            </tr>
            ${
              order.paymentMethod === "Cash"
                ? `
                  <tr>
                    <td>Cash received</td>
                    <td style="text-align:right">
                      ${currencyFormatter.format(order.amountReceived)}
                    </td>
                  </tr>
                  <tr>
                    <td>Change</td>
                    <td style="text-align:right">
                      ${currencyFormatter.format(order.change)}
                    </td>
                  </tr>
                `
                : ""
            }
          </table>

          <div class="divider"></div>

          <p class="centre small">Thank you for your order</p>

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Order history"
    >
      <section className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-slate-100 shadow-2xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white p-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-orange-500">
              Sales
            </p>
            <h2 className="mt-1 text-3xl font-black text-slate-950">
              Order History
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {orders.length} saved {orders.length === 1 ? "order" : "orders"}
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
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search order, item, payment, VAT sale..."
            className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 font-semibold text-slate-950 outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {filteredOrders.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center">
              <span className="text-5xl">🧾</span>
              <h3 className="mt-4 text-xl font-black">No orders found</h3>
              <p className="mt-2 text-sm text-slate-500">
                Completed orders will appear here.
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <article
                key={order.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-black">
                        Order #{order.orderNumber}
                      </h3>

                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                        {order.status}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          order.taxType === "VAT"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {order.taxType === "VAT"
                          ? "VAT Sale"
                          : "Non-VAT Sale"}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      {dateFormatter.format(new Date(order.createdAt))}
                    </p>

                    <p className="mt-1 text-sm font-semibold text-orange-600">
                      {order.orderType} · {order.paymentMethod} ·{" "}
                      {order.taxType === "VAT"
                        ? "VAT Sale"
                        : "Non-VAT Sale"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-500">
                      Total
                    </p>
                    <p className="text-2xl font-black">
                      {currencyFormatter.format(order.subtotal)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl bg-slate-100 p-4">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between gap-4 py-1 text-sm"
                    >
                      <span className="font-semibold text-slate-700">
                        {item.quantity} × {item.name}
                      </span>
                      <span className="font-bold">
                        {currencyFormatter.format(
                          item.price * item.quantity,
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-2 rounded-xl border border-slate-200 p-4">
                  {order.taxType === "VAT" ? (
                    <>
                      <div className="flex justify-between text-sm font-semibold text-slate-600">
                        <span>Net amount</span>
                        <span>
                          {currencyFormatter.format(order.netAmount)}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm font-semibold text-slate-600">
                        <span>
                          VAT at {Math.round(order.vatRate * 100)}%
                        </span>
                        <span>
                          {currencyFormatter.format(order.vatAmount)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-sm font-semibold text-slate-600">
                      <span>VAT</span>
                      <span>Not charged</span>
                    </div>
                  )}

                  <div className="flex justify-between border-t border-slate-200 pt-2 font-black">
                    <span>Total</span>
                    <span>
                      {currencyFormatter.format(order.subtotal)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-500">
                    {order.itemCount} item
                    {order.itemCount === 1 ? "" : "s"}
                  </p>

                  <button
                    type="button"
                    onClick={() => printReceipt(order)}
                    className="rounded-xl bg-slate-950 px-5 py-3 font-bold text-white transition hover:bg-slate-800"
                  >
                    Print receipt
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
