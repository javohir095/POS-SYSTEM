import React, { useState } from 'react';
import { useApp } from '../../store/AppContext';
import { useToast } from '../ui/Toast';
import { Page } from '../../store/AppContext';


interface NavItem { icon: string; label: string; page: Page; roles: ('admin' | 'cashier')[]; }

const NAV: NavItem[] = [
  { icon: 'fa-gauge-high', label: 'Dashboard', page: 'dashboard', roles: ['admin'] },
  { icon: 'fa-cash-register', label: 'Kassa (POS)', page: 'pos', roles: ['admin', 'cashier'] },
  { icon: 'fa-boxes-stacked', label: 'Mahsulotlar', page: 'inventory', roles: ['admin'] },
  { icon: 'fa-truck-ramp-box', label: 'Kirim', page: 'purchases', roles: ['admin'] },
  { icon: 'fa-receipt', label: 'Sotuvlar', page: 'sales', roles: ['admin'] },
  { icon: 'fa-users', label: 'Mijozlar', page: 'customers', roles: ['admin'] },
  { icon: 'fa-wallet', label: 'Xarajatlar', page: 'expenses', roles: ['admin'] },
  { icon: 'fa-chart-bar', label: 'Hisobotlar', page: 'reports', roles: ['admin'] },
  { icon: 'fa-user-gear', label: 'Foydalanuvchilar', page: 'users', roles: ['admin'] },
  { icon: 'fa-gear', label: 'Sozlamalar', page: 'settings', roles: ['admin'] },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { state, dispatch } = useApp();
  const { info } = useToast();
  const [collapsed, setCollapsed] = useState(false);

  const lowStock = state.products.filter(p => p.quantity > 0 && p.quantity <= 10).length;
  const outStock = state.products.filter(p => p.quantity === 0).length;
  const alertCount = lowStock + outStock;

  const visibleNav = NAV.filter(n => n.roles.includes(state.currentUser!.role));

  const handleLogout = () => {
    info('Chiqildi', 'Tizimdan muvaffaqiyatli chiqdingiz');
    setTimeout(() => dispatch({ type: 'SET_USER', user: null }), 300);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc', overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 64 : 230, flexShrink: 0, background: '#fff',
        borderRight: '1.5px solid #f1f5f9', display: 'flex', flexDirection: 'column',
        transition: 'width 0.2s ease', overflow: 'hidden', position: 'relative', zIndex: 20,
      }}>
        {/* Logo */}
        <div style={{ height: 60, padding: collapsed ? '0 16px' : '0 18px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1.5px solid #f1f5f9', flexShrink: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(99,102,241,0.35)' }}>
            <i className="fas fa-cash-register" style={{ color: 'white', fontSize: 14 }} />
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', letterSpacing: '-0.2px' }}>{state.settings?.store_name || "Firdavs Emerald MCHJ"}</p>
              <p style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>Firdavs Emerald MCHJ v2</p>
            </div>
          )}
        </div>

        {/* User pill */}
        {!collapsed && (
          <div style={{ margin: '12px 12px 4px', padding: '10px 12px', background: '#f8fafc', borderRadius: 10, border: '1.5px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: state.currentUser!.role === 'admin' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'white', flexShrink: 0 }}>
                {state.currentUser!.name.charAt(0)}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{state.currentUser!.name}</p>
                <p style={{ fontSize: 11, color: '#94a3b8' }}>{state.currentUser!.role === 'admin' ? 'Administrator' : 'Kassir'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
          {visibleNav.map(item => {
            const active = state.currentPage === item.page;
            const hasAlert = item.page === 'inventory' && alertCount > 0;
            return (
              <button key={item.page} onClick={() => dispatch({ type: 'SET_PAGE', page: item.page })}
                title={collapsed ? item.label : undefined}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: collapsed ? '10px' : '9px 12px', borderRadius: 9, border: 'none',
                  cursor: 'pointer', marginBottom: 2, textAlign: 'left', justifyContent: collapsed ? 'center' : 'flex-start',
                  background: active ? 'linear-gradient(135deg, #ede9fe, #f5f3ff)' : 'transparent',
                  color: active ? '#6366f1' : '#64748b',
                  fontWeight: active ? 700 : 500, fontSize: 13.5,
                  transition: 'all 0.12s', position: 'relative',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                {active && <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 18, background: '#6366f1', borderRadius: '0 3px 3px 0' }} />}
                <i className={`fas ${item.icon}`} style={{ fontSize: 15, width: 18, textAlign: 'center', flexShrink: 0 }} />
                {!collapsed && <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>}
                {!collapsed && hasAlert && <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 99, background: '#fee2e2', color: '#dc2626', flexShrink: 0 }}>{alertCount}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '8px', borderTop: '1.5px solid #f1f5f9', flexShrink: 0 }}>
          <button onClick={handleLogout} title={collapsed ? 'Chiqish' : undefined}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: collapsed ? '10px' : '9px 12px', borderRadius: 9, border: 'none', cursor: 'pointer', justifyContent: collapsed ? 'center' : 'flex-start', background: 'transparent', color: '#ef4444', fontWeight: 500, fontSize: 13.5, transition: 'background 0.12s' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <i className="fas fa-right-from-bracket" style={{ fontSize: 15, width: 18, textAlign: 'center' }} />
            {!collapsed && <span>Chiqish</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Topbar */}
        <header style={{ height: 60, background: '#fff', borderBottom: '1.5px solid #f1f5f9', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12, flexShrink: 0, zIndex: 10 }}>
          <button onClick={() => setCollapsed(p => !p)} style={{ width: 34, height: 34, borderRadius: 9, background: '#f8fafc', border: '1.5px solid #f1f5f9', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, transition: 'all 0.15s', flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
            onMouseLeave={e => (e.currentTarget.style.background = '#f8fafc')}
          >
            <i className="fas fa-bars" />
          </button>

          {/* Breadcrumb */}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
              {NAV.find(n => n.page === state.currentPage)?.label || 'Dashboard'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Alert bell */}
            {alertCount > 0 && state.currentUser?.role === 'admin' && (
              <button onClick={() => dispatch({ type: 'SET_PAGE', page: 'inventory' })} style={{ width: 34, height: 34, borderRadius: 9, background: '#fef2f2', border: '1.5px solid #fecaca', cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, position: 'relative' }}>
                <i className="fas fa-bell" />
                <span style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: '#dc2626', color: 'white', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{alertCount}</span>
              </button>
            )}

            {/* Date */}
            <div style={{ padding: '5px 12px', background: '#f8fafc', border: '1.5px solid #f1f5f9', borderRadius: 9, fontSize: 12, color: '#64748b', fontWeight: 500 }}>
              <i className="fas fa-calendar-days" style={{ marginRight: 6, fontSize: 11 }} />
              {new Date().toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </header>

        {/* Page */}
        <main style={{ flex: 1, overflow: 'auto', padding: state.currentPage === 'pos' ? 0 : '24px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
