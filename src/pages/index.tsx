import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../store/AppContext';
import { DbCustomer } from '../lib/supabase';
import { api } from '../lib/api';
import {
  formatCurrency, formatDate, formatDateTime,
  isToday, isThisWeek, isThisMonth
} from '../utils';
import {
  Button, Badge, Card, Modal, PageHeader,
  Table, Tr, Td, EmptyState, StatCard
} from '../components/ui';
import { useToast } from '../components/ui/Toast';

/* ────────────────────────────────────────────────────────────
   SALES HISTORY
──────────────────────────────────────────────────────────── */
export function SalesHistory() {
  const { state } = useApp();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = useMemo(() => state.sales.filter(s => {
    const mf =
      filter === 'today' ? isToday(s.created_at) :
      filter === 'week'  ? isThisWeek(s.created_at) :
      filter === 'month' ? isThisMonth(s.created_at) : true;
    const ms =
      !search ||
      s.cashier_name.toLowerCase().includes(search.toLowerCase()) ||
      (s.customer_name || '').toLowerCase().includes(search.toLowerCase());
    return mf && ms;
  }), [state.sales, filter, search]);

  const totalAmount = filtered.reduce((a, s) => a + s.total, 0);
  const selSale = selected ? state.sales.find(s => s.id === selected) : null;

  const filterBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '7px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600,
    cursor: 'pointer',
    background: active ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#fff',
    color: active ? 'white' : '#64748b',
    border: active ? 'none' : '1.5px solid #e2e8f0',
    transition: 'all 0.15s',
  });

  return (
    <div>
      <PageHeader
        title="Sotuvlar tarixi"
        subtitle={`${filtered.length} ta sotuv · Jami: ${formatCurrency(totalAmount)}`}
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['all','Barchasi'],['today','Bugun'],['week','Bu hafta'],['month','Bu oy']].map(([v,l]) => (
          <button key={v} onClick={() => setFilter(v)} style={filterBtnStyle(filter === v)}>{l}</button>
        ))}
        <div style={{ position: 'relative', flex: 1, minWidth: 150 }}>
          <i className="fas fa-magnifying-glass" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 13 }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Kassir, mijoz..."
            style={{ width: '100%', height: 38, padding: '0 12px 0 34px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13, color: '#0f172a', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
            onFocus={e => (e.target.style.borderColor = '#6366f1')}
            onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selSale ? '1fr 320px' : '1fr', gap: 14 }}>
        <Card>
          <Table headers={['#','Kassir','Mijoz','Mahsulotlar',"To'lov",'Summa','Vaqt','']}>
            {filtered.map(sale => (
              <Tr key={sale.id} onClick={() => setSelected(sale.id === selected ? null : sale.id)} selected={selected === sale.id}>
                <Td><code style={{ fontSize: 11, color: '#94a3b8' }}>#{sale.id.slice(-6).toUpperCase()}</code></Td>
                <Td><span style={{ fontWeight: 600, color: '#0f172a' }}>{sale.cashier_name}</span></Td>
                <Td><span style={{ color: '#64748b' }}>{sale.customer_name || '—'}</span></Td>
                <Td><span style={{ color: '#64748b' }}>{(sale.sale_items || []).length} ta</span></Td>
                <Td>
                  <Badge color={sale.payment_method === 'cash' ? 'green' : sale.payment_method === 'card' ? 'blue' : 'red'} dot>
                    {sale.payment_method === 'cash' ? 'Naqd' : sale.payment_method === 'card' ? 'Karta' : 'Qarz'}
                  </Badge>
                </Td>
                <Td><span style={{ fontWeight: 700, color: '#0f172a' }}>{formatCurrency(sale.total)}</span></Td>
                <Td><span style={{ color: '#94a3b8', fontSize: 12 }}>{formatDateTime(sale.created_at)}</span></Td>
                <Td><Button variant="ghost" size="sm" icon="fa-eye" /></Td>
              </Tr>
            ))}
          </Table>
          {filtered.length === 0 && <EmptyState icon="fa-receipt" title="Sotuvlar topilmadi" />}
        </Card>

        {selSale && (
          <Card style={{ padding: 18, height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                #{selSale.id.slice(-6).toUpperCase()}
              </p>
              <button onClick={() => setSelected(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 7, width: 28, height: 28, cursor: 'pointer', color: '#64748b', fontSize: 13 }}>
                <i className="fas fa-xmark" />
              </button>
            </div>
            {[['Kassir', selSale.cashier_name], ['Mijoz', selSale.customer_name || '—'], ['Sana', formatDateTime(selSale.created_at)]].map(([k,v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>{k}:</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{v}</span>
              </div>
            ))}
            <div style={{ borderTop: '1.5px solid #f1f5f9', margin: '12px 0', paddingTop: 12 }}>
              {(selSale.sale_items || []).map(i => (
                <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <p style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a', margin: 0 }}>{i.product_name}</p>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{i.quantity} × {formatCurrency(i.selling_price)}</p>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#6366f1' }}>{formatCurrency(i.total)}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '2px solid #f1f5f9' }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>JAMI:</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#6366f1' }}>{formatCurrency(selSale.total)}</span>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   CUSTOMERS
──────────────────────────────────────────────────────────── */
export function Customers() {
  const { state, dispatch } = useApp();
  const { success, error: toastError } = useToast();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [payModal, setPayModal] = useState<DbCustomer | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const addrRef = useRef<HTMLInputElement>(null);
  const payAmtRef = useRef<HTMLInputElement>(null);

  const filtered = state.customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );
  const totalDebt = state.customers.reduce((a, c) => a + c.total_debt, 0);

  const openAdd = () => {
    setEditingId(null);
    setModalOpen(true);
    setTimeout(() => { if (nameRef.current) nameRef.current.value = ''; if (phoneRef.current) phoneRef.current.value = ''; if (addrRef.current) addrRef.current.value = ''; nameRef.current?.focus(); }, 50);
  };

  const openEdit = (c: DbCustomer) => {
    setEditingId(c.id);
    setModalOpen(true);
    setTimeout(() => {
      if (nameRef.current) nameRef.current.value = c.name;
      if (phoneRef.current) phoneRef.current.value = c.phone;
      if (addrRef.current) addrRef.current.value = c.address;
      nameRef.current?.focus();
    }, 50);
  };

  const handleSave = async () => {
    const name = nameRef.current?.value.trim() || '';
    if (!name) return;
    setSaving(true);
    try {
      const payload = {
        name,
        phone: phoneRef.current?.value || '',
        address: addrRef.current?.value || '',
        total_debt: editingId ? (state.customers.find(c => c.id === editingId)?.total_debt || 0) : 0,
      };
      if (editingId) {
        await api.updateCustomer(editingId, payload);
        const existing = state.customers.find(c => c.id === editingId)!;
        dispatch({ type: 'UPDATE_CUSTOMER', customer: { ...existing, ...payload } });
        success('Yangilandi', name);
      } else {
        const created = await api.addCustomer(payload);
        dispatch({ type: 'ADD_CUSTOMER', customer: created });
        success("Qo'shildi", name);
      }
      setModalOpen(false);
    } catch (e: any) {
      toastError('Xatolik', e.message);
    }
    setSaving(false);
  };

  const handlePay = async () => {
    if (!payModal || !payAmtRef.current?.value) return;
    const amt = Number(payAmtRef.current.value);
    if (amt <= 0 || amt > payModal.total_debt) return;
    setSaving(true);
    try {
      const newDebt = Math.max(0, payModal.total_debt - amt);
      await api.addDebtPayment({ customer_id: payModal.id, amount: amt, note: '' }, newDebt);
      dispatch({ type: 'UPDATE_CUSTOMER', customer: { ...payModal, total_debt: newDebt } });
      success("To'lov qabul qilindi", `${payModal.name}: ${formatCurrency(amt)}`);
      setPayModal(null);
    } catch (e: any) {
      toastError('Xatolik', e.message);
    }
    setSaving(false);
  };

  const inpStyle: React.CSSProperties = {
    width: '100%', height: 38, padding: '0 12px', border: '1.5px solid #e2e8f0',
    borderRadius: 8, fontSize: 13.5, color: '#0f172a', outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div>
      <PageHeader title="Mijozlar va Qarzlar" subtitle={`Umumiy qarz: ${formatCurrency(totalDebt)}`}>
        <Button icon="fa-user-plus" onClick={openAdd}>Mijoz qo'shish</Button>
      </PageHeader>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12, marginBottom: 20 }}>
        <StatCard label="Jami mijozlar" value={state.customers.length} icon="fa-users" color="indigo" />
        <StatCard label="Qarzli mijozlar" value={state.customers.filter(c => c.total_debt > 0).length} icon="fa-file-invoice-dollar" color="red" />
        <StatCard label="Umumiy qarz" value={formatCurrency(totalDebt)} icon="fa-hand-holding-dollar" color="yellow" />
      </div>

      <Card style={{ padding: '12px 16px', marginBottom: 16 }}>
        <div style={{ position: 'relative' }}>
          <i className="fas fa-magnifying-glass" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 13 }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Ism yoki telefon..."
            style={{ width: '100%', height: 38, padding: '0 12px 0 34px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13, color: '#0f172a', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
            onFocus={e => (e.target.style.borderColor = '#6366f1')}
            onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
          />
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: 12 }}>
        {filtered.map(c => (
          <Card key={c.id} style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: 'white', flexShrink: 0 }}>
                {c.name.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', margin: 0 }}>{c.name}</p>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{c.phone || '—'}</p>
              </div>
              <Button variant="ghost" size="sm" icon="fa-pen" onClick={() => openEdit(c)} />
            </div>
            {c.address && (
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
                <i className="fas fa-location-dot" style={{ marginRight: 5, fontSize: 11, color: '#94a3b8' }} />
                {c.address}
              </p>
            )}
            <div style={{ background: c.total_debt > 0 ? '#fef2f2' : '#f0fdf4', borderRadius: 9, padding: '10px 12px', marginBottom: c.total_debt > 0 ? 10 : 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: c.total_debt > 0 ? '#dc2626' : '#16a34a', fontWeight: 600 }}>Qarz:</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: c.total_debt > 0 ? '#dc2626' : '#16a34a' }}>
                {formatCurrency(c.total_debt)}
              </span>
            </div>
            {c.total_debt > 0 && (
              <Button variant="success" size="sm" icon="fa-money-bill-wave" fullWidth onClick={() => setPayModal(c)}>
                To'lov qabul qilish
              </Button>
            )}
          </Card>
        ))}
      </div>
      {filtered.length === 0 && <Card style={{ padding: 0 }}><EmptyState icon="fa-users" title="Mijozlar topilmadi" /></Card>}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Mijozni tahrirlash' : 'Yangi mijoz'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: "TO'LIQ ISM *", ref: nameRef, placeholder: 'Ism Familiya' },
            { label: 'TELEFON', ref: phoneRef, placeholder: '+998 90 123 45 67' },
            { label: 'MANZIL', ref: addrRef, placeholder: "Shahar, ko'cha..." },
          ].map(f => (
            <div key={f.label}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>{f.label}</label>
              <input ref={f.ref} key={editingId + f.label} defaultValue="" placeholder={f.placeholder} style={inpStyle}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <Button variant="secondary" size="lg" fullWidth onClick={() => setModalOpen(false)}>Bekor</Button>
          <Button variant="primary" size="lg" fullWidth icon="fa-check" onClick={handleSave} loading={saving}>Saqlash</Button>
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal open={!!payModal} onClose={() => setPayModal(null)} title="To'lov qabul qilish" width={380}>
        {payModal && (
          <>
            <div style={{ background: '#fef2f2', borderRadius: 10, padding: '12px 16px', marginBottom: 16, border: '1.5px solid #fecaca' }}>
              <p style={{ fontSize: 12, color: '#dc2626', margin: 0 }}>{payModal.name}</p>
              <p style={{ fontSize: 22, fontWeight: 900, color: '#dc2626', margin: '4px 0 0' }}>
                {formatCurrency(payModal.total_debt)}
              </p>
            </div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>
              TO'LOV MIQDORI (so'm)
            </label>
            <input
              ref={payAmtRef} key={payModal.id} type="number"
              defaultValue="" placeholder="0" max={payModal.total_debt}
              style={{ ...inpStyle, marginBottom: 16 }}
              onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="secondary" size="lg" fullWidth onClick={() => setPayModal(null)}>Bekor</Button>
              <Button variant="success" size="lg" fullWidth icon="fa-check" onClick={handlePay} loading={saving}>Qabul qilish</Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   EXPENSES
──────────────────────────────────────────────────────────── */
const EXPENSE_CATS = ['Ijara', 'Elektr', 'Internet', 'Maosh', 'Transport', 'Boshqa'];

export function Expenses() {
  const { state, dispatch } = useApp();
  const { success, error: toastError } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const catRef = useRef<HTMLSelectElement>(null);
  const amtRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLInputElement>(null);

  const total = state.expenses.reduce((a, e) => a + e.amount, 0);
  const byCat = state.expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  const handleAdd = async () => {
    const amt = Number(amtRef.current?.value);
    if (!amt || amt <= 0) { toastError('Xato', 'Miqdor shart'); return; }
    setSaving(true);
    try {
      const expense = await api.addExpense({
        category: catRef.current?.value || 'Boshqa',
        amount: amt,
        description: descRef.current?.value || '',
      });
      dispatch({ type: 'ADD_EXPENSE', expense });
      success("Qo'shildi", `${expense.category}: ${formatCurrency(amt)}`);
      setModalOpen(false);
    } catch (e: any) { toastError('Xatolik', e.message); }
    setSaving(false);
  };

  const handleDelete = async (id: string, cat: string) => {
    try {
      await api.deleteExpense(id);
      dispatch({ type: 'REMOVE_EXPENSE', id });
      toastError("O'chirildi", cat);
    } catch (e: any) { toastError('Xatolik', e.message); }
  };

  const inpStyle: React.CSSProperties = {
    width: '100%', height: 38, padding: '0 12px', border: '1.5px solid #e2e8f0',
    borderRadius: 8, fontSize: 13.5, color: '#0f172a', outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div>
      <PageHeader title="Xarajatlar" subtitle={`Jami: ${formatCurrency(total)}`}>
        <Button icon="fa-plus" variant="danger" onClick={() => setModalOpen(true)}>Xarajat qo'shish</Button>
      </PageHeader>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12, marginBottom: 20 }}>
        {Object.entries(byCat).map(([cat, amt]) => (
          <Card key={cat} style={{ padding: '16px 18px' }}>
            <p style={{ fontSize: 11.5, color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>{cat.toUpperCase()}</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#dc2626', margin: 0 }}>{formatCurrency(amt)}</p>
          </Card>
        ))}
      </div>

      <Card>
        <Table headers={['Kategoriya', 'Tavsif', 'Miqdor', 'Sana', '']}>
          {state.expenses.map(e => (
            <Tr key={e.id}>
              <Td><Badge color="red">{e.category}</Badge></Td>
              <Td><span style={{ color: '#64748b' }}>{e.description || '—'}</span></Td>
              <Td><span style={{ fontWeight: 700, color: '#dc2626' }}>{formatCurrency(e.amount)}</span></Td>
              <Td><span style={{ color: '#94a3b8', fontSize: 12 }}>{formatDate(e.created_at)}</span></Td>
              <Td>
                <Button variant="ghost" size="sm" icon="fa-trash" style={{ color: '#ef4444' }}
                  onClick={() => handleDelete(e.id, e.category)} />
              </Td>
            </Tr>
          ))}
        </Table>
        {state.expenses.length === 0 && <EmptyState icon="fa-wallet" title="Xarajatlar yo'q" />}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Yangi xarajat" width={380}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>KATEGORIYA</label>
            <select ref={catRef} style={{ ...inpStyle, appearance: 'none', background: '#fff', cursor: 'pointer' }}>
              {EXPENSE_CATS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>MIQDOR (so'm) *</label>
            <input ref={amtRef} type="number" placeholder="0" style={inpStyle}
              onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>TAVSIF</label>
            <input ref={descRef} placeholder="Ixtiyoriy izoh..." style={inpStyle}
              onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <Button variant="secondary" size="lg" fullWidth onClick={() => setModalOpen(false)}>Bekor</Button>
          <Button variant="danger" size="lg" fullWidth icon="fa-plus" onClick={handleAdd} loading={saving}>Qo'shish</Button>
        </div>
      </Modal>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   PURCHASES
──────────────────────────────────────────────────────────── */
export function Purchases() {
  const { state, dispatch } = useApp();
  const { success, error: toastError } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const productRef = useRef<HTMLSelectElement>(null);
  const supplierRef = useRef<HTMLSelectElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const invRef = useRef<HTMLInputElement>(null);

  const handleAdd = async () => {
    if (!productRef.current?.value) { toastError('Xato', 'Mahsulot tanlang'); return; }
    if (!qtyRef.current?.value) { toastError('Xato', 'Miqdor kiriting'); return; }
    const product = state.products.find(p => p.id === productRef.current!.value);
    const supplier = state.suppliers.find(s => s.id === supplierRef.current!.value);
    const qty = Number(qtyRef.current.value);
    const price = Number(priceRef.current?.value) || product?.purchase_price || 0;
    setSaving(true);
    try {
      const purchase = await api.addPurchase({
        product_id: product!.id,
        product_name: product!.name,
        supplier_id: supplier?.id || null,
        supplier_name: supplier?.name || '',
        quantity: qty,
        purchase_price: price,
        total: qty * price,
        invoice_number: invRef.current?.value || '',
      });
      dispatch({ type: 'ADD_PURCHASE', purchase });
      success("Kirim qo'shildi", `${product!.name}: ${qty} dona`);
      setModalOpen(false);
    } catch (e: any) { toastError('Xatolik', e.message); }
    setSaving(false);
  };

  const inpStyle: React.CSSProperties = {
    width: '100%', height: 38, padding: '0 12px', border: '1.5px solid #e2e8f0',
    borderRadius: 8, fontSize: 13.5, color: '#0f172a', outline: 'none', boxSizing: 'border-box',
  };
  const selStyle: React.CSSProperties = { ...inpStyle, appearance: 'none', background: '#fff', cursor: 'pointer' };

  return (
    <div>
      <PageHeader title="Kirim / Yetkazib berish" subtitle={`${state.purchases.length} ta kirim`}>
        <Button icon="fa-truck-ramp-box" variant="success" onClick={() => setModalOpen(true)}>Kirim qo'shish</Button>
      </PageHeader>

      <Card>
        <Table headers={['Mahsulot',"Ta'minotchi",'Miqdor','Kirish narxi','Jami','Hujjat','Sana']}>
          {state.purchases.map(p => (
            <Tr key={p.id}>
              <Td><span style={{ fontWeight: 600, color: '#0f172a' }}>{p.product_name}</span></Td>
              <Td><span style={{ color: '#64748b' }}>{p.supplier_name || '—'}</span></Td>
              <Td><span style={{ fontWeight: 600 }}>{p.quantity}</span></Td>
              <Td><span style={{ color: '#64748b' }}>{formatCurrency(p.purchase_price)}</span></Td>
              <Td><span style={{ fontWeight: 700, color: '#16a34a' }}>{formatCurrency(p.total)}</span></Td>
              <Td><code style={{ fontSize: 11, background: '#f1f5f9', padding: '2px 6px', borderRadius: 5 }}>{p.invoice_number || '—'}</code></Td>
              <Td><span style={{ color: '#94a3b8', fontSize: 12 }}>{formatDate(p.created_at)}</span></Td>
            </Tr>
          ))}
        </Table>
        {state.purchases.length === 0 && <EmptyState icon="fa-truck" title="Kirimlar yo'q" />}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Yangi kirim">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>MAHSULOT *</label>
            <select ref={productRef} style={selStyle}
              onChange={e => { const p = state.products.find(x => x.id === e.target.value); if (p && priceRef.current) priceRef.current.value = String(p.purchase_price); }}>
              <option value="">Tanlang</option>
              {state.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>TA'MINOTCHI</label>
            <select ref={supplierRef} style={selStyle}>
              <option value="">Tanlang</option>
              {state.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>MIQDOR *</label>
              <input ref={qtyRef} type="number" placeholder="0" style={inpStyle}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>NARX (so'm)</label>
              <input ref={priceRef} type="number" placeholder="0" style={inpStyle}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>HUJJAT RAQAMI</label>
            <input ref={invRef} placeholder="INV-2024-001" style={inpStyle}
              onFocus={e => { e.target.style.borderColor = '#6366f1'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <Button variant="secondary" size="lg" fullWidth onClick={() => setModalOpen(false)}>Bekor</Button>
          <Button variant="success" size="lg" fullWidth icon="fa-plus" onClick={handleAdd} loading={saving}>Qo'shish</Button>
        </div>
      </Modal>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   REPORTS
──────────────────────────────────────────────────────────── */
export function Reports() {
  const { state } = useApp();

  const totalSales    = state.sales.reduce((a, s) => a + s.total, 0);
  const totalExpenses = state.expenses.reduce((a, e) => a + e.amount, 0);
  const totalProfit   = state.sales.reduce((a, s) =>
    a + (s.sale_items || []).reduce((b, i) => b + (i.selling_price - i.purchase_price) * i.quantity, 0), 0);
  const inventoryVal  = state.products.reduce((a, p) => a + p.purchase_price * p.quantity, 0);

  const now = new Date();
  const monthSales = state.sales
    .filter(s => { const d = new Date(s.created_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
    .reduce((a, s) => a + s.total, 0);
  const monthExp = state.expenses
    .filter(e => { const d = new Date(e.created_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
    .reduce((a, e) => a + e.amount, 0);

  const byCat = state.expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <PageHeader title="Hisobotlar" subtitle="Moliyaviy ko'rsatkichlar" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(195px,1fr))', gap: 14, marginBottom: 24 }}>
        <StatCard label="Jami sotuvlar"  value={formatCurrency(totalSales)}    icon="fa-sack-dollar"      color="indigo" />
        <StatCard label="Oy sotuvlari"   value={formatCurrency(monthSales)}    icon="fa-calendar-days"    color="blue"   />
        <StatCard label="Brutto foyda"   value={formatCurrency(totalProfit)}   icon="fa-chart-line"       color="green"  />
        <StatCard label="Jami xarajat"   value={formatCurrency(totalExpenses)} icon="fa-arrow-trend-down" color="red"    />
        <StatCard label="Oy xarajati"    value={formatCurrency(monthExp)}      icon="fa-wallet"           color="yellow" />
        <StatCard label="Ombor qiymati"  value={formatCurrency(inventoryVal)}  icon="fa-warehouse"        color="purple" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card style={{ padding: 22 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 18 }}>Xarajatlar taqsimoti</p>
          {Object.entries(byCat).map(([cat, amt]) => (
            <div key={cat} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>{cat}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#dc2626' }}>{formatCurrency(amt)}</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: '#f1f5f9' }}>
                <div style={{ width: `${(amt / (totalExpenses || 1)) * 100}%`, height: '100%', borderRadius: 3, background: 'linear-gradient(90deg,#ef4444,#dc2626)' }} />
              </div>
            </div>
          ))}
          {Object.keys(byCat).length === 0 && <p style={{ color: '#94a3b8', fontSize: 13 }}>Xarajatlar yo'q</p>}
        </Card>

        <Card style={{ padding: 22 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 18 }}>Moliyaviy xulosa</p>
          {[
            { icon: 'fa-arrow-up',     label: 'Umumiy daromad', value: totalSales,                  color: '#6366f1' },
            { icon: 'fa-arrow-down',   label: 'Umumiy xarajat', value: totalExpenses,               color: '#dc2626' },
            { icon: 'fa-chart-simple', label: 'Brutto foyda',   value: totalProfit,                 color: '#16a34a' },
            { icon: 'fa-bullseye',     label: 'Sof foyda',      value: totalProfit - totalExpenses, color: totalProfit - totalExpenses >= 0 ? '#16a34a' : '#dc2626' },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: r.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`fas ${r.icon}`} style={{ color: r.color, fontSize: 12 }} />
                </div>
                <span style={{ fontSize: 13, color: '#475569' }}>{r.label}</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 800, color: r.color }}>{formatCurrency(r.value)}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   SETTINGS
──────────────────────────────────────────────────────────── */
export function Settings() {
  const { state, dispatch } = useApp();
  const { success, error: toastError } = useToast();
  const [saving, setSaving] = useState(false);
  const nameRef   = useRef<HTMLInputElement>(null);
  const addrRef   = useRef<HTMLInputElement>(null);
  const phoneRef  = useRef<HTMLInputElement>(null);
  const footerRef = useRef<HTMLTextAreaElement>(null);

  const s = state.settings;

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = {
        store_name:     nameRef.current?.value   || '',
        address:        addrRef.current?.value   || '',
        phone:          phoneRef.current?.value  || '',
        receipt_footer: footerRef.current?.value || '',
      };
      await api.updateSettings(updated);
      if (s) dispatch({ type: 'SET_SETTINGS', data: { ...s, ...updated } });
      success('Saqlandi', 'Sozlamalar yangilandi');
    } catch (e: any) { toastError('Xatolik', e.message); }
    setSaving(false);
  };

  const inpStyle: React.CSSProperties = {
    width: '100%', height: 38, padding: '0 12px', border: '1.5px solid #e2e8f0',
    borderRadius: 8, fontSize: 13.5, color: '#0f172a', outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div>
      <PageHeader title="Sozlamalar" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 840 }}>
        <Card style={{ padding: 24 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>
            <i className="fas fa-store" style={{ marginRight: 8, color: '#6366f1' }} />
            Do'kon ma'lumotlari
          </p>
          {[
            { label: "DO'KON NOMI", ref: nameRef,  def: s?.store_name     || '', placeholder: 'Smart Supermarket' },
            { label: 'MANZIL',      ref: addrRef,  def: s?.address        || '', placeholder: 'Toshkent...'       },
            { label: 'TELEFON',     ref: phoneRef, def: s?.phone          || '', placeholder: '+998 71...'        },
          ].map(f => (
            <div key={f.label} style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>{f.label}</label>
              <input ref={f.ref} key={f.def} defaultValue={f.def} placeholder={f.placeholder} style={inpStyle}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          ))}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>CHEK PASTKI MATNI</label>
            <textarea
              ref={footerRef} key={s?.receipt_footer} defaultValue={s?.receipt_footer || ''} rows={3}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13.5, color: '#0f172a', outline: 'none', resize: 'vertical', fontFamily: 'Inter,sans-serif', boxSizing: 'border-box' }}
              onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <Button variant="primary" icon="fa-floppy-disk" size="lg" fullWidth onClick={handleSave} loading={saving}>Saqlash</Button>
        </Card>

        <Card style={{ padding: 24 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>
            <i className="fas fa-database" style={{ marginRight: 8, color: '#6366f1' }} />
            Supabase ma'lumotlari
          </p>
          {[
            ['Project',     'POS-SYSTEM'],
            ['URL',         'sdonbgvvrhswwjgmfagb.supabase.co'],
            ['Region',      'ap-northeast-2 (Seoul)'],
            ['Mahsulotlar', state.products.length],
            ['Sotuvlar',    state.sales.length],
            ['Mijozlar',    state.customers.length],
          ].map(([k, v]) => (
            <div key={String(k)} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>{k}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{v}</span>
            </div>
          ))}
          <div style={{ marginTop: 16, padding: '10px 14px', background: '#f0fdf4', borderRadius: 10, border: '1.5px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} />
            <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>Supabase ulangan</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   USERS
──────────────────────────────────────────────────────────── */
export function Users() {
  const { state, dispatch } = useApp();
  const { success, error: toastError } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const userRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const roleRef = useRef<HTMLSelectElement>(null);

  const handleAdd = async () => {
    const name     = nameRef.current?.value.trim() || '';
    const username = userRef.current?.value.trim() || '';
    const password = passRef.current?.value        || '';
    if (!name || !username || !password) { toastError('Xato', 'Barcha maydonlar shart'); return; }
    setSaving(true);
    try {
      const user = await api.addUser({
        name, username, password,
        role: (roleRef.current?.value as 'admin' | 'cashier') || 'cashier',
        active: true,
      });
      dispatch({ type: 'ADD_USER', user });
      success("Qo'shildi", name);
      setModalOpen(false);
    } catch (e: any) {
      toastError('Xatolik', e.message || 'Username allaqachon mavjud bo\'lishi mumkin');
    }
    setSaving(false);
  };

  const handleToggle = async (user: typeof state.users[0]) => {
    try {
      await api.updateUser(user.id, { active: !user.active });
      dispatch({ type: 'UPDATE_USER', user: { ...user, active: !user.active } });
      success(user.active ? 'Bloklandi' : 'Faollashtirildi', user.name);
    } catch (e: any) { toastError('Xatolik', e.message); }
  };

  const inpStyle: React.CSSProperties = {
    width: '100%', height: 38, padding: '0 12px', border: '1.5px solid #e2e8f0',
    borderRadius: 8, fontSize: 13.5, color: '#0f172a', outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div>
      <PageHeader title="Foydalanuvchilar" subtitle={`${state.users.length} ta foydalanuvchi`}>
        <Button icon="fa-user-plus" onClick={() => setModalOpen(true)}>Foydalanuvchi qo'shish</Button>
      </PageHeader>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
        {state.users.map(user => (
          <Card key={user.id} style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: '50%', background: user.role === 'admin' ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: 'white', flexShrink: 0 }}>
                {user.name.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', margin: 0 }}>{user.name}</p>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>@{user.username}</p>
              </div>
              <Badge color={user.role === 'admin' ? 'yellow' : 'purple'}>
                {user.role === 'admin' ? 'Admin' : 'Kassir'}
              </Badge>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Badge color={user.active ? 'green' : 'red'} dot>
                {user.active ? 'Faol' : 'Bloklangan'}
              </Badge>
              {user.id !== state.currentUser?.id && (
                <Button
                  variant={user.active ? 'ghost' : 'secondary'} size="sm"
                  icon={user.active ? 'fa-lock' : 'fa-lock-open'}
                  style={{ color: user.active ? '#ef4444' : '#16a34a' }}
                  onClick={() => handleToggle(user)}
                >
                  {user.active ? 'Bloklash' : 'Faollashtirish'}
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Yangi foydalanuvchi" width={400}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: "TO'LIQ ISM *", ref: nameRef, type: 'text',     placeholder: 'Ism Familiya' },
            { label: 'USERNAME *',   ref: userRef, type: 'text',     placeholder: 'login_ism'   },
            { label: 'PAROL *',      ref: passRef, type: 'password', placeholder: '••••••••'    },
          ].map(f => (
            <div key={f.label}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>{f.label}</label>
              <input ref={f.ref as React.RefObject<HTMLInputElement>} type={f.type} placeholder={f.placeholder} style={inpStyle}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          ))}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>ROL</label>
            <select ref={roleRef} style={{ ...inpStyle, appearance: 'none', background: '#fff', cursor: 'pointer' }}>
              <option value="cashier">Kassir</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <Button variant="secondary" size="lg" fullWidth onClick={() => setModalOpen(false)}>Bekor</Button>
          <Button variant="primary" size="lg" fullWidth icon="fa-plus" onClick={handleAdd} loading={saving}>Qo'shish</Button>
        </div>
      </Modal>
    </div>
  );
}
