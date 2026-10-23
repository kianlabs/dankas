// Tipe baris tabel Supabase (sesuai supabase/schema.sql).

export type Role = "pemilik" | "admin" | "kasir";

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: Role;
  is_active: boolean;
}

export interface Category {
  id: number;
  name: string;
  type: "produk" | "pemasukan" | "pengeluaran";
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  category_id: number | null;
  size: string | null;
  color: string | null;
  cost_price: number;
  sale_price: number;
  stock: number;
  min_stock: number;
}

export interface Sale {
  id: number;
  invoice_no: string;
  customer_name: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  grand_total: number;
  payment_method: string;
  amount_paid: number;
  change_amount: number;
  status: string;
  sale_date: string;
  created_at: string;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number | null;
  qty: number;
  cost_price: number;
  sale_price: number;
  discount: number;
  subtotal: number;
}

export interface Expense {
  id: number;
  category_id: number | null;
  title: string;
  amount: number;
  expense_date: string;
  payment_method: string;
  notes: string | null;
}

export interface CashLedgerEntry {
  id: number;
  ref_type: string;
  ref_id: number | null;
  type: "in" | "out";
  amount: number;
  balance_after: number;
  description: string;
  transaction_date: string;
  created_at: string;
}

export const PAYMENT_METHODS = ["Tunai", "QRIS", "Transfer", "E-Wallet"] as const;
