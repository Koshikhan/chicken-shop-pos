import type {
    Category,
    Product,
  } from "@/lib/menuStorage";
  
  import type {
    TaxType,
  } from "@/lib/tax";
  
  export type SelectedCategory =
    | "All"
    | Category;
  
  export type OrderType =
    | "Takeaway"
    | "Eat In"
    | "Delivery";
  
  export type PosTemplateProps = {
    categories: SelectedCategory[];
    selectedCategory: SelectedCategory;
    onSelectedCategoryChange: (
      category: SelectedCategory,
    ) => void;
    products: Product[];
    productSearch: string;
    onProductSearchChange: (
      value: string,
    ) => void;
    orderType: OrderType;
    onOrderTypeChange: (
      value: OrderType,
    ) => void;
    taxType: TaxType;
    onTaxTypeChange: (
      value: TaxType,
    ) => void;
    onAddProduct: (
      product: Product,
    ) => void;
  };
  