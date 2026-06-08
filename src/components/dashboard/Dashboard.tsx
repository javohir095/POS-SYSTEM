import React, { useMemo } from 'react';
import { useApp } from '../../store/AppContext';
import { StatCard, Card, PageHeader, Button, Badge, Table, Tr, Td } from '../ui';
import { formatCurrency, isToday, isThisWeek, isThisMonth } from '../../utils';

export default function Dashboard() {
  const { state, dispatch } = useApp();

  const s = useMemo(() => {
    const todaySales = state.sales.filter(s => isToday(s.created_at));
    const weekSales = state.sales.filter(s => isThisWeek(s.created_at));
    const monthSales = state.sales.filter(s => isThisMonth(s.created_at));
    const todayTotal = todaySales.reduce((a, s) => a + s.total, 0);
    const weekTotal = weekSales.reduce((a, s) => a + s.total, 0);
    const monthTotal = monthSales.reduce((a, s) => a + s.total, 0);
    const totalProfit = state.sales.reduce((a, s) => a + (s.sale_items || []).reduce((b, i) => b + (i.selling_price - i.purchase_price) * i.quantity, 0), 0);
    const inventoryVal = state.products.reduce((a, p) => a + p.purchase_price * p.quantity, 0);
    const totalDebt = state.customers.reduce((a, c) => a + c.total_debt, 0);
    const chartData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const amount = state.sales.filter(s => new Date(s.created_at).toDateString() === d.toDateString()).reduce((a, s) => a + s.total, 0);
      return { label: d.toLocaleDateString('uz-UZ', { weekday: 'short' }), amount };
    });
    const productMap: Record<string, number> = {};
    state.sales.forEach(s => (s.sale_items || []).forEach(i => { productMap[i.product_name] = (productMap[i.product_name] || 0) + i.quantity; }));
    const topProducts = Object.entries(productMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { todayTotal, weekTotal, monthTotal, totalProfit, inventoryVal, totalDebt, todayCount: todaySales.length, chartData, topProducts };
  }, [state.sales, state.products, state.customers]);

  const maxChart = Math.max(...s.chartData.map(d => d.amount), 1);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={new Date().toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}>
        <Button icon="fa-cash-register" onClick={() => dispatch({ type: 'SET_PAGE', page: 'pos' })}>Kassani ochish</Button>
      </PageHeader>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        <StatCard label="Bugungi sotuv" value={formatCurrency(s.todayTotal)} icon="fa-sack-dollar" color="indigo" trend={`${s.todayCount} ta`} trendUp />
        <StatCard label="Haftalik sotuv" value={formatCurrency(s.weekTotal)} icon="fa-calendar-week" color="blue" />
        <StatCard label="Oylik sotuv" value={formatCurrency(s.monthTotal)} icon="fa-calendar-days" color="green" />
        <StatCard label="Umumiy foyda" value={formatCurrency(s.totalProfit)} icon="fa-chart-line" color="purple" />
        <StatCard label="Ombor qiymati" value={formatCurrency(s.inventoryVal)} icon="fa-warehouse" color="yellow" />
        <StatCard label="Umumiy qarz" value={formatCurrency(s.totalDebt)} icon="fa-hand-holding-dollar" color="red" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, marginBottom: 20 }}>
        {/* Bar chart */}
        <Card style={{ padding: 20 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>So'nggi 7 kunlik sotuv</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 150 }}>
            {s.chartData.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                {d.amount > 0 && <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{(d.amount / 1000).toFixed(0)}K</p>}
                <div style={{ width: '100%', borderRadius: '6px 6px 0 0', height: Math.max(4, (d.amount / maxChart) * 110), background: i === 6 ? 'linear-gradient(180deg, #6366f1, #8b5cf6)' : '#ede9fe', transition: 'height 0.3s' }} />
                <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, textTransform: 'capitalize' }}>{d.label}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Top products */}
        <Card style={{ padding: 20 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Top mahsulotlar</p>
          {s.topProducts.length === 0
            ? <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>Ma'lumot yo'q</p>
            : s.topProducts.map(([name, qty], i) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ width: 22, height: 22, borderRadius: 7, background: ['#ede9fe', '#dbeafe', '#dcfce7', '#fef9c3', '#fee2e2'][i], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: ['#6366f1', '#2563eb', '#16a34a', '#ca8a04', '#dc2626'][i], flexShrink: 0 }}>{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
                  <div style={{ height: 3, borderRadius: 2, background: '#f1f5f9', marginTop: 3 }}>
                    <div style={{ width: `${(qty / (s.topProducts[0]?.[1] || 1)) * 100}%`, height: '100%', borderRadius: 2, background: ['#6366f1', '#2563eb', '#16a34a', '#ca8a04', '#dc2626'][i] }} />
                  </div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', flexShrink: 0 }}>{qty}</span>
              </div>
            ))
          }
        </Card>
      </div>

      {/* Recent sales */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1.5px solid #f8fafc' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>So'nggi sotuvlar</p>
          <Button variant="ghost" size="sm" iconRight="fa-arrow-right" onClick={() => dispatch({ type: 'SET_PAGE', page: 'sales' })}>Barchasini ko'rish</Button>
        </div>
        <Table headers={['#', 'Kassir', 'Mahsulotlar', "To'lov turi", 'Summa', 'Vaqt']}>
          {state.sales.slice(0, 7).map(sale => (
            <Tr key={sale.id}>
              <Td><span style={{ fontFamily: 'monospace', fontSize: 12, color: '#94a3b8' }}>#{sale.id.slice(-6).toUpperCase()}</span></Td>
              <Td><span style={{ fontWeight: 600, color: '#0f172a' }}>{sale.cashier_name}</span></Td>
              <Td><span style={{ color: '#64748b' }}>{(sale.sale_items || []).length} ta mahsulot</span></Td>
              <Td>
                <Badge color={sale.payment_method === 'cash' ? 'green' : sale.payment_method === 'card' ? 'blue' : 'red'} dot>
                  {sale.payment_method === 'cash' ? 'Naqd' : sale.payment_method === 'card' ? 'Karta' : 'Qarz'}
                </Badge>
              </Td>
              <Td><span style={{ fontWeight: 700, color: '#0f172a' }}>{formatCurrency(sale.total)}</span></Td>
              <Td><span style={{ color: '#94a3b8', fontSize: 12 }}>{new Date(sale.created_at).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span></Td>
            </Tr>
          ))}
        </Table>
        {state.sales.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Sotuvlar yo'q</div>}
      </Card>
    </div>
  );
}
