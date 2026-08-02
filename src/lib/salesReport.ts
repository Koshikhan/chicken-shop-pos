import type {
    SavedOrder,
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
  
    // Gross customer-facing sales total.
    totalSales: number;
  
    // Sales before VAT.
    netSales: number;
  
    // VAT included in VAT sales.
    vatCollected: number;
  
    vatSales: number;
    nonVatSales: number;
  
    vatOrders: number;
    nonVatOrders: number;
  
    totalOrders: number;
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
    filteredOrders: SavedOrder[];
  };
  
  export function getLocalDateKey(
    date: Date,
  ) {
    const year = date.getFullYear();
  
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
    const today = new Date();
  
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
    const today = new Date();
  
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
  
  export function calculateSalesSummary(
    orders: SavedOrder[],
    filters: SalesReportFilters,
  ): SalesSummary {
    const filteredOrders =
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
  
    const totalSales =
      filteredOrders.reduce(
        (total, order) =>
          total +
          order.subtotal,
        0,
      );
  
    const netSales =
      filteredOrders.reduce(
        (total, order) =>
          total +
          order.netAmount,
        0,
      );
  
    const vatCollected =
      filteredOrders.reduce(
        (total, order) =>
          total +
          order.vatAmount,
        0,
      );
  
    const vatOrders =
      filteredOrders.filter(
        (order) =>
          order.taxType === "VAT",
      );
  
    const nonVatOrders =
      filteredOrders.filter(
        (order) =>
          order.taxType ===
          "NON_VAT",
      );
  
    const vatSales =
      vatOrders.reduce(
        (total, order) =>
          total +
          order.subtotal,
        0,
      );
  
    const nonVatSales =
      nonVatOrders.reduce(
        (total, order) =>
          total +
          order.subtotal,
        0,
      );
  
    const cashOrders =
      filteredOrders.filter(
        (order) =>
          order.paymentMethod ===
          "Cash",
      );
  
    const cardOrders =
      filteredOrders.filter(
        (order) =>
          order.paymentMethod ===
          "Card",
      );
  
    const cashSales =
      cashOrders.reduce(
        (total, order) =>
          total +
          order.subtotal,
        0,
      );
  
    const cardSales =
      cardOrders.reduce(
        (total, order) =>
          total +
          order.subtotal,
        0,
      );
  
    const takeawayOrders =
      filteredOrders.filter(
        (order) =>
          order.orderType ===
          "Takeaway",
      ).length;
  
    const eatInOrders =
      filteredOrders.filter(
        (order) =>
          order.orderType ===
          "Eat In",
      ).length;
  
    const deliveryOrders =
      filteredOrders.filter(
        (order) =>
          order.orderType ===
          "Delivery",
      ).length;
  
    const totalItems =
      filteredOrders.reduce(
        (total, order) =>
          total +
          order.itemCount,
        0,
      );
  
    const productTotals =
      new Map<
        string,
        ProductSales
      >();
  
    filteredOrders.forEach(
      (order) => {
        order.items.forEach(
          (item) => {
            const existingProduct =
              productTotals.get(
                item.name,
              );
  
            const itemRevenue =
              item.price *
              item.quantity;
  
            if (existingProduct) {
              productTotals.set(
                item.name,
                {
                  ...existingProduct,
                  quantity:
                    existingProduct.quantity +
                    item.quantity,
                  revenue:
                    existingProduct.revenue +
                    itemRevenue,
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
                  itemRevenue,
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
  
    return {
      startDate:
        filters.startDate,
      endDate:
        filters.endDate,
  
      totalSales,
      netSales,
      vatCollected,
  
      vatSales,
      nonVatSales,
  
      vatOrders:
        vatOrders.length,
      nonVatOrders:
        nonVatOrders.length,
  
      totalOrders:
        filteredOrders.length,
  
      averageOrderValue:
        filteredOrders.length > 0
          ? totalSales /
            filteredOrders.length
          : 0,
  
      cashSales,
      cardSales,
  
      cashOrders:
        cashOrders.length,
      cardOrders:
        cardOrders.length,
  
      takeawayOrders,
      eatInOrders,
      deliveryOrders,
  
      totalItems,
      topProducts,
      filteredOrders,
    };
  }
  