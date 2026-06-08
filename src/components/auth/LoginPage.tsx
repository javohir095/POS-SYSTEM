import React, { useState, useRef } from 'react';
import { useApp } from '../../store/AppContext';
import { useToast } from '../ui/Toast';
import { api } from '../../lib/api';

export default function LoginPage() {
  const { dispatch, state } = useApp();
  const { error: toastError } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const userRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const username = userRef.current?.value.trim() || '';
    const password = passRef.current?.value || '';
    if (!username || !password) return;
    setLoading(true);
    try {
      const user = await api.loginUser(username, password);
      if (user) {
        dispatch({ type: 'SET_USER', user });
        dispatch({ type: 'SET_PAGE', page: user.role === 'cashier' ? 'pos' : 'dashboard' });
      } else {
        toastError('Kirish xatosi', 'Username yoki parol noto\'g\'ri!');
      }
    } catch {
      toastError('Xatolik', 'Server bilan bog\'lanib bo\'lmadi');
    }
    setLoading(false);
  };

  const inp: React.CSSProperties = { width: '100%', height: 44, padding: '0 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, color: '#0f172a', outline: 'none', boxSizing: 'border-box', transition: 'all 0.15s', background: '#fff' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'Inter, sans-serif', background: '#f8fafc' }}>
      {/* Left gradient panel */}
      <div style={{ flex: '1 1 55%', background: 'linear-gradient(145deg, #4f46e5 0%, #7c3aed 60%, #6366f1 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 48, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ maxWidth: 400, width: '100%', zIndex: 1 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, border: '1px solid rgba(255,255,255,0.25)' }}>
            <i className="fas fa-cash-register" style={{ fontSize: 24, color: 'white' }} />
          </div>
          <h1 style={{ fontSize: 34, fontWeight: 800, color: 'white', letterSpacing: '-0.5px', marginBottom: 12, lineHeight: 1.2 }}>Firdavs Emerald MCHJ<br />System</h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.72)', lineHeight: 1.6, marginBottom: 36 }}>Professional do'kon boshqaruv tizimi.<br />Supabase bilan real-time ma'lumotlar.</p>
          {[['fa-barcode', 'Barcode scanner qo\'llab-quvvatlash'], ['fa-chart-line', 'Real-time savdo tahlili'], ['fa-boxes-stacked', 'Ombor boshqaruvi'], ['fa-cloud', 'Supabase cloud database']].map(([icon, text]) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className={`fas ${icon}`} style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }} />
              </div>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>{text}</span>
            </div>
          ))}
          {/* Connection status */}
          <div style={{ marginTop: 24, padding: '10px 14px', background: 'rgba(255,255,255,0.1)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: state.loading ? '#fbbf24' : '#34d399', animation: state.loading ? 'pulse 1s infinite' : 'none' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{state.loading ? 'Supabase ga ulanmoqda...' : 'Supabase ulangan ✓'}</span>
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div style={{ flex: '1 1 45%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px', marginBottom: 6 }}>Xush kelibsiz!</h2>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 32 }}>Hisobingizga kiring</p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6, letterSpacing: '0.04em' }}>USERNAME</label>
              <div style={{ position: 'relative' }}>
                <i className="fas fa-user" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 13 }} />
                <input ref={userRef} placeholder="admin" autoComplete="username" style={{ ...inp, paddingLeft: 36 }} onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6, letterSpacing: '0.04em' }}>PAROL</label>
              <div style={{ position: 'relative' }}>
                <i className="fas fa-lock" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 13 }} />
                <input ref={passRef} type={showPass ? 'text' : 'password'} placeholder="••••••••" autoComplete="current-password" style={{ ...inp, paddingLeft: 36, paddingRight: 44 }} onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }} />
                <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 14, padding: 4 }}>
                  <i className={`fas fa-eye${showPass ? '-slash' : ''}`} />
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} style={{ height: 44, marginTop: 4, borderRadius: 10, fontWeight: 700, fontSize: 14, background: loading ? '#a5b4fc' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', cursor: loading ? 'wait' : 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? <><i className="fas fa-circle-notch fa-spin" /> Tekshirilmoqda...</> : <><i className="fas fa-right-to-bracket" /> Kirish</>}
            </button>
          </form>
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}
