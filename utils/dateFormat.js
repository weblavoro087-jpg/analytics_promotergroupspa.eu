function normalizeDate(dateStr) {
  if (!dateStr) return null;
  let s = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{8}$/.test(s)) return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const d=+m[1],mo=+m[2],y=+m[3];
    return d>12 ? `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`
         : mo>12 ? `${y}-${String(d).padStart(2,'0')}-${String(mo).padStart(2,'0')}`
         : `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  }
  m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (m) {
    const d=+m[1],mo=+m[2],y=+m[3];
    return d>12 ? `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`
         : mo>12 ? `${y}-${String(d).padStart(2,'0')}-${String(mo).padStart(2,'0')}`
         : `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  }
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 2000)
    return parsed.toISOString().split('T')[0];
  return null;
}

export function formatDate(dateStr, format = 'short') {
  const norm = normalizeDate(dateStr);
  if (!norm) return dateStr || '';
  const [y, m, d] = norm.split('-');
  if (format === 'chart') return `${d}/${m}`;
  if (format === 'full') return `${d}/${m}/${y}`;
  if (format === 'month') {
    const months = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
    return `${d} ${months[parseInt(m)-1]}`;
  }
  return `${d}/${m}/${y}`;
}

export function sortByDate(a, b) {
  if (!a.date && !b.date) return 0;
  if (!a.date) return 1;
  if (!b.date) return -1;
  const na = normalizeDate(a.date) || '';
  const nb = normalizeDate(b.date) || '';
  return na.localeCompare(nb);
}

export function formatTooltipDate(dateStr) {
  const norm = normalizeDate(dateStr);
  if (!norm) return dateStr || '';
  const [y, m, d] = norm.split('-');
  const months = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
  return `${parseInt(d)} ${months[parseInt(m)-1]} ${y}`;
}
