// Define the structure of an individual item in a saved order
export type SavedOrderItem = {
    id: number; // Unique identifier for the item
    name: string; // Name of the item
    price: number; // Price of the item
    quantity: number; // Quantity of the item in the order
  };
  
  // Define the structure of a saved order
  export type SavedOrder = {
    id: string; // Unique identifier for the order
    orderNumber: string; // Display order number (e.g., "A001")
    orderType: "Takeaway" | "Eat In" | "Delivery"; // Type of order
    items: SavedOrderItem[]; // List of items in the order
    itemCount: number; // Total number of items in the order
    subtotal: number; // Total cost of the order
    paymentMethod: "Cash" | "Card"; // Payment method used
    amountReceived: number; // Amount received from the customer
    change: number; // Change given to the customer
    status: "Completed"; // Status of the order (currently only "Completed")
    createdAt: string; // Timestamp of when the order was created
  };
  
  // Key used to store orders in localStorage
  const ORDER_STORAGE_KEY = "chicken-shop-pos-orders";
  
  // Function to load saved orders from localStorage
  export function loadOrders(): SavedOrder[] {
    if (typeof window === "undefined") {
      // Return an empty array if running in a non-browser environment
      return [];
    }
  
    try {
      // Retrieve orders from localStorage
      const storedOrders = window.localStorage.getItem(ORDER_STORAGE_KEY);
  
      if (!storedOrders) {
        // Return an empty array if no orders are found
        return [];
      }
  
      // Parse the stored orders from JSON
      const parsedOrders = JSON.parse(storedOrders);
  
      // Ensure the parsed data is an array
      if (!Array.isArray(parsedOrders)) {
        return [];
      }
  
      return parsedOrders; // Return the parsed orders
    } catch (error) {
      // Log an error if something goes wrong during loading
      console.error("Unable to load orders:", error);
      return [];
    }
  }
  
  // Function to save orders to localStorage
  export function saveOrders(orders: SavedOrder[]) {
    if (typeof window === "undefined") {
      // Do nothing if running in a non-browser environment
      return;
    }
  
    try {
      // Save the orders as a JSON string in localStorage
      window.localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders));
    } catch (error) {
      // Log an error if something goes wrong during saving
      console.error("Unable to save orders:", error);
    }
  }
  
  // Function to add a new order to the saved orders
  export function addOrder(order: SavedOrder) {
    // Load the current orders from localStorage
    const currentOrders = loadOrders();
  
    // Add the new order to the beginning of the orders array
    const updatedOrders = [order, ...currentOrders];
  
    // Save the updated orders back to localStorage
    saveOrders(updatedOrders);
  
    return updatedOrders; // Return the updated orders
  }
  
  // Function to create a unique order ID
  export function createOrderId() {
    // Generate a unique ID using the current timestamp and a random string
    return `order-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }