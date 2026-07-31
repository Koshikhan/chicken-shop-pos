export const menuCategories = [
    "Meals",
    "Chicken",
    "Burgers",
    "Wraps",
    "Sides",
    "Drinks",
  ] as const;
  
  export type Category =
    (typeof menuCategories)[number];
  
  export type Product = {
    id: number;
    name: string;
    description: string;
    category: Category;
    price: number;
    emoji: string;
    available: boolean;
  };
  
  export const DEFAULT_PRODUCTS: Product[] = [
    {
      id: 1,
      name: "2 Piece Chicken Meal",
      description: "2 chicken pieces, fries and drink",
      category: "Meals",
      price: 8.99,
      emoji: "🍗",
      available: true,
    },
    {
      id: 2,
      name: "Spicy Burger Meal",
      description: "Spicy burger, fries and drink",
      category: "Meals",
      price: 9.49,
      emoji: "🍔",
      available: true,
    },
    {
      id: 3,
      name: "Family Bucket",
      description: "10 chicken pieces and 4 fries",
      category: "Meals",
      price: 24.99,
      emoji: "🪣",
      available: true,
    },
    {
      id: 4,
      name: "Chicken Piece",
      description: "Original fried chicken",
      category: "Chicken",
      price: 2.49,
      emoji: "🍗",
      available: true,
    },
    {
      id: 5,
      name: "6 Hot Wings",
      description: "Six spicy chicken wings",
      category: "Chicken",
      price: 5.99,
      emoji: "🔥",
      available: true,
    },
    {
      id: 6,
      name: "12 Hot Wings",
      description: "Twelve spicy chicken wings",
      category: "Chicken",
      price: 10.49,
      emoji: "🔥",
      available: true,
    },
    {
      id: 7,
      name: "Classic Chicken Burger",
      description: "Chicken fillet, lettuce and mayo",
      category: "Burgers",
      price: 5.99,
      emoji: "🍔",
      available: true,
    },
    {
      id: 8,
      name: "Spicy Tower Burger",
      description: "Spicy fillet, hash brown and cheese",
      category: "Burgers",
      price: 7.49,
      emoji: "🍔",
      available: true,
    },
    {
      id: 9,
      name: "Chicken Wrap",
      description: "Chicken strips, salad and sauce",
      category: "Wraps",
      price: 5.49,
      emoji: "🌯",
      available: true,
    },
    {
      id: 10,
      name: "Regular Fries",
      description: "Crispy seasoned fries",
      category: "Sides",
      price: 2.49,
      emoji: "🍟",
      available: true,
    },
    {
      id: 11,
      name: "Coleslaw",
      description: "Fresh creamy coleslaw",
      category: "Sides",
      price: 1.99,
      emoji: "🥗",
      available: true,
    },
    {
      id: 12,
      name: "Pepsi",
      description: "330ml canned drink",
      category: "Drinks",
      price: 1.79,
      emoji: "🥤",
      available: true,
    },
    {
      id: 13,
      name: "Water",
      description: "500ml bottled water",
      category: "Drinks",
      price: 1.29,
      emoji: "💧",
      available: false,
    },
  ];
  
  const MENU_STORAGE_KEY =
    "chicken-shop-pos-menu";
  
  function isProduct(value: unknown): value is Product {
    if (
      typeof value !== "object" ||
      value === null
    ) {
      return false;
    }
  
    const product = value as Partial<Product>;
  
    return (
      typeof product.id === "number" &&
      typeof product.name === "string" &&
      typeof product.description === "string" &&
      typeof product.price === "number" &&
      typeof product.emoji === "string" &&
      typeof product.available === "boolean" &&
      menuCategories.includes(
        product.category as Category,
      )
    );
  }
  
  export function loadMenu(): Product[] {
    if (typeof window === "undefined") {
      return DEFAULT_PRODUCTS;
    }
  
    try {
      const storedMenu =
        window.localStorage.getItem(
          MENU_STORAGE_KEY,
        );
  
      if (!storedMenu) {
        return DEFAULT_PRODUCTS;
      }
  
      const parsedMenu: unknown =
        JSON.parse(storedMenu);
  
      if (
        !Array.isArray(parsedMenu) ||
        !parsedMenu.every(isProduct)
      ) {
        return DEFAULT_PRODUCTS;
      }
  
      return parsedMenu;
    } catch (error) {
      console.error(
        "Unable to load menu:",
        error,
      );
  
      return DEFAULT_PRODUCTS;
    }
  }
  
  export function saveMenu(
    products: Product[],
  ) {
    if (typeof window === "undefined") {
      return;
    }
  
    try {
      window.localStorage.setItem(
        MENU_STORAGE_KEY,
        JSON.stringify(products),
      );
    } catch (error) {
      console.error(
        "Unable to save menu:",
        error,
      );
    }
  }
  
  export function createProductId() {
    return Date.now();
  }