import React, { useState } from 'react';
import { useApp } from '../../store/AppContext';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../lib/api';
import { Button, Card, PageHeader } from '../../components/ui';

export function SuperAdminCreateStore() { 
  const { state, dispatch } = useApp();
  const { success, error: toastError } = useToast();
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPlan, setSelectedPlan] = useState('starter');

  // State bilan saqlash — ref emas, chunki step o'zgarsa input yo'qoladi
  const [storeName,   setStoreName]   = useState('');
  const [storePhone,  setStorePhone]  = useState('');
  const [storeAddr,   setStoreAddr]   = useState('');
  const [subExpire,   setSubExpire]   = useState('');
  const [ownerName,   setOwnerName]   = useState('');
  const [ownerUser,   setOwnerUser]   = useState('');
  const [ownerPass,   setOwnerPass]   = useState('');

  const inp: React.CSSProperties = {
    width: '100%', height: 40, padding: '0 12px', border: '1.5px solid #e2e8f0',
    borderRadius: 8, fontSize: 13.5, color: '#0f172a', outline: 'none', boxSizing: 'border-box',
  };
  const focus = (e: any) => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; };
  const blur  = (e: any) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5
  };

  const goToStep2 = () => {
    if (!storeName.trim()) { toastError('Xato', "Filial nomi shart"); return; }
    setStep(2);
  };

  const handleCreate = async () => {
    if (!storeName.trim()) { toastError('Xato', "Filial nomi shart"); return; }
    if (!ownerName.trim() || !ownerUser.trim() || !ownerPass) {
      toastError('Xato', "Egasi ma'lumotlari to'liq emas"); return;
    }
    setSaving(true);
    try {
      const store = await api.createStore({
        name: storeName.trim(),
        phone: storePhone,
        address: storeAddr,
        logo: null,
        subscription_type: selectedPlan as any,
        subscription_expire_date: subExpire || null,
        status: 'active',
      });

      await api.addUser({
        name: ownerName.trim(),
        username: ownerUser.trim(),
        password: ownerPass,
        role: 'owner',
        store_id: store.id,
        active: true,
      });

      dispatch({ type: 'ADD_STORE', store });
      success("Filial yaratildi!", storeName.trim());
      dispatch({ type: 'SET_PAGE', page: 'superadmin_stores' });
    } catch (e: any) {
      toastError('Xatolik', e.message || "Username allaqachon mavjud bo'lishi mumkin");
    }
    setSaving(false);
  };

  const subPlans = [
    { value: 'starter',  label: 'Starter',  desc: "Kichik do'kon",    color: '#f59e0b' },
    { value: 'business', label: 'Business', desc: "O'rta biznes",      color: '#6366f1' },
    { value: 'premium',  label: 'Premium',  desc: "Katta tarmoq",      color: '#7c3aed' },
  ];

  return (
    <div>
      <PageHeader title="Yangi filial yaratish">
        <Button variant="secondary" icon="fa-arrow-left"
          onClick={() => dispatch({ type: 'SET_PAGE', page: 'superadmin_stores' })}>
          Orqaga
        </Button>
      </PageHeader>

      {/* Steps */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24, maxWidth: 560 }}>
        {[
          { n: 1, label: "Filial ma'lumotlari" },
          { n: 2, label: 'Egasi akkaunt' },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: step >= s.n ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: step >= s.n ? 'white' : '#94a3b8',
              }}>{s.n}</div>
              <span style={{ fontSize: 13, fontWeight: step === s.n ? 700 : 400, color: step === s.n ? '#0f172a' : '#94a3b8', whiteSpace: 'nowrap' }}>
                {s.label}
              </span>
            </div>
            {i === 0 && (
              <div style={{ flex: 1, height: 2, background: step >= 2 ? '#6366f1' : '#e2e8f0', margin: '0 12px' }} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div style={{ maxWidth: 560 }}>
        {/* STEP 1 */}
        {step === 1 && (
          <Card style={{ padding: 28 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 22 }}>
              <i className="fas fa-store" style={{ marginRight: 8, color: '#6366f1' }} />
              Filial ma'lumotlari
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>FILIAL NOMI *</label>
                <input
                  value={storeName}
                  onChange={e => setStoreName(e.target.value)}
                  placeholder="Masalan: Oila Market, Yunusobod filiali"
                  style={inp} onFocus={focus} onBlur={blur}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>TELEFON</label>
                  <input value={storePhone} onChange={e => setStorePhone(e.target.value)}
                    placeholder="+998 90 123 45 67" style={inp} onFocus={focus} onBlur={blur} />
                </div>
                <div>
                  <label style={labelStyle}>MANZIL</label>
                  <input value={storeAddr} onChange={e => setStoreAddr(e.target.value)}
                    placeholder="Toshkent, Chilonzor..." style={inp} onFocus={focus} onBlur={blur} />
                </div>
              </div>

              {/* Plan cards */}
              <div>
                <label style={labelStyle}>OBUNA TURI</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                  {subPlans.map(plan => (
                    <div key={plan.value} onClick={() => setSelectedPlan(plan.value)}
                      style={{
                        padding: '12px 14px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                        border: selectedPlan === plan.value ? `2px solid ${plan.color}` : '2px solid #e2e8f0',
                        background: selectedPlan === plan.value ? plan.color + '15' : '#fff',
                      }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: selectedPlan === plan.value ? plan.color : '#0f172a' }}>
                        {plan.label}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{plan.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>OBUNA TUGASH SANASI</label>
                <input type="date" value={subExpire} onChange={e => setSubExpire(e.target.value)}
                  style={inp} onFocus={focus} onBlur={blur} />
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <Button variant="primary" size="lg" fullWidth icon="fa-arrow-right" onClick={goToStep2}>
                Keyingi: Egasi akkaunt
              </Button>
            </div>
          </Card>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <Card style={{ padding: 28 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 22 }}>
              <i className="fas fa-user-tie" style={{ marginRight: 8, color: '#f59e0b' }} />
              Egasi (Owner) akkaunt
            </p>

            {/* Store summary */}
            <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
              <p style={{ fontSize: 12, color: '#166534', margin: 0 }}>
                <i className="fas fa-store" style={{ marginRight: 6 }} />
                <strong>{storeName}</strong> filiali uchun egasi yaratilmoqda
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>TO'LIQ ISM *</label>
                <input value={ownerName} onChange={e => setOwnerName(e.target.value)}
                  placeholder="Javohir Toshmatov" style={inp} onFocus={focus} onBlur={blur} />
              </div>
              <div>
                <label style={labelStyle}>USERNAME *</label>
                <input value={ownerUser} onChange={e => setOwnerUser(e.target.value)}
                  placeholder="javohir_owner" style={inp} onFocus={focus} onBlur={blur} />
              </div>
              <div>
                <label style={labelStyle}>PAROL *</label>
                <input type="password" value={ownerPass} onChange={e => setOwnerPass(e.target.value)}
                  placeholder="••••••••" style={inp} onFocus={focus} onBlur={blur} />
              </div>
              <div style={{ background: '#fefce8', border: '1.5px solid #fde68a', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#92400e' }}>
                <i className="fas fa-info-circle" style={{ marginRight: 6 }} />
                Egasi o'z kassirlarini o'zi qo'sha oladi. Username tizimda yagona bo'lishi shart.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <Button variant="secondary" size="lg" fullWidth icon="fa-arrow-left" onClick={() => setStep(1)}>
                Orqaga
              </Button>
              <Button variant="primary" size="lg" fullWidth icon="fa-check" onClick={handleCreate} loading={saving}>
                Filial yaratish
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
