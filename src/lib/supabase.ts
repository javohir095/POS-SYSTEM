import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sdonbgvvrhswwjgmfagb.supabase.co';
const SUPABASE_KEY = 'sb_publishable_PKABhgyp0YtP5pQKeOue9Q_qXSbOkrA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── TYPE-SAFE DB HELPERS ──────────────────────────────────────

export type DbProduct = {
  id: string; name: string; barcode: string;
  category_id: string | null; supplier_id: string | null;
  purchase_price: number; selling_price: number;
  quantity: number; unit: string; image_url: string;
  created_at: string;
  categories?: { name: string } | null;
  suppliers?: { name: string } | null;
};

export type DbCategory = { id: string; name: string; created_at: string };
export type DbSupplier = { id: string; name: string; phone: string; address: string; created_at: string };
export type DbUser = { id: string; name: string; username: string; password: string; role: 'admin' | 'cashier'; active: boolean; created_at: string };
export type DbCustomer = { id: string; name: string; phone: string; address: string; total_debt: number; created_at: string };
export type DbSale = {
  id: string; cashier_id: string; cashier_name: string;
  customer_id: string | null; customer_name: string;
  subtotal: number; discount: number; total: number;
  payment_method: 'cash' | 'card' | 'debt'; is_debt: boolean;
  created_at: string;
  sale_items?: DbSaleItem[];
};
export type DbSaleItem = {
  id: string; sale_id: string; product_id: string | null;
  product_name: string; barcode: string; quantity: number; unit: string;
  purchase_price: number; selling_price: number; discount: number; total: number;
  created_at: string;
};
export type DbPurchase = {
  id: string; product_id: string | null; product_name: string;
  supplier_id: string | null; supplier_name: string;
  quantity: number; purchase_price: number; total: number;
  invoice_number: string; created_at: string;
};
export type DbExpense = { id: string; category: string; amount: number; description: string; created_at: string };
export type DbSettings = { id: string; store_name: string; address: string; phone: string; receipt_footer: string; updated_at: string };
export type DbDebtPayment = { id: string; customer_id: string; amount: number; note: string; created_at: string };
