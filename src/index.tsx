import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider, useApp } from './store/AppContext';
import { ToastProvider } from './components/ui/Toast';
import LoginPage from './components/auth/LoginPage';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
import POSScreen from './components/pos/POSScreen';
import Inventory from './components/inventory/Inventory';
import { SalesHistory, Customers, Expenses, Purchases, Reports, Settings, Users } from './pages';

function AppContent() {
  const { state } = useApp();

  if (!state.currentUser) return <LoginPage />;

  const page = (() => {
    switch (state.currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'pos': return <POSScreen />;
      case 'inventory': return <Inventory />;
      case 'sales': return <SalesHistory />;
      case 'customers': return <Customers />;
      case 'expenses': return <Expenses />;
      case 'purchases': return <Purchases />;
      case 'reports': return <Reports />;
      case 'settings': return <Settings />;
      case 'users': return <Users />;
      default: return <Dashboard />;
    }
  })();

  return <Layout>{page}</Layout>;
}

function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AppProvider>
  );
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
