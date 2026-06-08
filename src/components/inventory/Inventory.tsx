import React, { useState, useCallback, useRef } from 'react';
import { useApp } from '../../store/AppContext';
import { DbProduct } from '../../lib/supabase';
import { api } from '../../lib/api';
import { formatCurrency } from '../../utils';
import { Button, Badge, Card, Modal, PageHeader, Table, Tr, Td, EmptyState, StatCard } from '../ui';
import { useToast } from '../ui/Toast';

const UNITS = ['dona', 'kg', 'gram', 'litr', 'metr', 'quti', 'paket'];

type FormState = { name: string; barcode: string; category_id: string; supplier_id: string; purchase_price: string; selling_price: string; quantity: string; unit: string };
const EMPTY: FormState = { name: '', barcode: '', category_id: '', supplier_id: '', purchase_price: '', selling_price: '', quantity: '', unit: 'dona' };

export default function Inventory() {
  const { state, dispatch } = useApp();
  const { success, error: toastError } = useToast();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const formRef = useRef<FormState>({ ...EMPTY });

  const setField = useCallback((key: keyof FormState, val: string) => { formRef.current[key] = val; }, []);

  const openAdd = () => { formRef.current = { ...EMPTY }; setEditingId(null); setModalOpen(true); };
  const openEdit = (p: DbProduct) => {
    formRef.current = { name: p.name, barcode: p.barcode, category_id: p.category_id || '', supplier_id: p.supplier_id || '', purchase_price: String(p.purchase_price), selling_price: String(p.selling_price), quantity: String(p.quantity), unit: p.unit };
    setEditingId(p.id); setModalOpen(true);
  };

  const handleSave = async () => {
    const f = formRef.current;
    if (!f.name.trim()) { toastError('Xato', 'Mahsulot nomi shart'); return; }
    if (!f.selling_price) { toastError('Xato', 'Sotish narxi shart'); return; }
    setSaving(true);
    try {
      const payload = { name: f.name.trim(), barcode: f.barcode.trim(), category_id: f.category_id || null, supplier_id: f.supplier_id || null, purchase_price: Number(f.purchase_price) || 0, selling_price: Number(f.selling_price), quantity: Number(f.quantity) || 0, unit: f.unit, image_url: '' };
      if (editingId) {
        const updated = await api.updateProduct(editingId, payload as any);
        dispatch({ type: 'UPDATE_PRODUCT', product: updated });
        success('Yangilandi', payload.name);
      } else {
        const created = await api.addProduct(payload as any);
        dispatch({ type: 'ADD_PRODUCT', product: created });
        success('Qo\'shildi', payload.name);
      }
      setModalOpen(false);
    } catch (e: any) { toastError('Xatolik', e.message); }
    setSaving(false);
  };

  const handleDelete = async (p: DbProduct) => {
    if (!window.confirm(`"${p.name}" ni o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await api.deleteProduct(p.id);
      dispatch({ type: 'REMOVE_PRODUCT', id: p.id });
      toastError('O\'chirildi', p.name);
    } catch (e: any) { toastError('Xatolik', e.message); }
  };

  const filtered = state.products.filter(p => {
    const ms = p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search);
    const mc = !filterCat || p.category_id === filterCat;
    const mst = !filterStatus || (filterStatus === 'out' ? p.quantity <= 0 : filterStatus === 'low' ? p.quantity > 0 && p.quantity <= 10 : p.quantity > 10);
    return ms && mc && mst;
  });

  const f = formRef.current;
  const inp = (key: keyof FormState, label: string, placeholder: string, type = 'text') => (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>{label}</label>
      <input key={`${editingId}-${key}`} type={type} defaultValue={f[key]} onChange={e => setField(key, e.target.value)} placeholder={placeholder}
        style={{ width: '100%', height: 38, padding: '0 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13.5, color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
        onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
        onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
      />
    </div>
  );

  const sel = (key: keyof FormState, label: string, options: { value: string; label: string }[]) => (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>{label}</label>
      <select key={`${editingId}-${key}`} defaultValue={f[key]} onChange={e => setField(key, e.target.value)}
        style={{ width: '100%', height: 38, padding: '0 32px 0 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13.5, color: '#0f172a', outline: 'none', background: '#fff', appearance: 'none', boxSizing: 'border-box' }}
        onFocus={e => { e.target.style.borderColor = '#6366f1'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  return (
    <div>
      <PageHeader title="Mahsulotlar" subtitle={`${state.products.length} ta mahsulot`}>
        <Button icon="fa-plus" onClick={openAdd}>Mahsulot qo'shish</Button>
      </PageHeader>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        <StatCard label="Jami mahsulot" value={state.products.length} icon="fa-boxes-stacked" color="indigo" />
        <StatCard label="Mavjud" value={state.products.filter(p => p.quantity > 10).length} icon="fa-circle-check" color="green" />
        <StatCard label="Kam qoldi" value={state.products.filter(p => p.quantity > 0 && p.quantity <= 10).length} icon="fa-triangle-exclamation" color="yellow" />
        <StatCard label="Tugagan" value={state.products.filter(p => p.quantity <= 0).length} icon="fa-circle-xmark" color="red" />
      </div>

      <Card style={{ padding: '12px 16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px', position: 'relative' }}>
            <i className="fas fa-magnifying-glass" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 13 }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Qidirish..." style={{ width: '100%', height: 38, padding: '0 12px 0 34px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#0f172a', outline: 'none', boxSizing: 'border-box' }} onFocus={e => { e.target.style.borderColor = '#6366f1'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }} />
          </div>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ height: 38, padding: '0 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#0f172a', outline: 'none', background: '#fff' }}>
            <option value="">Barcha kategoriyalar</option>
            {state.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ height: 38, padding: '0 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#0f172a', outline: 'none', background: '#fff' }}>
            <option value="">Barcha holatlar</option>
            <option value="in">Mavjud</option>
            <option value="low">Kam qoldi</option>
            <option value="out">Tugagan</option>
          </select>
        </div>
      </Card>

      <Card>
        <Table headers={['Mahsulot', 'Kategoriya', 'Barcode', 'Kirish narxi', 'Sotish narxi', 'Miqdor', 'Holat', '']}>
          {filtered.map(p => {
            const cat = state.categories.find(c => c.id === p.category_id);
            const st = p.quantity <= 0 ? { label: 'Tugagan', color: 'red' as const } : p.quantity <= 10 ? { label: 'Kam qoldi', color: 'yellow' as const } : { label: 'Mavjud', color: 'green' as const };
            return (
              <Tr key={p.id}>
                <Td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className="fas fa-box" style={{ color: '#94a3b8', fontSize: 14 }} />
                    </div>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{p.name}</span>
                  </div>
                </Td>
                <Td><span style={{ color: '#64748b' }}>{cat?.name || (p as any).categories?.name || '—'}</span></Td>
                <Td><code style={{ fontSize: 11, background: '#f1f5f9', padding: '2px 6px', borderRadius: 5 }}>{p.barcode || '—'}</code></Td>
                <Td><span style={{ color: '#64748b' }}>{formatCurrency(p.purchase_price)}</span></Td>
                <Td><span style={{ fontWeight: 700, color: '#6366f1' }}>{formatCurrency(p.selling_price)}</span></Td>
                <Td><span style={{ fontWeight: 600 }}>{p.quantity} {p.unit}</span></Td>
                <Td><Badge color={st.color} dot>{st.label}</Badge></Td>
                <Td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Button variant="secondary" size="sm" icon="fa-pen" onClick={() => openEdit(p)}>Tahrir</Button>
                    <Button variant="ghost" size="sm" icon="fa-trash" style={{ color: '#ef4444' }} onClick={() => handleDelete(p)} />
                  </div>
                </Td>
              </Tr>
            );
          })}
        </Table>
        {filtered.length === 0 && <EmptyState icon="fa-box-open" title="Mahsulot topilmadi" />}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'} width={560}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' }}>
          <div style={{ gridColumn: 'span 2' }}>{inp('name', 'MAHSULOT NOMI *', 'Masalan: Coca-Cola 0.5L')}</div>
          {inp('barcode', 'BARCODE', '1234567890123')}
          {sel('category_id', 'KATEGORIYA', [{ value: '', label: 'Tanlang' }, ...state.categories.map(c => ({ value: c.id, label: c.name }))])}
          {sel('supplier_id', "TA'MINOTCHI", [{ value: '', label: 'Tanlang' }, ...state.suppliers.map(s => ({ value: s.id, label: s.name }))])}
          {sel('unit', "O'LCHOV", UNITS.map(u => ({ value: u, label: u })))}
          {inp('purchase_price', 'KIRISH NARXI (so\'m)', '0', 'number')}
          {inp('selling_price', 'SOTISH NARXI (so\'m) *', '0', 'number')}
          {inp('quantity', 'MIQDOR', '0', 'number')}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <Button variant="secondary" size="lg" fullWidth onClick={() => setModalOpen(false)}>Bekor</Button>
          <Button variant="primary" size="lg" fullWidth icon={saving ? 'fa-circle-notch' : editingId ? 'fa-check' : 'fa-plus'} onClick={handleSave} loading={saving}>
            {editingId ? 'Saqlash' : 'Qo\'shish'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
