import {
    getOrderFinancialSummary,
    type SavedOrder,
  } from "@/lib/orderStorage";
  
  export type PaymentFilter =
    | "All"
    | SavedOrder["paymentMethod"];
  
  export type OrderTypeFilter =
    | "All"
    | SavedOrder["orderType"];
  
  export type TaxTypeFilter =
    | "All"
    | SavedOrder["taxType"];
  
  export type SalesReportFilters = {
    startDate: string;
    endDate: string;
    paymentMethod: PaymentFilter;
    orderType: OrderTypeFilter;
    taxType: TaxTypeFilter;
  };
  
  export type ProductSales = {
    name: string;
    quantity: number;
    revenue: number;
  };
  
  export type SalesSummary = {
    startDate: string;
    endDate: string;
  
    // Recognised sales after refunds and voids.
    totalSales: number;
    netSales: number;
    vatCollected: number;
  
    // Original value before refunds.
    originalGrossSales: number;
  
    // Adjustments.
    refundedSales: number;
    refundedNetAmount: number;
    vatReversed: number;
    voidedSales: number;
  
    vatSales: number;
    nonVatSales: number;
  
    vatOrders: number;
    nonVatOrders: number;
  
    totalOrders: number;
    completedOrders: number;
    partiallyRefundedOrders: number;
    refundedOrders: number;
    voidedOrders: number;
  
    averageOrderValue: number;
  
    cashSales: number;
    cardSales: number;
  
    cashOrders: number;
    cardOrders: number;
  
    takeawayOrders: number;
    eatInOrders: number;
    deliveryOrders: number;
  
    totalItems: number;
    topProducts: ProductSales[];
  
    /*
     * Orders returned here contain recognised
     * net, VAT and gross amounts so the report
     * table displays adjusted figures.
     */
    filteredOrders: SavedOrder[];
  };
  
  export function getLocalDateKey(
    date: Date,
  ) {
    const year =
      date.getFullYear();
  
    const month = String(
      date.getMonth() + 1,
    ).padStart(2, "0");
  
    const day = String(
      date.getDate(),
    ).padStart(2, "0");
  
    return `${year}-${month}-${day}`;
  }
  
  export function getTodayDateKey() {
    return getLocalDateKey(
      new Date(),
    );
  }
  
  export function getWeekStartDateKey() {
    const today =
      new Date();
  
    const dayOfWeek =
      today.getDay();
  
    const daysSinceMonday =
      dayOfWeek === 0
        ? 6
        : dayOfWeek - 1;
  
    const monday =
      new Date(today);
  
    monday.setDate(
      today.getDate() -
        daysSinceMonday,
    );
  
    return getLocalDateKey(
      monday,
    );
  }
  
  export function getMonthStartDateKey() {
    const today =
      new Date();
  
    const monthStart =
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1,
      );
  
    return getLocalDateKey(
      monthStart,
    );
  }
  
  function roundCurrency(
    amount: number,
  ) {
    return Math.round(
      (amount + Number.EPSILON) *
        100,
    ) / 100;
  }
  
  export function calculateSalesSummary(
    orders: SavedOrder[],
    filters: SalesReportFilters,
  ): SalesSummary {
    const matchingOrders =
      orders.filter((order) => {
        const orderDate =
          getLocalDateKey(
            new Date(
              order.createdAt,
            ),
          );
  
        const isWithinDateRange =
          orderDate >=
            filters.startDate &&
          orderDate <=
            filters.endDate;
  
        const matchesPayment =
          filters.paymentMethod ===
            "All" ||
          order.paymentMethod ===
            filters.paymentMethod;
  
        const matchesOrderType =
          filters.orderType ===
            "All" ||
          order.orderType ===
            filters.orderType;
  
        const matchesTaxType =
          filters.taxType ===
            "All" ||
          order.taxType ===
            filters.taxType;
  
        return (
          isWithinDateRange &&
          matchesPayment &&
          matchesOrderType &&
          matchesTaxType
        );
      });
  
    const orderFinancials =
      matchingOrders.map(
        (order) => ({
          order,
          financial:
            getOrderFinancialSummary(
              order,
            ),
        }),
      );
  
    const nonVoidedOrders =
      orderFinancials.filter(
        ({ order }) =>
          order.status !==
          "Voided",
      );
  
    const filteredOrders =
      orderFinancials.map(
        ({
          order,
          financial,
        }) => ({
          ...order,
          subtotal:
            financial.recognisedGrossAmount,
          netAmount:
            financial.recognisedNetAmount,
          vatAmount:
            financial.recognisedVatAmount,
        }),
      );
  
    const totalSales =
      orderFinancials.reduce(
        (total, entry) =>
          total +
          entry.financial
            .recognisedGrossAmount,
        0,
      );
  
    const netSales =
      orderFinancials.reduce(
        (total, entry) =>
          total +
          entry.financial
            .recognisedNetAmount,
        0,
      );
  
    const vatCollected =
      orderFinancials.reduce(
        (total, entry) =>
          total +
          entry.financial
            .recognisedVatAmount,
        0,
      );
  
    const originalGrossSales =
      nonVoidedOrders.reduce(
        (total, entry) =>
          total +
          entry.financial
            .originalGrossAmount,
        0,
      );
  
    const refundedSales =
      nonVoidedOrders.reduce(
        (total, entry) =>
          total +
          entry.financial
            .refundedGrossAmount,
        0,
      );
  
    const refundedNetAmount =
      nonVoidedOrders.reduce(
        (total, entry) =>
          total +
          entry.financial
            .refundedNetAmount,
        0,
      );
  
    const vatReversed =
      nonVoidedOrders.reduce(
        (total, entry) =>
          total +
          entry.financial
            .refundedVatAmount,
        0,
      );
  
    const voidedEntries =
      orderFinancials.filter(
        ({ order }) =>
          order.status ===
          "Voided",
      );
  
    const voidedSales =
      voidedEntries.reduce(
        (total, entry) =>
          total +
          entry.financial
            .originalGrossAmount,
        0,
      );
  
    const vatEntries =
      nonVoidedOrders.filter(
        ({ order }) =>
          order.taxType === "VAT",
      );
  
    const nonVatEntries =
      nonVoidedOrders.filter(
        ({ order }) =>
          order.taxType ===
          "NON_VAT",
      );
  
    const vatSales =
      vatEntries.reduce(
        (total, entry) =>
          total +
          entry.financial
            .recognisedGrossAmount,
        0,
      );
  
    const nonVatSales =
      nonVatEntries.reduce(
        (total, entry) =>
          total +
          entry.financial
            .recognisedGrossAmount,
        0,
      );
  
    const cashEntries =
      nonVoidedOrders.filter(
        ({ order }) =>
          order.paymentMethod ===
          "Cash",
      );
  
    const cardEntries =
      nonVoidedOrders.filter(
        ({ order }) =>
          order.paymentMethod ===
          "Card",
      );
  
    const cashSales =
      cashEntries.reduce(
        (total, entry) =>
          total +
          entry.financial
            .recognisedGrossAmount,
        0,
      );
  
    const cardSales =
      cardEntries.reduce(
        (total, entry) =>
          total +
          entry.financial
            .recognisedGrossAmount,
        0,
      );
  
    const takeawayOrders =
      nonVoidedOrders.filter(
        ({ order }) =>
          order.orderType ===
          "Takeaway",
      ).length;
  
    const eatInOrders =
      nonVoidedOrders.filter(
        ({ order }) =>
          order.orderType ===
          "Eat In",
      ).length;
  
    const deliveryOrders =
      nonVoidedOrders.filter(
        ({ order }) =>
          order.orderType ===
          "Delivery",
      ).length;
  
    const completedEntries =
      nonVoidedOrders.filter(
        ({ order }) =>
          order.status ===
          "Completed",
      );
  
    const partiallyRefundedEntries =
      nonVoidedOrders.filter(
        ({ order }) =>
          order.status ===
          "Partially Refunded",
      );
  
    const refundedEntries =
      nonVoidedOrders.filter(
        ({ order }) =>
          order.status ===
          "Refunded",
      );
  
    /*
     * Fully refunded and voided orders no
     * longer contribute to items sold.
     *
     * Partial refunds do not identify which
     * product was returned, so their original
     * item quantity remains in this MVP.
     */
    const itemSalesEntries =
      nonVoidedOrders.filter(
        ({ order }) =>
          order.status !==
          "Refunded",
      );
  
    const totalItems =
      itemSalesEntries.reduce(
        (total, entry) =>
          total +
          entry.order.itemCount,
        0,
      );
  
    const productTotals =
      new Map<
        string,
        ProductSales
      >();
  
    itemSalesEntries.forEach(
      ({
        order,
        financial,
      }) => {
        const recognisedRatio =
          order.subtotal > 0
            ? financial
                .recognisedGrossAmount /
              order.subtotal
            : 0;
  
        order.items.forEach(
          (item) => {
            const existingProduct =
              productTotals.get(
                item.name,
              );
  
            const recognisedRevenue =
              roundCurrency(
                item.price *
                  item.quantity *
                  recognisedRatio,
              );
  
            if (existingProduct) {
              productTotals.set(
                item.name,
                {
                  ...existingProduct,
                  quantity:
                    existingProduct.quantity +
                    item.quantity,
                  revenue:
                    roundCurrency(
                      existingProduct.revenue +
                        recognisedRevenue,
                    ),
                },
              );
  
              return;
            }
  
            productTotals.set(
              item.name,
              {
                name: item.name,
                quantity:
                  item.quantity,
                revenue:
                  recognisedRevenue,
              },
            );
          },
        );
      },
    );
  
    const topProducts =
      Array.from(
        productTotals.values(),
      )
        .sort(
          (
            firstProduct,
            secondProduct,
          ) => {
            if (
              secondProduct.quantity !==
              firstProduct.quantity
            ) {
              return (
                secondProduct.quantity -
                firstProduct.quantity
              );
            }
  
            return (
              secondProduct.revenue -
              firstProduct.revenue
            );
          },
        )
        .slice(0, 10);
  
    const totalOrders =
      nonVoidedOrders.length;
  
    return {
      startDate:
        filters.startDate,
  
      endDate:
        filters.endDate,
  
      totalSales:
        roundCurrency(
          totalSales,
        ),
  
      netSales:
        roundCurrency(
          netSales,
        ),
  
      vatCollected:
        roundCurrency(
          vatCollected,
        ),
  
      originalGrossSales:
        roundCurrency(
          originalGrossSales,
        ),
  
      refundedSales:
        roundCurrency(
          refundedSales,
        ),
  
      refundedNetAmount:
        roundCurrency(
          refundedNetAmount,
        ),
  
      vatReversed:
        roundCurrency(
          vatReversed,
        ),
  
      voidedSales:
        roundCurrency(
          voidedSales,
        ),
  
      vatSales:
        roundCurrency(
          vatSales,
        ),
  
      nonVatSales:
        roundCurrency(
          nonVatSales,
        ),
  
      vatOrders:
        vatEntries.length,
  
      nonVatOrders:
        nonVatEntries.length,
  
      totalOrders,
  
      completedOrders:
        completedEntries.length,
  
      partiallyRefundedOrders:
        partiallyRefundedEntries.length,
  
      refundedOrders:
        refundedEntries.length,
  
      voidedOrders:
        voidedEntries.length,
  
      averageOrderValue:
        totalOrders > 0
          ? roundCurrency(
              totalSales /
                totalOrders,
            )
          : 0,
  
      cashSales:
        roundCurrency(
          cashSales,
        ),
  
      cardSales:
        roundCurrency(
          cardSales,
        ),
  
      cashOrders:
        cashEntries.length,
  
      cardOrders:
        cardEntries.length,
  
      takeawayOrders,
      eatInOrders,
      deliveryOrders,
  
      totalItems,
      topProducts,
      filteredOrders,
    };
  }
  