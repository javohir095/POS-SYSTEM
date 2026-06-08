import { supabase, DbProduct, DbCategory, DbSupplier, DbUser, DbCustomer, DbSale, DbSaleItem, DbPurchase, DbExpense, DbSettings, DbDebtPayment } from './supabase';

// ─── PRODUCTS ──────────────────────────────────────────────────
export const api = {

  // PRODUCTS
  async getProducts(): Promise<DbProduct[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name), suppliers(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async addProduct(p: Omit<DbProduct, 'id' | 'created_at' | 'categories' | 'suppliers'>): Promise<DbProduct> {
    const { data, error } = await supabase.from('products').insert(p).select('*, categories(name), suppliers(name)').single();
    if (error) throw error;
    return data;
  },

  async updateProduct(id: string, p: Partial<DbProduct>): Promise<DbProduct> {
    const { categories, suppliers, created_at, ...rest } = p as any;
    const { data, error } = await supabase.from('products').update(rest).eq('id', id).select('*, categories(name), suppliers(name)').single();
    if (error) throw error;
    return data;
  },

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  },

  async updateStock(id: string, quantityDelta: number): Promise<void> {
    const { data: prod } = await supabase.from('products').select('quantity').eq('id', id).single();
    if (!prod) return;
    const newQty = Math.max(0, prod.quantity - quantityDelta);
    await supabase.from('products').update({ quantity: newQty }).eq('id', id);
  },

  async addStockQuantity(id: string, quantity: number): Promise<void> {
    const { data: prod } = await supabase.from('products').select('quantity').eq('id', id).single();
    if (!prod) return;
    await supabase.from('products').update({ quantity: prod.quantity + quantity }).eq('id', id);
  },

  // CATEGORIES
  async getCategories(): Promise<DbCategory[]> {
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (error) throw error;
    return data || [];
  },

  async addCategory(name: string): Promise<DbCategory> {
    const { data, error } = await supabase.from('categories').insert({ name }).select().single();
    if (error) throw error;
    return data;
  },

  // SUPPLIERS
  async getSuppliers(): Promise<DbSupplier[]> {
    const { data, error } = await supabase.from('suppliers').select('*').order('name');
    if (error) throw error;
    return data || [];
  },

  async addSupplier(s: Omit<DbSupplier, 'id' | 'created_at'>): Promise<DbSupplier> {
    const { data, error } = await supabase.from('suppliers').insert(s).select().single();
    if (error) throw error;
    return data;
  },

  // USERS
  async getUsers(): Promise<DbUser[]> {
    const { data, error } = await supabase.from('users').select('*').order('created_at');
    if (error) throw error;
    return data || [];
  },

  async loginUser(username: string, password: string): Promise<DbUser | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .eq('active', true)
      .single();
    if (error) return null;
    return data;
  },

  async addUser(u: Omit<DbUser, 'id' | 'created_at'>): Promise<DbUser> {
    const { data, error } = await supabase.from('users').insert(u).select().single();
    if (error) throw error;
    return data;
  },

  async updateUser(id: string, u: Partial<DbUser>): Promise<void> {
    const { error } = await supabase.from('users').update(u).eq('id', id);
    if (error) throw error;
  },

  // CUSTOMERS
  async getCustomers(): Promise<DbCustomer[]> {
    const { data, error } = await supabase.from('customers').select('*').order('name');
    if (error) throw error;
    return data || [];
  },

  async addCustomer(c: Omit<DbCustomer, 'id' | 'created_at'>): Promise<DbCustomer> {
    const { data, error } = await supabase.from('customers').insert(c).select().single();
    if (error) throw error;
    return data;
  },

  async updateCustomer(id: string, c: Partial<DbCustomer>): Promise<void> {
    const { error } = await supabase.from('customers').update(c).eq('id', id);
    if (error) throw error;
  },

  async addDebtPayment(p: Omit<DbDebtPayment, 'id' | 'created_at'>, newDebt: number): Promise<void> {
    await supabase.from('debt_payments').insert(p);
    await supabase.from('customers').update({ total_debt: newDebt }).eq('id', p.customer_id);
  },

  // SALES
  async getSales(): Promise<DbSale[]> {
    const { data, error } = await supabase
      .from('sales')
      .select('*, sale_items(*)')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) throw error;
    return data || [];
  },

  async addSale(sale: Omit<DbSale, 'id' | 'created_at' | 'sale_items'>, items: Omit<DbSaleItem, 'id' | 'created_at' | 'sale_id'>[]): Promise<DbSale> {
    const { data: saleData, error: saleErr } = await supabase.from('sales').insert(sale).select().single();
    if (saleErr) throw saleErr;
    const saleItems = items.map(i => ({ ...i, sale_id: saleData.id }));
    await supabase.from('sale_items').insert(saleItems);
    // Update stock
    for (const item of items) {
      if (item.product_id) await api.updateStock(item.product_id, item.quantity);
    }
    return { ...saleData, sale_items: saleItems as DbSaleItem[] };
  },

  // PURCHASES
  async getPurchases(): Promise<DbPurchase[]> {
    const { data, error } = await supabase.from('purchases').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async addPurchase(p: Omit<DbPurchase, 'id' | 'created_at'>): Promise<DbPurchase> {
    const { data, error } = await supabase.from('purchases').insert(p).select().single();
    if (error) throw error;
    if (p.product_id) await api.addStockQuantity(p.product_id, p.quantity);
    return data;
  },

  // EXPENSES
  async getExpenses(): Promise<DbExpense[]> {
    const { data, error } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async addExpense(e: Omit<DbExpense, 'id' | 'created_at'>): Promise<DbExpense> {
    const { data, error } = await supabase.from('expenses').insert(e).select().single();
    if (error) throw error;
    return data;
  },

  async deleteExpense(id: string): Promise<void> {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw error;
  },

  // SETTINGS
  async getSettings(): Promise<DbSettings | null> {
    const { data } = await supabase.from('settings').select('*').single();
    return data;
  },

  async updateSettings(s: Partial<DbSettings>): Promise<void> {
    const { data: existing } = await supabase.from('settings').select('id').single();
    if (existing) {
      await supabase.from('settings').update({ ...s, updated_at: new Date().toISOString() }).eq('id', existing.id);
    } else {
      await supabase.from('settings').insert(s);
    }
  },
};
