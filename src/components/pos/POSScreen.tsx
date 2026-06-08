import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useApp } from '../../store/AppContext';
import { DbProduct } from '../../lib/supabase';
import { api } from '../../lib/api';
import { formatCurrency, printReceipt } from '../../utils';
import { Badge, Button } from '../ui';
import { useToast } from '../ui/Toast';

interface CartItem { product: DbProduct; quantity: number; discount: number }

export default function POSScreen() {
  const { state, dispatch } = useApp();
  const { success, error: toastError, warning } = useToast();
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payMethod, setPayMethod] = useState<'cash' | 'card' | 'debt'>('cash');
  const [customerId, setCustomerId] = useState('');
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSaleId, setLastSaleId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { searchRef.current?.focus(); }, [cart.length]);

  const filtered = state.products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search)
  ).slice(0, 30);

  const addToCart = useCallback((product: DbProduct) => {
    if (product.quantity <= 0) { warning('Mahsulot tugagan', product.name); return; }
    setCart(prev => {
      const idx = prev.findIndex(i => i.product.id === product.id);
      if (idx !== -1) {
        const u = [...prev];
        u[idx] = { ...u[idx], quantity: u[idx].quantity + 1 };
        return u;
      }
      return [...prev, { product, quantity: 1, discount: 0 }];
    });
    setSearch('');
    setTimeout(() => searchRef.current?.focus(), 0);
  }, [warning]);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (val.trim().length > 5) {
      const exact = state.products.find(p => p.barcode === val.trim());
      if (exact) addToCart(exact);
    }
  };

  const updateQty = useCallback((id: string, delta: number) => {
    setCart(prev => prev.map(i => i.product.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  }, []);

  const removeItem = useCallback((id: string) => setCart(prev => prev.filter(i => i.product.id !== id)), []);

  const subtotal = cart.reduce((a, i) => a + i.product.selling_price * i.quantity, 0);
  const total = Math.max(0, subtotal - globalDiscount);

  const handleCheckout = async () => {
    if (cart.length === 0) { toastError('Savat bo\'sh', 'Mahsulot qo\'shing'); return; }
    if (payMethod === 'debt' && !customerId) { toastError('Mijoz tanlanmagan', 'Qarz uchun mijoz tanlang'); return; }
    setSaving(true);
    try {
      const customer = state.customers.find(c => c.id === customerId);
      const saleData = {
        cashier_id: state.currentUser!.id,
        cashier_name: state.currentUser!.name,
        customer_id: customerId || null,
        customer_name: customer?.name || '',
        subtotal, discount: globalDiscount, total,
        payment_method: payMethod,
        is_debt: payMethod === 'debt',
      };
      const items = cart.map(i => ({
        product_id: i.product.id,
        product_name: i.product.name,
        barcode: i.product.barcode,
        quantity: i.quantity,
        unit: i.product.unit,
        purchase_price: i.product.purchase_price,
        selling_price: i.product.selling_price,
        discount: i.discount,
        total: (i.product.selling_price - i.discount) * i.quantity,
      }));

      const sale = await api.addSale(saleData, items);

      // Update debt if needed
      if (payMethod === 'debt' && customer) {
        await api.updateCustomer(customer.id, { total_debt: customer.total_debt + total });
        dispatch({ type: 'UPDATE_CUSTOMER', customer: { ...customer, total_debt: customer.total_debt + total } });
      }

      // Optimistic stock update
      cart.forEach(i => dispatch({ type: 'UPDATE_STOCK', productId: i.product.id, qty: i.quantity }));

      dispatch({ type: 'ADD_SALE', sale });
      setLastSaleId(sale.id);
      setCart([]);
      setGlobalDiscount(0);
      setCustomerId('');
      setShowReceipt(true);
      success('Sotuv yakunlandi!', `Jami: ${formatCurrency(total)}`);
    } catch (e: any) {
      toastError('Xatolik', e.message || 'Saqlashda xato yuz berdi');
    }
    setSaving(false);
  };

  const settings = state.settings;
  const lastSale = lastSaleId ? state.sales.find(s => s.id === lastSaleId) : null;

  const printSale = () => {
    if (!lastSale) return;
    const html = `<h2>${settings?.store_name || 'Firdavs Emerald MCHJ'}</h2><p>${settings?.address || ''}</p><p>${settings?.phone || ''}</p><div class="line"></div><p>Sana: ${new Date(lastSale.created_at).toLocaleString('uz-UZ')}</p><p>Kassir: ${lastSale.cashier_name}</p><p>Chek #: ${lastSale.id.slice(-8).toUpperCase()}</p><div class="line"></div><table><tr><td><b>Mahsulot</b></td><td class="right"><b>Soni</b></td><td class="right"><b>Narx</b></td><td class="right"><b>Jami</b></td></tr>${(lastSale.sale_items || []).map(i => `<tr><td>${i.product_name}</td><td class="right">${i.quantity}</td><td class="right">${i.selling_price.toLocaleString()}</td><td class="right">${i.total.toLocaleString()}</td></tr>`).join('')}</table><div class="line"></div><p class="total">JAMI: ${lastSale.total.toLocaleString()} so'm</p><p>To'lov: ${lastSale.payment_method === 'cash' ? 'Naqd pul' : lastSale.payment_method === 'card' ? 'Karta' : 'Qarz'}</p><div class="line"></div><p>${settings?.receipt_footer || ''}</p>`;
    printReceipt(html);
  };

  return (
    <div style={{ display: 'flex', height: '100%', background: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      {/* Left: Products */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ padding: '14px 16px', background: '#fff', borderBottom: '1.5px solid #f1f5f9' }}>
          <div style={{ position: 'relative' }}>
            <i className="fas fa-barcode" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 16 }} />
            <input ref={searchRef} value={search} onChange={e => handleSearch(e.target.value)} placeholder="Barcode yoki mahsulot nomi..." autoFocus
              style={{ width: '100%', height: 42, padding: '0 44px 0 40px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#f8fafc' }}
              onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
            />
            {search && <button onClick={() => { setSearch(''); searchRef.current?.focus(); }} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 14 }}><i className="fas fa-xmark" /></button>}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
          {state.products.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
              <i className="fas fa-box-open" style={{ fontSize: 40, marginBottom: 12, display: 'block' }} />
              <p>Mahsulotlar yuklanmoqda...</p>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(156px, 1fr))', gap: 10 }}>
            {(search ? filtered : state.products.slice(0, 30)).map(p => {
              const inCart = cart.find(i => i.product.id === p.id);
              return (
                <button key={p.id} onClick={() => addToCart(p)} style={{ background: '#fff', border: `1.5px solid ${inCart ? '#6366f1' : '#f1f5f9'}`, borderRadius: 12, padding: 12, cursor: p.quantity <= 0 ? 'not-allowed' : 'pointer', textAlign: 'left', opacity: p.quantity <= 0 ? 0.5 : 1, transition: 'all 0.15s', position: 'relative', boxShadow: inCart ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none' }}
                  onMouseEnter={e => { if (p.quantity > 0) { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = '#6366f1'; el.style.transform = 'translateY(-1px)'; el.style.boxShadow = '0 4px 12px rgba(99,102,241,0.12)'; } }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = inCart ? '#6366f1' : '#f1f5f9'; el.style.transform = 'none'; el.style.boxShadow = inCart ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none'; }}
                >
                  {inCart && <div style={{ position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: 'white' }}>{inCart.quantity}</div>}
                  <div style={{ width: '100%', height: 58, borderRadius: 8, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                    <i className="fas fa-box" style={{ fontSize: 24, color: '#cbd5e1' }} />
                  </div>
                  <p style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                  <p style={{ fontSize: 13, fontWeight: 800, color: '#6366f1', marginBottom: 6 }}>{formatCurrency(p.selling_price)}</p>
                  <Badge color={p.quantity <= 0 ? 'red' : p.quantity <= 10 ? 'yellow' : 'green'} dot>
                    {p.quantity <= 0 ? 'Tugagan' : `${p.quantity} ${p.unit}`}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: Cart */}
      <div style={{ width: 340, background: '#fff', borderLeft: '1.5px solid #f1f5f9', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '14px 16px', borderBottom: '1.5px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fas fa-cart-shopping" style={{ color: '#6366f1', fontSize: 16 }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Savat</span>
            {cart.length > 0 && <span style={{ fontSize: 11, fontWeight: 800, padding: '1px 7px', borderRadius: 99, background: '#ede9fe', color: '#6366f1' }}>{cart.length}</span>}
          </div>
          {cart.length > 0 && <button onClick={() => setCart([])} style={{ fontSize: 12, color: '#ef4444', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, padding: '4px 10px', cursor: 'pointer', fontWeight: 600 }}><i className="fas fa-trash" style={{ marginRight: 4, fontSize: 10 }} />Tozalash</button>}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
          {cart.length === 0 && <div style={{ textAlign: 'center', padding: '48px 20px' }}><i className="fas fa-cart-shopping" style={{ fontSize: 36, color: '#e2e8f0', marginBottom: 12, display: 'block' }} /><p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>Savat bo'sh</p></div>}
          {cart.map(item => (
            <div key={item.product.id} style={{ background: '#f8fafc', border: '1.5px solid #f1f5f9', borderRadius: 10, padding: 10, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', flex: 1, paddingRight: 8, lineHeight: 1.3, margin: 0 }}>{item.product.name}</p>
                <button onClick={() => removeItem(item.product.id)} style={{ width: 22, height: 22, borderRadius: 6, background: '#fee2e2', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><i className="fas fa-xmark" /></button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button onClick={() => updateQty(item.product.id, -1)} style={{ width: 26, height: 26, borderRadius: 7, background: '#fff', border: '1.5px solid #e2e8f0', cursor: 'pointer', color: '#475569', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>−</button>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', minWidth: 24, textAlign: 'center' }}>{item.quantity}</span>
                  <button onClick={() => updateQty(item.product.id, 1)} style={{ width: 26, height: 26, borderRadius: 7, background: '#fff', border: '1.5px solid #e2e8f0', cursor: 'pointer', color: '#475569', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>+</button>
                </div>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#6366f1' }}>{formatCurrency(item.product.selling_price * item.quantity)}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '12px 14px', borderTop: '1.5px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <i className="fas fa-tag" style={{ color: '#94a3b8', fontSize: 13 }} />
            <span style={{ fontSize: 13, color: '#64748b', flexShrink: 0 }}>Chegirma:</span>
            <input type="number" value={globalDiscount || ''} onChange={e => setGlobalDiscount(Number(e.target.value) || 0)} placeholder="0"
              style={{ flex: 1, height: 32, padding: '0 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#0f172a', outline: 'none', background: '#f8fafc' }}
              onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.background = '#fff'; }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
            />
            <span style={{ fontSize: 12, color: '#94a3b8', flexShrink: 0 }}>so'm</span>
          </div>

          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12.5, color: '#64748b' }}>Jami:</span>
              <span style={{ fontSize: 12.5, color: '#0f172a', fontWeight: 600 }}>{formatCurrency(subtotal)}</span>
            </div>
            {globalDiscount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12.5, color: '#16a34a' }}>Chegirma:</span>
              <span style={{ fontSize: 12.5, color: '#16a34a', fontWeight: 600 }}>−{formatCurrency(globalDiscount)}</span>
            </div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1.5px dashed #e2e8f0', marginTop: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>To'lash:</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#6366f1', letterSpacing: '-0.5px' }}>{formatCurrency(total)}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
            {(['cash', 'card', 'debt'] as const).map(pm => {
              const cfg = { cash: { icon: 'fa-money-bill-wave', label: 'Naqd', bg: '#dcfce7', border: '#16a34a', text: '#16a34a' }, card: { icon: 'fa-credit-card', label: 'Karta', bg: '#dbeafe', border: '#2563eb', text: '#2563eb' }, debt: { icon: 'fa-file-invoice-dollar', label: 'Qarz', bg: '#fee2e2', border: '#dc2626', text: '#dc2626' } }[pm];
              const active = payMethod === pm;
              return (
                <button key={pm} onClick={() => setPayMethod(pm)} style={{ padding: '8px 4px', borderRadius: 9, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', background: active ? cfg.bg : '#f8fafc', border: `1.5px solid ${active ? cfg.border : '#e2e8f0'}`, color: active ? cfg.text : '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, transition: 'all 0.15s' }}>
                  <i className={`fas ${cfg.icon}`} style={{ fontSize: 14 }} />{cfg.label}
                </button>
              );
            })}
          </div>

          {payMethod === 'debt' && (
            <select value={customerId} onChange={e => setCustomerId(e.target.value)} style={{ width: '100%', height: 36, padding: '0 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#0f172a', background: '#fff', outline: 'none', cursor: 'pointer', marginBottom: 10, boxSizing: 'border-box' }}>
              <option value="">Mijozni tanlang...</option>
              {state.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}

          <Button variant="success" size="lg" icon={saving ? 'fa-circle-notch' : 'fa-check'} fullWidth onClick={handleCheckout} disabled={cart.length === 0 || saving}>
            {saving ? 'Saqlanmoqda...' : 'Sotishni yakunlash'}
          </Button>
        </div>
      </div>

      {/* Receipt modal */}
      {showReceipt && lastSale && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 400, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#dcfce7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <i className="fas fa-circle-check" style={{ fontSize: 28, color: '#16a34a' }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Sotuv yakunlandi!</h3>
              <p style={{ fontSize: 22, fontWeight: 900, color: '#6366f1' }}>{formatCurrency(lastSale.total)}</p>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: 14, marginBottom: 18, maxHeight: 200, overflowY: 'auto' }}>
              {(lastSale.sale_items || []).map(i => (
                <div key={i.id || i.product_id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12.5, color: '#475569' }}>{i.product_name} <span style={{ color: '#94a3b8' }}>×{i.quantity}</span></span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>{formatCurrency(i.total)}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="outline" size="lg" icon="fa-print" style={{ flex: 1 }} onClick={printSale}>Chop etish</Button>
              <Button variant="primary" size="lg" icon="fa-plus" style={{ flex: 1 }} onClick={() => setShowReceipt(false)}>Yangi sotuv</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
