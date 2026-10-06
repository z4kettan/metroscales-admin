const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });

export function money(v: number | null | undefined) {
  return inr.format(v ?? 0);
}

export function qty(v: number | null | undefined, unit: 'KG' | 'PACK' = 'KG') {
  const n = v ?? 0;
  return unit === 'KG' ? `${n.toFixed(3)} kg` : `${n} pcs`;
}

export function formatMac(mac: string) {
  return mac.match(/.{1,2}/g)?.join(':') ?? mac;
}

export function since(iso: string | null | undefined) {
  if (!iso) return 'Never';
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/// YYYY-MM-DD in the browser's local time
export function isoDay(d = new Date()) {
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
}

export function addDays(day: string, n: number) {
  const d = new Date(day + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return isoDay(d);
}
