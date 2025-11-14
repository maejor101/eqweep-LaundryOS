export type PaymentMethod = "cash" | "card" | "on_collection";

export interface CashPayment {
  notes: Record<string, number>; // denomination -> quantity
  coins: Record<string, number>; // denomination -> quantity
  totalPaid: number;
  change: number;
}

export interface CustomerDetails {
  name: string;
  phone: string;
  email: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string;
  customer: CustomerDetails;
  items: OrderItem[];
  total: number;
  paymentMethod: PaymentMethod;
  cashPaymentDetails?: CashPayment;
  isExpress: boolean;
  status: "To-Do" | "Washers" | "Waiting" | "Dryers" | "Completed" | "Ready" | "Picked-Up";
  createdAt: string;
  completedAt?: string;
  pickedUpAt?: string;
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  card: "Card",
  on_collection: "On Collection"
};

export const PAYMENT_METHOD_COLORS: Record<PaymentMethod, string> = {
  cash: "text-green-600",
  card: "text-blue-600",
  on_collection: "text-orange-600"
};