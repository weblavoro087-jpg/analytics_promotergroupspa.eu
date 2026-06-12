#!/usr/bin/env node
// Estrae i dati GA4 dalla dashboard e genera il pacchetto per Claude Chat.
//
// USO:
//   1) Avvia la dashboard:  npm run dev   (deve girare su http://localhost:3000)
//   2) In un altro terminale:  node scripts/genera-report.mjs
//
// OPZIONI (variabili d'ambiente, tutte facoltative):
//   START=2026-01-01   data inizio periodo corrente (default: 1° gennaio dell'anno in corso)
//   END=2026-06-11     data fine periodo corrente   (default: ieri)
//   BASE_URL=http://localhost:3000
//   SITE_PASSWORD=Promoter2026     (cookie di autenticazione del sito)
//   PROPERTY_ID=375530383          (default: prima proprietà disponibile)

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const PASSWORD = process.env.SITE_PASSWORD || 'Promoter2026';
const COOKIE = `site_authenticated=${PASSWORD}`;

const iso = (d) => d.toISOString().split('T')[0];
const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return iso(d); };
const startOfYear = () => `${new Date().getFullYear()}-01-01`;

const START = process.env.START || startOfYear();
const END = process.env.END || yesterday();

// Periodo di confronto: 6 mesi prima dell'inizio, fino al giorno prima dell'inizio (come la dashboard).
const prevDates = (start) => {
  const s = new Date(start);
  const ps = new Date(s); ps.setMonth(ps.getMonth() - 6);
  const pe = new Date(s); pe.setDate(pe.getDate() - 1);
  return { start: iso(ps), end: iso(pe) };
};
const PREV = prevDates(START);

const get = async (ep, p) => {
  const qs = new URLSearchParams(p).toString();
  const r = await fetch(`${BASE}/api/${ep}?${qs}`, { headers: { Cookie: COOKIE } });
  if (!r.ok) throw new Error(`${ep} → HTTP ${r.status}: ${await r.text()}`);
  return r.json();
};

const fmtDays = (a, b) =>
  Math.round((new Date(b) - new Date(a)) / 86400000) + 1;

