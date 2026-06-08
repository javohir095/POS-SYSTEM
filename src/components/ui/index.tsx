import React, { forwardRef } from 'react';

/* ─── Input ──────────────────────────────────────────────────── */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: string;
  error?: string;
  suffix?: string;
}
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon, error, suffix, className, style, ...props }, ref) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', letterSpacing: '0.02em' }}>{label}</label>}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {icon && (
          <span style={{ position: 'absolute', left: 11, color: '#94a3b8', fontSize: 13, pointerEvents: 'none', zIndex: 1 }}>
            <i className={`fas ${icon}`} />
          </span>
        )}
        <input
          ref={ref}
          {...props}
          style={{
            width: '100%', height: 38, padding: `0 ${suffix ? '48px' : '12px'} 0 ${icon ? '34px' : '12px'}`,
            border: `1.5px solid ${error ? '#fca5a5' : '#e2e8f0'}`,
            borderRadius: 8, fontSize: 13.5, color: '#0f172a', background: '#fff',
            outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
            boxShadow: error ? '0 0 0 3px rgba(239,68,68,0.08)' : 'none',
            ...style,
          }}
          onFocus={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
          onBlur={e => { e.currentTarget.style.borderColor = error ? '#fca5a5' : '#e2e8f0'; e.currentTarget.style.boxShadow = error ? '0 0 0 3px rgba(239,68,68,0.08)' : 'none'; }}
        />
        {suffix && <span style={{ position: 'absolute', right: 12, fontSize: 12, color: '#94a3b8', fontWeight: 500, pointerEvents: 'none' }}>{suffix}</span>}
      </div>
      {error && <span style={{ fontSize: 11, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}><i className="fas fa-circle-exclamation" style={{ fontSize: 10 }} />{error}</span>}
    </div>
  )
);

/* ─── Select ─────────────────────────────────────────────────── */
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  icon?: string;
  options: { value: string; label: string }[];
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, icon, options, style, ...props }, ref) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', letterSpacing: '0.02em' }}>{label}</label>}
      <div style={{ position: 'relative' }}>
        {icon && <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 13, pointerEvents: 'none', zIndex: 1 }}><i className={`fas ${icon}`} /></span>}
        <select
          ref={ref}
          {...props}
          style={{
            width: '100%', height: 38, padding: `0 32px 0 ${icon ? '34px' : '12px'}`,
            border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13.5, color: '#0f172a',
            background: '#fff', outline: 'none', appearance: 'none', cursor: 'pointer',
            transition: 'border-color 0.15s, box-shadow 0.15s', ...style,
          }}
          onFocus={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
          onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 11, pointerEvents: 'none' }}><i className="fas fa-chevron-down" /></span>
      </div>
    </div>
  )
);

/* ─── Textarea ───────────────────────────────────────────────── */
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, style, ...props }, ref) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', letterSpacing: '0.02em' }}>{label}</label>}
      <textarea ref={ref} {...props} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13.5, color: '#0f172a', background: '#fff', outline: 'none', resize: 'vertical', minHeight: 80, fontFamily: 'inherit', lineHeight: 1.5, transition: 'border-color 0.15s, box-shadow 0.15s', ...style }}
        onFocus={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
        onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
      />
    </div>
  )
);

/* ─── Button ─────────────────────────────────────────────────── */
type BtnVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline';
type BtnSize = 'sm' | 'md' | 'lg';
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
  icon?: string;
  iconRight?: string;
  loading?: boolean;
  fullWidth?: boolean;
}
const btnStyles: Record<BtnVariant, React.CSSProperties> = {
  primary: { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', boxShadow: '0 2px 8px rgba(99,102,241,0.35)' },
  secondary: { background: '#f1f5f9', color: '#475569', border: '1.5px solid #e2e8f0' },
  danger: { background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', border: 'none', boxShadow: '0 2px 8px rgba(239,68,68,0.3)' },
  success: { background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', boxShadow: '0 2px 8px rgba(16,185,129,0.3)' },
  ghost: { background: 'transparent', color: '#64748b', border: 'none' },
  outline: { background: '#fff', color: '#6366f1', border: '1.5px solid #6366f1' },
};
const sizeStyles: Record<BtnSize, React.CSSProperties> = {
  sm: { height: 30, padding: '0 12px', fontSize: 12, borderRadius: 7 },
  md: { height: 38, padding: '0 16px', fontSize: 13.5, borderRadius: 8 },
  lg: { height: 44, padding: '0 20px', fontSize: 14, borderRadius: 10 },
};
export function Button({ variant = 'primary', size = 'md', icon, iconRight, loading, fullWidth, children, disabled, style, ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      {...props}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        fontWeight: 600, cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1, transition: 'all 0.15s', whiteSpace: 'nowrap',
        width: fullWidth ? '100%' : undefined,
        ...btnStyles[variant], ...sizeStyles[size], ...style,
      }}
      onMouseEnter={e => { if (!disabled && !loading) { (e.currentTarget as HTMLButtonElement).style.opacity = '0.88'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; } }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; (e.currentTarget as HTMLButtonElement).style.transform = 'none'; }}
      onMouseDown={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)'; }}
      onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'none'; }}
    >
      {loading ? <i className="fas fa-circle-notch fa-spin" style={{ fontSize: 13 }} /> : icon && <i className={`fas ${icon}`} style={{ fontSize: 13 }} />}
      {children}
      {iconRight && !loading && <i className={`fas ${iconRight}`} style={{ fontSize: 12 }} />}
    </button>
  );
}

