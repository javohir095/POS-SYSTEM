import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import {
  DbProduct, DbCategory, DbSupplier, DbUser,
  DbCustomer, DbSale, DbPurchase, DbExpense, DbSettings
} from '../lib/supabase';

export type Page =
  | 'dashboard' | 'pos' | 'inventory' | 'sales'
  | 'customers' | 'expenses' | 'purchases' | 'reports'
  | 'settings' | 'users';

interface AppState {
  currentUser: DbUser | null;
  currentPage: Page;
  loading: boolean;
  products: DbProduct[];
  categories: DbCategory[];
  suppliers: DbSupplier[];
  users: DbUser[];
  customers: DbCustomer[];
  sales: DbSale[];
  purchases: DbPurchase[];
  expenses: DbExpense[];
  settings: DbSettings | null;
  sidebarOpen: boolean;
}

type Action =
  | { type: 'SET_USER'; user: DbUser | null }
  | { type: 'SET_PAGE'; page: Page }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_PRODUCTS'; data: DbProduct[] }
  | { type: 'SET_CATEGORIES'; data: DbCategory[] }
  | { type: 'SET_SUPPLIERS'; data: DbSupplier[] }
  | { type: 'SET_USERS'; data: DbUser[] }
  | { type: 'SET_CUSTOMERS'; data: DbCustomer[] }
  | { type: 'SET_SALES'; data: DbSale[] }
  | { type: 'SET_PURCHASES'; data: DbPurchase[] }
  | { type: 'SET_EXPENSES'; data: DbExpense[] }
  | { type: 'SET_SETTINGS'; data: DbSettings }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'ADD_PRODUCT'; product: DbProduct }
  | { type: 'UPDATE_PRODUCT'; product: DbProduct }
  | { type: 'REMOVE_PRODUCT'; id: string }
  | { type: 'ADD_SALE'; sale: DbSale }
  | { type: 'UPDATE_STOCK'; productId: string; qty: number }
  | { type: 'ADD_CUSTOMER'; customer: DbCustomer }
  | { type: 'UPDATE_CUSTOMER'; customer: DbCustomer }
  | { type: 'ADD_PURCHASE'; purchase: DbPurchase }
  | { type: 'ADD_EXPENSE'; expense: DbExpense }
  | { type: 'REMOVE_EXPENSE'; id: string }
  | { type: 'ADD_USER'; user: DbUser }
  | { type: 'UPDATE_USER'; user: DbUser }
  | { type: 'ADD_CATEGORY'; category: DbCategory }
  | { type: 'ADD_SUPPLIER'; supplier: DbSupplier };

function reducer(s: AppState, a: Action): AppState {
  switch (a.type) {
    case 'SET_USER':
      // localStorage da saqlash — refresh da yo'qolmasin
      if (a.user) localStorage.setItem('pos_user', JSON.stringify(a.user));
      else localStorage.removeItem('pos_user');
      return { ...s, currentUser: a.user };
    case 'SET_PAGE':
      localStorage.setItem('pos_page', a.page);
      return { ...s, currentPage: a.page };
    case 'SET_LOADING': return { ...s, loading: a.loading };
    case 'SET_PRODUCTS': return { ...s, products: a.data };
    case 'SET_CATEGORIES': return { ...s, categories: a.data };
    case 'SET_SUPPLIERS': return { ...s, suppliers: a.data };
    case 'SET_USERS': return { ...s, users: a.data };
    case 'SET_CUSTOMERS': return { ...s, customers: a.data };
    case 'SET_SALES': return { ...s, sales: a.data };
    case 'SET_PURCHASES': return { ...s, purchases: a.data };
    case 'SET_EXPENSES': return { ...s, expenses: a.data };
    case 'SET_SETTINGS': return { ...s, settings: a.data };
    case 'TOGGLE_SIDEBAR': return { ...s, sidebarOpen: !s.sidebarOpen };
    case 'ADD_PRODUCT': return { ...s, products: [a.product, ...s.products] };
    case 'UPDATE_PRODUCT': return { ...s, products: s.products.map(p => p.id === a.product.id ? a.product : p) };
    case 'REMOVE_PRODUCT': return { ...s, products: s.products.filter(p => p.id !== a.id) };
    case 'ADD_SALE': return { ...s, sales: [a.sale, ...s.sales] };
    case 'UPDATE_STOCK':
      return {
        ...s,
        products: s.products.map(p =>
          p.id === a.productId ? { ...p, quantity: Math.max(0, p.quantity - a.qty) } : p
        ),
      };
    case 'ADD_CUSTOMER': return { ...s, customers: [...s.customers, a.customer] };
    case 'UPDATE_CUSTOMER': return { ...s, customers: s.customers.map(c => c.id === a.customer.id ? a.customer : c) };
    case 'ADD_PURCHASE':
      return {
        ...s,
        purchases: [a.purchase, ...s.purchases],
        products: s.products.map(p =>
          p.id === a.purchase.product_id ? { ...p, quantity: p.quantity + a.purchase.quantity } : p
        ),
      };
    case 'ADD_EXPENSE': return { ...s, expenses: [a.expense, ...s.expenses] };
    case 'REMOVE_EXPENSE': return { ...s, expenses: s.expenses.filter(e => e.id !== a.id) };
    case 'ADD_USER': return { ...s, users: [...s.users, a.user] };
    case 'UPDATE_USER': return { ...s, users: s.users.map(u => u.id === a.user.id ? a.user : u) };
    case 'ADD_CATEGORY': return { ...s, categories: [...s.categories, a.category] };
    case 'ADD_SUPPLIER': return { ...s, suppliers: [...s.suppliers, a.supplier] };
    default: return s;
  }
}