async function main() {
  console.error(`▶ Periodo corrente : ${START} → ${END} (${fmtDays(START, END)} giorni)`);
  console.error(`▶ Periodo confronto: ${PREV.start} → ${PREV.end} (${fmtDays(PREV.start, PREV.end)} giorni)`);

  // Risolvi la proprietà.
  const props = await get('properties', {});
  if (!props.length) throw new Error('Nessuna proprietà GA disponibile.');
  const PROPERTY_ID = process.env.PROPERTY_ID || props[0].id;
  const propName = (props.find((p) => p.id === PROPERTY_ID) || props[0]).name;
  console.error(`▶ Proprietà: ${propName} (${PROPERTY_ID})`);

  const cur = { propertyId: PROPERTY_ID, startDate: START, endDate: END };
  const prv = { propertyId: PROPERTY_ID, startDate: PREV.start, endDate: PREV.end };

  // Estrazione parallela.
  const [
    kpiCur, kpiPrev, chCur, chPrev, sources, pages, devCur, devPrev, users, geo, events,
  ] = await Promise.all([
    get('full-report', cur), get('full-report', prv),
    get('channel-report', cur), get('channel-report', prv),
    get('top-sources-full', cur),
    get('page-urls-report', cur),
    get('device-full-report', cur), get('device-full-report', prv),
    get('user-type-table', cur),
    get('geo-map-data', cur),
    get('events-full-report', cur),
  ]);

  // --- Helpers tabelle markdown ---
  const row = (cells) => `| ${cells.join(' | ')} |`;
  const tbl = (head, rows) =>
    [row(head), row(head.map(() => '---')), ...rows.map(row)].join('\n');

  const kpiTable = tbl(
    ['Metrica', `Corrente`, `Confronto`],
    [
      ['Utenti totali', kpiCur.kpi.totalUsers, kpiPrev.kpi.totalUsers],
      ['Sessioni', kpiCur.kpi.sessions, kpiPrev.kpi.sessions],
      ['Frequenza di rimbalzo', kpiCur.kpi.bounceRate, kpiPrev.kpi.bounceRate],
      ['Durata media sessione', kpiCur.kpi.avgDuration, kpiPrev.kpi.avgDuration],
      ['Tasso di engagement', kpiCur.kpi.engagementRate, kpiPrev.kpi.engagementRate],
    ],
  );

  const chanTable = (data) => tbl(
    ['Canale', 'Utenti', 'Sessioni', 'Bounce', 'Durata'],
    data.map((c) => [c.channel, c.users, c.sessions, c.bounceRate, c.avgDuration]),
  );

  const srcTable = tbl(
    ['Sorgente', 'Utenti', 'Sessioni', 'Bounce', 'Durata'],
    sources.slice(0, 10).map((s) => [s.name, s.users, s.sessions, s.bounceRate, s.avgDuration]),
  );

  const pageTable = tbl(
    ['Pagina', 'Utenti', 'Bounce', 'Durata'],
    pages.slice(0, 10).map((p) => [p.url, p.users, p.bounceRate, p.avgDuration]),
  );

  const devTable = tbl(
    ['Dispositivo', 'Utenti (cur)', 'Bounce (cur)', 'Utenti (prev)', 'Bounce (prev)'],
    devCur.devices.map((d) => {
      const prev = devPrev.devices.find((x) => x.category === d.category) || {};
      return [d.category, d.users, d.bounceRate, prev.users ?? '—', prev.bounceRate ?? '—'];
    }),
  );

  const userTable = tbl(
    ['Tipo', 'Utenti', 'Sessioni', 'Bounce', 'Durata'],
    users.map((u) => [u.type, u.users, u.sessions, u.bounceRate, u.avgDuration]),
  );

  const geoLine = geo.current.slice(0, 14)
    .map((c) => `${c.city} ${c.users}${c.avgDuration === '00:00' ? ' (0:00, possibile bot)' : ''}`)
    .join(' · ');

  const evTable = tbl(
    ['Evento', 'Conteggio', 'Utenti'],
    events.map((e) => [e.name, e.count, e.users]),
  );

  const PROMPT = `## ✦ PROMPT (incolla questo per primo)

> Sei un analista digitale senior specializzato in web analytics e marketing.
> Ti fornisco i dati Google Analytics 4 del sito di **${propName}**.
> Scrivimi un **report professionale in italiano**, pronto da presentare alla direzione, con:
> 1. Sintesi esecutiva (max 6 righe, linguaggio da management).
> 2. Tabella KPI corrente vs confronto, con variazioni % e indicatori 🟢/🔴.
> 3. Analisi per canale: cosa traina la crescita e cosa peggiora la qualità.
> 4. Approfondimenti su sorgenti, pagine, dispositivi, tipo utente, geografia.
> 5. Conclusioni e 5 raccomandazioni operative prioritizzate.
>
> Requisiti: tono professionale, evidenzia i legami causa-effetto tra metriche,
> normalizza dove utile (il periodo corrente può essere più corto del confronto, segnalalo),
> usa tabelle markdown, chiudi con un messaggio "in una frase" per la direzione.`;

  const out = `# Pacchetto per Claude Chat — Report Analytics ${propName}

Copia tutto e incollalo in una nuova conversazione su claude.ai.

---

${PROMPT}

---

## ✦ DATI

**Proprietà:** ${propName}
**Periodo corrente:** ${START} → ${END} (${fmtDays(START, END)} giorni)
**Periodo di confronto:** ${PREV.start} → ${PREV.end} (${fmtDays(PREV.start, PREV.end)} giorni)

### KPI generali
${kpiTable}

### Canali — periodo corrente
${chanTable(chCur)}

### Canali — periodo di confronto
${chanTable(chPrev)}

### Top sorgenti — periodo corrente
${srcTable}

### Pagine più viste — periodo corrente
${pageTable}

### Dispositivi
${devTable}

### Tipologia utenti — periodo corrente
${userTable}

### Geografia (top città) — periodo corrente
${geoLine}

### Eventi — periodo corrente
${evTable}

---
*Generato automaticamente il ${iso(new Date())} da scripts/genera-report.mjs*
`;

  const { writeFileSync } = await import('node:fs');
  const fname = `PROMPT_PER_CLAUDE_CHAT.md`;
  writeFileSync(fname, out, 'utf8');
  console.error(`\n✅ Scritto: ${fname}  (${out.length} caratteri)`);
  console.error('   Apri il file, copia tutto e incollalo su claude.ai.');
}

main().catch((e) => { console.error('\n❌ Errore:', e.message); process.exit(1); });
