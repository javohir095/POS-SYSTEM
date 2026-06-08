export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('uz-UZ').format(Math.round(amount)) + " so'm";

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const isToday = (iso: string) => {
  const d = new Date(iso), n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
};
export const isThisWeek = (iso: string) => {
  const d = new Date(iso), n = new Date();
  const start = new Date(n); start.setDate(n.getDate() - n.getDay()); start.setHours(0, 0, 0, 0);
  return d >= start;
};
export const isThisMonth = (iso: string) => {
  const d = new Date(iso), n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth();
};

export const printReceipt = (html: string) => {
  const w = window.open('', '_blank', 'width=400,height=600');
  if (!w) return;
  w.document.write(`<html><head><title>Chek</title><style>body{font-family:monospace;font-size:12px;margin:20px;color:#000}h2{text-align:center;font-size:14px;margin:0}p{margin:2px 0;text-align:center;font-size:11px}.line{border-top:1px dashed #000;margin:8px 0}table{width:100%;border-collapse:collapse;font-size:11px}td{padding:2px}.right{text-align:right}.total{font-weight:bold;font-size:13px}@media print{button{display:none}}</style></head><body>${html}<br><button onclick="window.print()">🖨️ Chop etish</button></body></html>`);
  w.document.close();
};

// generateId — faqat eski kod uchun (Supabase o'zi uuid beradi)
export const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