/* ─── Badge ──────────────────────────────────────────────────── */
interface BadgeProps { children: React.ReactNode; color?: 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'gray'; dot?: boolean; }
const badgeColors = {
  green: { bg: '#dcfce7', text: '#16a34a', dot: '#16a34a' },
  red: { bg: '#fee2e2', text: '#dc2626', dot: '#dc2626' },
  yellow: { bg: '#fef9c3', text: '#ca8a04', dot: '#ca8a04' },
  blue: { bg: '#dbeafe', text: '#2563eb', dot: '#2563eb' },
  purple: { bg: '#ede9fe', text: '#7c3aed', dot: '#7c3aed' },
  gray: { bg: '#f1f5f9', text: '#475569', dot: '#94a3b8' },
};
export function Badge({ children, color = 'gray', dot }: BadgeProps) {
  const c = badgeColors[color];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 9px', borderRadius: 99, fontSize: 11.5, fontWeight: 600, background: c.bg, color: c.text }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />}
      {children}
    </span>
  );
}

/* ─── Card ───────────────────────────────────────────────────── */
export function Card({ children, style, className }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  return (
    <div style={{ background: '#fff', border: '1.5px solid #f1f5f9', borderRadius: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', ...style }}>
      {children}
    </div>
  );
}

/* ─── Modal ──────────────────────────────────────────────────── */
interface ModalProps { open: boolean; onClose: () => void; title: string; children: React.ReactNode; width?: number; }
export function Modal({ open, onClose, title, children, width = 480 }: ModalProps) {
  if (!open) return null;
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: width, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', animation: 'modalIn 0.2s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1.5px solid #f1f5f9' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{title}</h3>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#e2e8f0')}
            onMouseLeave={e => (e.currentTarget.style.background = '#f1f5f9')}
          ><i className="fas fa-xmark" /></button>
        </div>
        <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
      <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.95) translateY(8px) } to { opacity:1; transform:none } }`}</style>
    </div>
  );
}

/* ─── StatCard ───────────────────────────────────────────────── */
interface StatCardProps { label: string; value: string | number; icon: string; color: 'indigo' | 'green' | 'red' | 'yellow' | 'blue' | 'purple'; trend?: string; trendUp?: boolean; }
const statColors = {
  indigo: { bg: '#ede9fe', icon: '#6366f1', light: '#f5f3ff' },
  green: { bg: '#dcfce7', icon: '#16a34a', light: '#f0fdf4' },
  red: { bg: '#fee2e2', icon: '#dc2626', light: '#fef2f2' },
  yellow: { bg: '#fef9c3', icon: '#ca8a04', light: '#fefce8' },
  blue: { bg: '#dbeafe', icon: '#2563eb', light: '#eff6ff' },
  purple: { bg: '#ede9fe', icon: '#7c3aed', light: '#f5f3ff' },
};
export function StatCard({ label, value, icon, color, trend, trendUp }: StatCardProps) {
  const c = statColors[color];
  return (
    <Card style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className={`fas ${icon}`} style={{ color: c.icon, fontSize: 17 }} />
        </div>
        {trend && (
          <span style={{ fontSize: 11.5, fontWeight: 600, color: trendUp ? '#16a34a' : '#dc2626', background: trendUp ? '#dcfce7' : '#fee2e2', padding: '2px 7px', borderRadius: 99 }}>
            <i className={`fas fa-arrow-${trendUp ? 'up' : 'down'}`} style={{ marginRight: 3, fontSize: 9 }} />{trend}
          </span>
        )}
      </div>
      <p style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: 2 }}>{value}</p>
      <p style={{ fontSize: 12.5, color: '#64748b', fontWeight: 500 }}>{label}</p>
    </Card>
  );
}

/* ─── Table ──────────────────────────────────────────────────── */
export function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #f1f5f9' }}>
            {headers.map(h => (
              <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Tr({ children, onClick, selected }: { children: React.ReactNode; onClick?: () => void; selected?: boolean }) {
  return (
    <tr onClick={onClick} style={{ borderBottom: '1px solid #f8fafc', background: selected ? '#f5f3ff' : 'transparent', cursor: onClick ? 'pointer' : 'default', transition: 'background 0.1s' }}
      onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLTableRowElement).style.background = '#fafafa'; }}
      onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
    >{children}</tr>
  );
}

export function Td({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <td style={{ padding: '12px 16px', fontSize: 13.5, color: '#334155', verticalAlign: 'middle', ...style }}>{children}</td>;
}

/* ─── PageHeader ─────────────────────────────────────────────── */
export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 3 }}>{subtitle}</p>}
      </div>
      {children && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{children}</div>}
    </div>
  );
}

/* ─── EmptyState ─────────────────────────────────────────────── */
export function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: '#f1f5f9', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <i className={`fas ${icon}`} style={{ fontSize: 24, color: '#94a3b8' }} />
      </div>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 4 }}>{title}</p>
      {subtitle && <p style={{ fontSize: 13, color: '#94a3b8' }}>{subtitle}</p>}
    </div>
  );
}
