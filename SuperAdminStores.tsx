import React, { useState, useRef } from 'react';
import { useApp } from '../../store/AppContext';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../lib/api';
import { DbStore, DbUser } from '../../lib/supabase';
import { Button, Badge, Card, PageHeader, Table, Tr, Td, StatCard, EmptyState, Modal } from '../../components/ui';
import { formatDate } from '../../utils';

type View = 'stores' | 'employees';

export function SuperAdminStores() {  
  const { state, dispatch } = useApp();
  const { success, error: toastError } = useToast();
  const [view, setView] = useState<View>('stores');
  const [selectedStore, setSelectedStore] = useState<DbStore | null>(null);
  const [storeEmployees, setStoreEmployees] = useState<DbUser[]>([]);
  const [loadingEmps, setLoadingEmps] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal states
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [savingEmp, setSavingEmp] = useState(false);

  // Employee form refs
  const empNameRef  = useRef<HTMLInputElement>(null);
  const empUserRef  = useRef<HTMLInputElement>(null);
  const empPassRef  = useRef<HTMLInputElement>(null);
  const empRoleRef  = useRef<HTMLSelectElement>(null);

  const activeCount    = state.stores.filter(s => s.status === 'active').length;
  const suspendedCount = state.stores.filter(s => s.status === 'suspended').length;

  const subColor: Record<string, any> = { starter: 'yellow', business: 'blue', premium: 'purple' };
  const statusColor: Record<string, any> = { active: 'green', suspended: 'red', expired: 'yellow', trial: 'blue' };
  const statusLabel: Record<string, string> = { active: 'Faol', suspended: 'Bloklangan', expired: 'Tugagan', trial: 'Sinov' };

  const openEmployees = async (store: DbStore) => {
    setSelectedStore(store);
    setView('employees');
    setLoadingEmps(true);
    try {
      const emps = await api.getUsers(store.id);
      setStoreEmployees(emps);
    } catch (e: any) { toastError('Xatolik', e.message); }
    setLoadingEmps(false);
  };

  const handleToggleStore = async (store: DbStore) => {
    setActionLoading(store.id);
    try {
      const newStatus = store.status === 'active' ? 'suspended' : 'active';
      await api.updateStore(store.id, { status: newStatus as any });
      dispatch({ type: 'UPDATE_STORE', store: { ...store, status: newStatus as any } });
      success(newStatus === 'active' ? 'Faollashtirildi' : 'Bloklandi', store.name);
    } catch (e: any) { toastError('Xatolik', e.message); }
    setActionLoading(null);
  };

  const handleToggleEmployee = async (emp: DbUser) => {
    try {
      await api.updateUser(emp.id, { active: !emp.active });
      setStoreEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, active: !e.active } : e));
      success(emp.active ? 'Bloklandi' : 'Faollashtirildi', emp.name);
    } catch (e: any) { toastError('Xatolik', e.message); }
  };

  const handleAddEmployee = async () => {
    const name     = empNameRef.current?.value.trim() || '';
    const username = empUserRef.current?.value.trim() || '';
    const password = empPassRef.current?.value || '';
    const role     = (empRoleRef.current?.value as 'owner' | 'cashier') || 'cashier';
    if (!name || !username || !password) { toastError('Xato', 'Barcha maydonlar shart'); return; }
    if (!selectedStore) return;
    setSavingEmp(true);
    try {
      const emp = await api.addUser({ name, username, password, role, store_id: selectedStore.id, active: true });
      setStoreEmployees(prev => [...prev, emp]);
      success("Qo'shildi", name);
      setShowAddEmployee(false);
    } catch (e: any) {
      toastError('Xatolik', e.message || 'Username allaqachon mavjud');
    }
    setSavingEmp(false);
  };

  const inp: React.CSSProperties = {
    width: '100%', height: 38, padding: '0 12px', border: '1.5px solid #e2e8f0',
    borderRadius: 8, fontSize: 13.5, color: '#0f172a', outline: 'none', boxSizing: 'border-box',
  };
  const focus = (e: any) => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; };
  const blur  = (e: any) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; };

  // ── EMPLOYEES VIEW ──────────────────────────────────────
  if (view === 'employees' && selectedStore) {
    return (
      <div>
        <PageHeader
          title={`${selectedStore.name} — Xodimlar`}
          subtitle={`${storeEmployees.length} ta xodim`}
        >
          <Button variant="secondary" icon="fa-arrow-left" onClick={() => setView('stores')}>
            Do'konlar
          </Button>
          <Button icon="fa-user-plus" onClick={() => setShowAddEmployee(true)}>
            Xodim qo'shish
          </Button>
        </PageHeader>

        {/* Store info card */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12, marginBottom: 20 }}>
          <StatCard label="Jami xodimlar"  value={storeEmployees.length} icon="fa-users" color="indigo" />
          <StatCard label="Faol xodimlar"  value={storeEmployees.filter(e => e.active).length} icon="fa-circle-check" color="green" />
          <StatCard label="Egalar (owner)" value={storeEmployees.filter(e => e.role === 'owner').length} icon="fa-user-tie" color="yellow" />
          <StatCard label="Kassirlar"      value={storeEmployees.filter(e => e.role === 'cashier').length} icon="fa-cash-register" color="purple" />
        </div>

        <Card>
          {loadingEmps ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
              <i className="fas fa-circle-notch fa-spin" style={{ fontSize: 24 }} />
            </div>
          ) : (
            <Table headers={['Ism', 'Username', 'Rol', 'Holat', 'Amallar']}>
              {storeEmployees.map(emp => (
                <Tr key={emp.id}>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: emp.role === 'owner' ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'white', flexShrink: 0 }}>
                        {emp.name.charAt(0)}
                      </div>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{emp.name}</span>
                    </div>
                  </Td>
                  <Td><code style={{ fontSize: 12, background: '#f1f5f9', padding: '2px 8px', borderRadius: 5 }}>@{emp.username}</code></Td>
                  <Td>
                    <Badge color={emp.role === 'owner' ? 'yellow' : 'purple'}>
                      {emp.role === 'owner' ? 'Egasi' : 'Kassir'}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge color={emp.active ? 'green' : 'red'} dot>
                      {emp.active ? 'Faol' : 'Bloklangan'}
                    </Badge>
                  </Td>
                  <Td>
                    <Button
                      variant="ghost" size="sm"
                      icon={emp.active ? 'fa-lock' : 'fa-lock-open'}
                      style={{ color: emp.active ? '#ef4444' : '#16a34a' }}
                      onClick={() => handleToggleEmployee(emp)}
                    >
                      {emp.active ? 'Bloklash' : 'Faollashtirish'}
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Table>
          )}
          {!loadingEmps && storeEmployees.length === 0 && (
            <EmptyState icon="fa-users" title="Xodimlar yo'q" subtitle="Yangi xodim qo'shing" />
          )}
        </Card>

        {/* Add employee modal */}
        <Modal open={showAddEmployee} onClose={() => setShowAddEmployee(false)} title="Yangi xodim qo'shish" width={420}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: "TO'LIQ ISM *", ref: empNameRef, type: 'text', placeholder: 'Ism Familiya' },
              { label: 'USERNAME *',   ref: empUserRef, type: 'text', placeholder: 'login_ism' },
              { label: 'PAROL *',      ref: empPassRef, type: 'password', placeholder: '••••••••' },
            ].map(f => (
              <div key={f.label}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>{f.label}</label>
                <input ref={f.ref as React.RefObject<HTMLInputElement>} type={f.type} placeholder={f.placeholder} style={inp} onFocus={focus} onBlur={blur} />
              </div>
            ))}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>ROL</label>
              <select ref={empRoleRef} style={{ ...inp, appearance: 'none', background: '#fff', cursor: 'pointer' }} onFocus={focus} onBlur={blur}>
                <option value="cashier">Kassir</option>
                <option value="owner">Egasi (Owner)</option>
              </select>
            </div>
            <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#166534' }}>
              <i className="fas fa-info-circle" style={{ marginRight: 6 }} />
              <strong>{selectedStore.name}</strong> do'koniga biriktiriladI.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <Button variant="secondary" size="lg" fullWidth onClick={() => setShowAddEmployee(false)}>Bekor</Button>
            <Button variant="primary" size="lg" fullWidth icon="fa-plus" onClick={handleAddEmployee} loading={savingEmp}>Qo'shish</Button>
          </div>
        </Modal>
      </div>
    );
  }

  // ── STORES LIST VIEW ────────────────────────────────────
  return (
    <div>
      <PageHeader title="Do'konlar (Filiallar)" subtitle={`Jami ${state.stores.length} ta filial`}>
        <Button icon="fa-plus" onClick={() => dispatch({ type: 'SET_PAGE', page: 'superadmin_create_store' })}>
          Yangi filial
        </Button>
      </PageHeader>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12, marginBottom: 20 }}>
        <StatCard label="Jami filiallar" value={state.stores.length}  icon="fa-store"        color="indigo" />
        <StatCard label="Faol"           value={activeCount}           icon="fa-circle-check" color="green"  />
        <StatCard label="Bloklangan"     value={suspendedCount}        icon="fa-ban"          color="red"    />
      </div>

      <Card>
        <Table headers={["Filial nomi", 'Telefon', 'Obuna', 'Muddat', 'Holat', 'Xodimlar', 'Amallar']}>
          {state.stores.map(store => {
            const expired = store.subscription_expire_date
              ? new Date(store.subscription_expire_date) < new Date() : false;
            return (
              <Tr key={store.id}>
                <Td>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a', margin: 0 }}>{store.name}</p>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{store.address || '—'}</p>
                  </div>
                </Td>
                <Td><span style={{ color: '#64748b' }}>{store.phone || '—'}</span></Td>
                <Td>
                  <Badge color={subColor[store.subscription_type] || 'yellow'}>
                    {store.subscription_type === 'starter' ? 'Starter' : store.subscription_type === 'business' ? 'Business' : 'Premium'}
                  </Badge>
                </Td>
                <Td>
                  <span style={{ color: expired ? '#dc2626' : '#64748b', fontWeight: expired ? 700 : 400, fontSize: 12 }}>
                    {store.subscription_expire_date
                      ? formatDate(store.subscription_expire_date) + (expired ? ' ⚠' : '') : '—'}
                  </span>
                </Td>
                <Td>
                  <Badge color={statusColor[store.status] || 'yellow'} dot>
                    {statusLabel[store.status] || store.status}
                  </Badge>
                </Td>
                <Td>
                  <Button variant="ghost" size="sm" icon="fa-users" onClick={() => openEmployees(store)}>
                    Ko'rish
                  </Button>
                </Td>
                <Td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Button variant="ghost" size="sm" icon="fa-pen"
                      onClick={() => dispatch({ type: 'SET_PAGE', page: 'superadmin_edit_store' as any, storeId: store.id } as any)}>
                    </Button>
                    <Button
                      variant={store.status === 'active' ? 'ghost' : 'secondary'} size="sm"
                      icon={store.status === 'active' ? 'fa-lock' : 'fa-lock-open'}
                      style={{ color: store.status === 'active' ? '#ef4444' : '#16a34a' }}
                      loading={actionLoading === store.id}
                      onClick={() => handleToggleStore(store)}
                    >
                    </Button>
                  </div>
                </Td>
              </Tr>
            );
          })}
        </Table>
        {state.stores.length === 0 && <EmptyState icon="fa-store" title="Hech qanday filial yo'q" subtitle="Yangi filial qo'shing" />}
      </Card>
    </div>
  );
}