// localStorage dan user va page ni tiklash
function getSavedUser(): DbUser | null {
  try {
    const raw = localStorage.getItem('pos_user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function getSavedPage(): Page {
  const p = localStorage.getItem('pos_page') as Page | null;
  const valid: Page[] = ['dashboard','pos','inventory','sales','customers','expenses','purchases','reports','settings','users'];
  return p && valid.includes(p) ? p : 'dashboard';
}

const savedUser = getSavedUser();

const initState: AppState = {
  currentUser: savedUser,
  currentPage: savedUser
    ? (savedUser.role === 'cashier' ? 'pos' : getSavedPage())
    : 'dashboard',
  loading: false,
  products: [], categories: [], suppliers: [], users: [],
  customers: [], sales: [], purchases: [], expenses: [],
  settings: null, sidebarOpen: true,
};

const Ctx = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
  reload: (table: string) => Promise<void>;
} | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initState);

  const reload = useCallback(async (table: string) => {
    try {
      if (table === 'products') dispatch({ type: 'SET_PRODUCTS', data: await api.getProducts() });
      else if (table === 'categories') dispatch({ type: 'SET_CATEGORIES', data: await api.getCategories() });
      else if (table === 'suppliers') dispatch({ type: 'SET_SUPPLIERS', data: await api.getSuppliers() });
      else if (table === 'users') dispatch({ type: 'SET_USERS', data: await api.getUsers() });
      else if (table === 'customers') dispatch({ type: 'SET_CUSTOMERS', data: await api.getCustomers() });
      else if (table === 'sales') dispatch({ type: 'SET_SALES', data: await api.getSales() });
      else if (table === 'purchases') dispatch({ type: 'SET_PURCHASES', data: await api.getPurchases() });
      else if (table === 'expenses') dispatch({ type: 'SET_EXPENSES', data: await api.getExpenses() });
    } catch (e) { console.error('reload error', e); }
  }, []);

  // Ma'lumotlarni yuklash (foydalanuvchi kirgan bo'lsa ham yuklasin)
  useEffect(() => {
    const loadAll = async () => {
      dispatch({ type: 'SET_LOADING', loading: true });
      try {
        const [products, categories, suppliers, users, customers, sales, purchases, expenses, settings] =
          await Promise.all([
            api.getProducts(), api.getCategories(), api.getSuppliers(),
            api.getUsers(), api.getCustomers(), api.getSales(),
            api.getPurchases(), api.getExpenses(), api.getSettings(),
          ]);
        dispatch({ type: 'SET_PRODUCTS', data: products });
        dispatch({ type: 'SET_CATEGORIES', data: categories });
        dispatch({ type: 'SET_SUPPLIERS', data: suppliers });
        dispatch({ type: 'SET_USERS', data: users });
        dispatch({ type: 'SET_CUSTOMERS', data: customers });
        dispatch({ type: 'SET_SALES', data: sales });
        dispatch({ type: 'SET_PURCHASES', data: purchases });
        dispatch({ type: 'SET_EXPENSES', data: expenses });
        if (settings) dispatch({ type: 'SET_SETTINGS', data: settings });
      } catch (e) {
        console.error('Initial load error:', e);
      }
      dispatch({ type: 'SET_LOADING', loading: false });
    };
    loadAll();
  }, []);

  return <Ctx.Provider value={{ state, dispatch, reload }}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
