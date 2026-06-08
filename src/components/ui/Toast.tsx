import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  toast: (type: ToastType, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const icons: Record<ToastType, string> = {
  success: 'fa-circle-check',
  error: 'fa-circle-xmark',
  warning: 'fa-triangle-exclamation',
  info: 'fa-circle-info',
};

const colors: Record<ToastType, { bg: string; border: string; icon: string; progress: string }> = {
  success: { bg: '#f0fdf4', border: '#bbf7d0', icon: '#16a34a', progress: '#16a34a' },
  error: { bg: '#fef2f2', border: '#fecaca', icon: '#dc2626', progress: '#dc2626' },
  warning: { bg: '#fffbeb', border: '#fde68a', icon: '#d97706', progress: '#d97706' },
  info: { bg: '#eff6ff', border: '#bfdbfe', icon: '#2563eb', progress: '#2563eb' },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const c = colors[toast.type];

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setLeaving(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, 3800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      onClick={() => { setLeaving(true); setTimeout(() => onRemove(toast.id), 300); }}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        background: c.bg, border: `1px solid ${c.border}`,
        borderRadius: 12, padding: '14px 16px', minWidth: 300, maxWidth: 380,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
        cursor: 'pointer', position: 'relative', overflow: 'hidden',
        transform: visible && !leaving ? 'translateX(0) scale(1)' : 'translateX(100%) scale(0.9)',
        opacity: visible && !leaving ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: c.icon + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <i className={`fas ${icons[toast.type]}`} style={{ color: c.icon, fontSize: 15 }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: toast.message ? 2 : 0 }}>{toast.title}</p>
        {toast.message && <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>{toast.message}</p>}
      </div>
      <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2, lineHeight: 1, fontSize: 12 }}>
        <i className="fas fa-xmark" />
      </button>
      <div style={{
        position: 'absolute', bottom: 0, left: 0,
        height: 3, borderRadius: '0 0 12px 12px',
        background: c.progress,
        animation: 'toast-progress 3.8s linear forwards',
      }} />
      <style>{`@keyframes toast-progress { from { width: 100% } to { width: 0% } }`}</style>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts(p => p.filter(t => t.id !== id));
  }, []);

  const add = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(p => [...p.slice(-4), { id, type, title, message }]);
  }, []);

  const value: ToastContextValue = {
    toast: add,
    success: (t, m) => add('success', t, m),
    error: (t, m) => add('error', t, m),
    warning: (t, m) => add('warning', t, m),
    info: (t, m) => add('info', t, m),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {toasts.map(t => <ToastItem key={t.id} toast={t} onRemove={remove} />)}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
}
