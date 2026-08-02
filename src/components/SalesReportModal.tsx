"use client";

import { useMemo, useState } from "react";

import type { SavedOrder } from "@/lib/orderStorage";

import {
  calculateSalesSummary,
  getMonthStartDateKey,
  getTodayDateKey,
  getWeekStartDateKey,
  type OrderTypeFilter,
  type PaymentFilter,
} from "@/lib/salesReport";

type SalesReportModalProps = {
  isOpen: boolean;
  orders: SavedOrder[];
  onClose: () => void;
};

type ReportPreset =
  | "Today"
  | "This Week"
  | "This Month"
  | "Custom";

const currencyFormatter = new Intl.NumberFormat(
  "en-GB",
  {
    style: "currency",
    currency: "GBP",
  },
);

const dateFormatter = new Intl.DateTimeFormat(
  "en-GB",
  {
    dateStyle: "medium",
  },
);

const dateTimeFormatter =
  new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

function formatDateKey(dateKey: string) {
  return dateFormatter.format(
    new Date(`${dateKey}T12:00:00`),
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function SalesReportModal({
  isOpen,
  orders,
  onClose,
}: SalesReportModalProps) {
  const today = getTodayDateKey();

  const [reportPreset, setReportPreset] =
    useState<ReportPreset>("Today");

  const [startDate, setStartDate] =
    useState(today);

  const [endDate, setEndDate] =
    useState(today);

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentFilter>("All");

  const [orderType, setOrderType] =
    useState<OrderTypeFilter>("All");

  const summary = useMemo(
    () =>
      calculateSalesSummary(orders, {
        startDate,
        endDate,
        paymentMethod,
        orderType,
      }),
    [
      orders,
      startDate,
      endDate,
      paymentMethod,
      orderType,
    ],
  );

  if (!isOpen) {
    return null;
  }

  const selectPreset = (
    preset: ReportPreset,
  ) => {
    setReportPreset(preset);

    if (preset === "Today") {
      setStartDate(today);
      setEndDate(today);
      return;
    }

    if (preset === "This Week") {
      setStartDate(getWeekStartDateKey());
      setEndDate(today);
      return;
    }

    if (preset === "This Month") {
      setStartDate(getMonthStartDateKey());
      setEndDate(today);
    }
  };

  const reportRangeLabel =
    startDate === endDate
      ? formatDateKey(startDate)
      : `${formatDateKey(
          startDate,
        )} – ${formatDateKey(endDate)}`;

  const printReport = () => {
    const reportWindow = window.open(
      "",
      "_blank",
      "width=980,height=800",
    );

    if (!reportWindow) {
      window.alert(
        "Please allow pop-ups to print the report.",
      );
      return;
    }

    const productRows =
      summary.topProducts.length > 0
        ? summary.topProducts
            .map(
              (product, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${escapeHtml(
                    product.name,
                  )}</td>
                  <td class="right">
                    ${product.quantity}
                  </td>
                  <td class="right">
                    ${currencyFormatter.format(
                      product.revenue,
                    )}
                  </td>
                </tr>
              `,
            )
            .join("")
        : `
            <tr>
              <td colspan="4" class="empty">
                No product sales in this report.
              </td>
            </tr>
          `;

    const orderRows =
      summary.filteredOrders.length > 0
        ? summary.filteredOrders
            .map(
              (order) => `
                <tr>
                  <td>${escapeHtml(
                    order.orderNumber,
                  )}</td>
                  <td>${escapeHtml(
                    dateTimeFormatter.format(
                      new Date(order.createdAt),
                    ),
                  )}</td>
                  <td>${escapeHtml(
                    order.orderType,
                  )}</td>
                  <td>${escapeHtml(
                    order.paymentMethod,
                  )}</td>
                  <td class="right">
                    ${order.itemCount}
                  </td>
                  <td class="right">
                    ${currencyFormatter.format(
                      order.subtotal,
                    )}
                  </td>
                </tr>
              `,
            )
            .join("")
        : `
            <tr>
              <td colspan="6" class="empty">
                No completed orders in this report.
              </td>
            </tr>
          `;

    reportWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>Sales Report</title>

          <style>
            * { box-sizing: border-box; }

            body {
              margin: 0;
              padding: 28px;
              color: #0f172a;
              font-family: Arial, Helvetica, sans-serif;
            }

            h1, h2, p { margin: 0; }

            .header {
              display: flex;
              justify-content: space-between;
              gap: 24px;
              padding-bottom: 18px;
              border-bottom: 2px solid #0f172a;
            }

            .brand {
              color: #f97316;
              font-size: 12px;
              font-weight: 800;
              letter-spacing: 2px;
              text-transform: uppercase;
            }

            h1 {
              margin-top: 5px;
              font-size: 28px;
            }

            .meta {
              text-align: right;
              font-size: 12px;
              line-height: 1.6;
            }

            .filters {
              margin-top: 16px;
              padding: 12px 14px;
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              background: #f8fafc;
              font-size: 12px;
            }

            .cards {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 12px;
              margin-top: 18px;
            }

            .card {
              padding: 14px;
              border: 1px solid #cbd5e1;
              border-radius: 8px;
            }

            .card p {
              color: #64748b;
              font-size: 11px;
            }

            .card strong {
              display: block;
              margin-top: 7px;
              font-size: 20px;
            }

            .section { margin-top: 24px; }

            h2 {
              margin-bottom: 10px;
              font-size: 17px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
            }

            th, td {
              padding: 8px;
              border: 1px solid #cbd5e1;
              text-align: left;
              vertical-align: top;
            }

            th {
              background: #e2e8f0;
              font-weight: 800;
            }

            .right { text-align: right; }

            .empty {
              padding: 20px;
              color: #64748b;
              text-align: center;
            }

            .footer {
              margin-top: 24px;
              padding-top: 12px;
              border-top: 1px solid #cbd5e1;
              color: #64748b;
              font-size: 10px;
              text-align: center;
            }

            @media print {
              body { padding: 0; }
              thead { display: table-header-group; }
              tr { break-inside: avoid; }
            }
          </style>
        </head>

        <body>
          <header class="header">
            <div>
              <p class="brand">Chicken Shop POS</p>
              <h1>Sales Report</h1>
            </div>

            <div class="meta">
              <strong>Main Branch</strong>
              <br />
              ${escapeHtml(reportRangeLabel)}
              <br />
              Printed:
              ${escapeHtml(
                dateTimeFormatter.format(
                  new Date(),
                ),
              )}
            </div>
          </header>

          <div class="filters">
            <strong>Filters:</strong>
            Payment: ${escapeHtml(paymentMethod)}
            · Order type: ${escapeHtml(orderType)}
          </div>

          <section class="cards">
            <div class="card">
              <p>Total sales</p>
              <strong>
                ${currencyFormatter.format(
                  summary.totalSales,
                )}
              </strong>
            </div>

            <div class="card">
              <p>Completed orders</p>
              <strong>${summary.totalOrders}</strong>
            </div>

            <div class="card">
              <p>Average order value</p>
              <strong>
                ${currencyFormatter.format(
                  summary.averageOrderValue,
                )}
              </strong>
            </div>

            <div class="card">
              <p>Items sold</p>
              <strong>${summary.totalItems}</strong>
            </div>
          </section>

          <section class="section">
            <h2>Payment and order breakdown</h2>

            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th class="right">Orders</th>
                  <th class="right">Sales</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>Cash</td>
                  <td class="right">
                    ${summary.cashOrders}
                  </td>
                  <td class="right">
                    ${currencyFormatter.format(
                      summary.cashSales,
                    )}
                  </td>
                </tr>

                <tr>
                  <td>Card</td>
                  <td class="right">
                    ${summary.cardOrders}
                  </td>
                  <td class="right">
                    ${currencyFormatter.format(
                      summary.cardSales,
                    )}
                  </td>
                </tr>

                <tr>
                  <td>Takeaway</td>
                  <td class="right">
                    ${summary.takeawayOrders}
                  </td>
                  <td class="right">—</td>
                </tr>

                <tr>
                  <td>Eat In</td>
                  <td class="right">
                    ${summary.eatInOrders}
                  </td>
                  <td class="right">—</td>
                </tr>

                <tr>
                  <td>Delivery</td>
                  <td class="right">
                    ${summary.deliveryOrders}
                  </td>
                  <td class="right">—</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section class="section">
            <h2>Best-selling products</h2>

            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th class="right">Quantity</th>
                  <th class="right">Revenue</th>
                </tr>
              </thead>

              <tbody>${productRows}</tbody>
            </table>
          </section>

          <section class="section">
            <h2>Completed orders</h2>

            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date and time</th>
                  <th>Type</th>
                  <th>Payment</th>
                  <th class="right">Items</th>
                  <th class="right">Total</th>
                </tr>
              </thead>

              <tbody>${orderRows}</tbody>
            </table>
          </section>

          <p class="footer">
            Generated by Chicken Shop POS
          </p>

          <script>
            window.onload = () => {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    reportWindow.document.close();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Sales reports"
    >
      <section className="flex max-h-[95vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl bg-slate-100 shadow-2xl">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 bg-white p-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-orange-500">
              Manager
            </p>

            <h2 className="mt-1 text-3xl font-black text-slate-950">
              Sales Reports
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {reportRangeLabel}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={printReport}
              className="rounded-xl bg-slate-950 px-5 py-3 font-bold text-white transition hover:bg-slate-800"
            >
              Print report
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-500 transition hover:bg-red-100 hover:text-red-600"
              aria-label="Close sales reports"
            >
              ×
            </button>
          </div>
        </header>

        <div className="border-b border-slate-200 bg-white p-5">
          <div className="flex flex-wrap gap-2">
            {(
              [
                "Today",
                "This Week",
                "This Month",
                "Custom",
              ] as ReportPreset[]
            ).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() =>
                  selectPreset(preset)
                }
                className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                  reportPreset === preset
                    ? "bg-orange-500 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="text-sm font-bold text-slate-700">
              Start date

              <input
                type="date"
                value={startDate}
                max={endDate}
                onChange={(event) => {
                  setStartDate(
                    event.target.value,
                  );
                  setReportPreset("Custom");
                }}
                className="mt-2 block w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 font-semibold outline-none focus:border-orange-500"
              />
            </label>

            <label className="text-sm font-bold text-slate-700">
              End date

              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(event) => {
                  setEndDate(
                    event.target.value,
                  );
                  setReportPreset("Custom");
                }}
                className="mt-2 block w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 font-semibold outline-none focus:border-orange-500"
              />
            </label>

            <label className="text-sm font-bold text-slate-700">
              Payment method

              <select
                value={paymentMethod}
                onChange={(event) =>
                  setPaymentMethod(
                    event.target
                      .value as PaymentFilter,
                  )
                }
                className="mt-2 block w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 font-semibold outline-none focus:border-orange-500"
              >
                <option value="All">
                  All payments
                </option>
                <option value="Cash">
                  Cash
                </option>
                <option value="Card">
                  Card
                </option>
              </select>
            </label>

            <label className="text-sm font-bold text-slate-700">
              Order type

              <select
                value={orderType}
                onChange={(event) =>
                  setOrderType(
                    event.target
                      .value as OrderTypeFilter,
                  )
                }
                className="mt-2 block w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 font-semibold outline-none focus:border-orange-500"
              >
                <option value="All">
                  All order types
                </option>
                <option value="Takeaway">
                  Takeaway
                </option>
                <option value="Eat In">
                  Eat In
                </option>
                <option value="Delivery">
                  Delivery
                </option>
              </select>
            </label>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl bg-slate-950 p-5 text-white">
              <p className="text-sm font-semibold text-slate-400">
                Total sales
              </p>
              <p className="mt-3 text-3xl font-black">
                {currencyFormatter.format(
                  summary.totalSales,
                )}
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold text-slate-500">
                Average order value
              </p>
              <p className="mt-3 text-3xl font-black">
                {currencyFormatter.format(
                  summary.averageOrderValue,
                )}
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold text-slate-500">
                Items sold
              </p>
              <p className="mt-3 text-3xl font-black">
                {summary.totalItems}
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold text-slate-500">
                Orders
              </p>
              <p className="mt-3 text-3xl font-black">
                {summary.totalOrders}
              </p>
            </article>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-bold uppercase tracking-wider text-orange-500">
                Payments
              </p>

              <div className="mt-4 space-y-3">
                <div className="flex justify-between rounded-xl bg-green-50 p-4">
                  <span className="font-black">
                    Cash ({summary.cashOrders})
                  </span>
                  <span className="font-black text-green-800">
                    {currencyFormatter.format(
                      summary.cashSales,
                    )}
                  </span>
                </div>

                <div className="flex justify-between rounded-xl bg-blue-50 p-4">
                  <span className="font-black">
                    Card ({summary.cardOrders})
                  </span>
                  <span className="font-black text-blue-800">
                    {currencyFormatter.format(
                      summary.cardSales,
                    )}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-bold uppercase tracking-wider text-orange-500">
                Order types
              </p>

              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-slate-100 p-4">
                  <p className="text-sm text-slate-500">
                    Takeaway
                  </p>
                  <p className="mt-2 text-2xl font-black">
                    {summary.takeawayOrders}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-100 p-4">
                  <p className="text-sm text-slate-500">
                    Eat In
                  </p>
                  <p className="mt-2 text-2xl font-black">
                    {summary.eatInOrders}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-100 p-4">
                  <p className="text-sm text-slate-500">
                    Delivery
                  </p>
                  <p className="mt-2 text-2xl font-black">
                    {summary.deliveryOrders}
                  </p>
                </div>
              </div>
            </section>
          </div>

          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-bold uppercase tracking-wider text-orange-500">
              Best-selling products
            </p>

            {summary.topProducts.length === 0 ? (
              <p className="mt-5 rounded-xl bg-slate-100 p-8 text-center text-slate-500">
                No matching sales.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {summary.topProducts.map(
                  (product, index) => (
                    <div
                      key={product.name}
                      className="flex items-center gap-4 rounded-xl bg-slate-100 p-4"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 font-black text-white">
                        {index + 1}
                      </span>

                      <div className="flex-1">
                        <p className="font-black">
                          {product.name}
                        </p>
                        <p className="text-sm text-slate-500">
                          {product.quantity} sold
                        </p>
                      </div>

                      <p className="font-black">
                        {currencyFormatter.format(
                          product.revenue,
                        )}
                      </p>
                    </div>
                  ),
                )}
              </div>
            )}
          </section>

          <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="p-5">
              <p className="text-sm font-bold uppercase tracking-wider text-orange-500">
                Matching orders
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-slate-100 text-left">
                  <tr>
                    <th className="px-5 py-3">
                      Order
                    </th>
                    <th className="px-5 py-3">
                      Date
                    </th>
                    <th className="px-5 py-3">
                      Type
                    </th>
                    <th className="px-5 py-3">
                      Payment
                    </th>
                    <th className="px-5 py-3 text-right">
                      Items
                    </th>
                    <th className="px-5 py-3 text-right">
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {summary.filteredOrders.length ===
                  0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-12 text-center text-slate-500"
                      >
                        No completed orders match these filters.
                      </td>
                    </tr>
                  ) : (
                    summary.filteredOrders.map(
                      (order) => (
                        <tr
                          key={order.id}
                          className="border-t border-slate-200"
                        >
                          <td className="px-5 py-4 font-black">
                            #{order.orderNumber}
                          </td>
                          <td className="px-5 py-4">
                            {dateTimeFormatter.format(
                              new Date(
                                order.createdAt,
                              ),
                            )}
                          </td>
                          <td className="px-5 py-4">
                            {order.orderType}
                          </td>
                          <td className="px-5 py-4">
                            {order.paymentMethod}
                          </td>
                          <td className="px-5 py-4 text-right">
                            {order.itemCount}
                          </td>
                          <td className="px-5 py-4 text-right font-black">
                            {currencyFormatter.format(
                              order.subtotal,
                            )}
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
