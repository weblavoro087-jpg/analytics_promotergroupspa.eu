'use client';
import React, { useState, useMemo } from 'react';
import { Trophy, TrendingUp, Activity, Search, Download, MousePointerClick, UserPlus, FileText } from 'lucide-react';
import { API_BASE_URL } from '../services/apiConfig';
import { useApiQuery } from '../hooks/useApiQuery';
import { calcSmartDelta } from '../utils/calcDelta';
import TableSearchFilter from './TableSearchFilter';
import CsvExportButton from './CsvExportButton';

// ─── Traduzione eventi GA4 → linguaggio business ───────────────────────────
const prettify = (name) =>
  name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const getEventMeta = (rawName) => {
  const n = (rawName || '').toLowerCase();
  if (/generate_lead|form_submit|^lead$|contact/.test(n))
    return { label: 'Nuovi Contatti Acquisiti (Lead)', kind: 'lead', Icon: UserPlus, color: '#059669' };
  if (/file_download|download/.test(n))
    return { label: 'Download di Brochure e Documenti', kind: 'download', Icon: Download, color: '#2563EB' };
  if (/click/.test(n))
    return { label: 'Click ai Link dei Partner / Social', kind: 'click', Icon: MousePointerClick, color: '#7C3AED' };
  if (/view_search_results|search/.test(n))
    return { label: 'Ricerche Popolari sul Sito', kind: 'search', Icon: Search, color: '#D97706' };
  return { label: prettify(rawName), kind: 'other', Icon: Activity, color: '#64748B' };
};

// Eventi automatici da escludere dal calcolo dell'azione "più frequente"
const AUTO_EVENTS = /page_view|session_start|first_visit|user_engagement|scroll|app_open/;

const fmt = (v) => (typeof v === 'number' ? v : Number(v) || 0).toLocaleString('it-IT');

const DeltaBadge = ({ delta }) => {
  if (!delta) return <span className="text-slate-300">—</span>;
  return (
    <span className={`font-black text-[11px] ${delta.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
      {delta.formatted}
    </span>
  );
};

const KpiCard = ({ Icon, color, label, value, sub }) => (
  <div className="glass rounded-2xl p-5 md:p-6 relative overflow-hidden flex items-center gap-4">
    <div
      className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shrink-0"
      style={{ backgroundColor: color + '1A', color }}
    >
      <Icon className="w-6 h-6 md:w-7 md:h-7" strokeWidth={2.2} />
    </div>
    <div className="min-w-0">
      <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl md:text-3xl font-black text-slate-900 leading-none truncate">{value}</p>
      {sub && <p className="text-[10px] font-bold text-slate-400 mt-1 truncate">{sub}</p>}
    </div>
    <div className="absolute bottom-0 left-0 h-1 w-full opacity-60" style={{ backgroundColor: color }} />
  </div>
);

const EventsPage = ({ propertyId, dates, compareMode, prevDates }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // ─── Logica di fetching GA4 (INVARIATA) ──────────────────────────────────
  const currQuery = propertyId && dates?.start && dates?.end
    ? `propertyId=${propertyId}&startDate=${dates.start}&endDate=${dates.end}`
    : null;
  const prevQuery = compareMode && prevDates?.start && prevDates?.end
    ? `propertyId=${propertyId}&startDate=${prevDates.start}&endDate=${prevDates.end}`
    : null;

  const { data: eventsRaw, isLoading } = useApiQuery(
    currQuery ? `${API_BASE_URL}/api/events-full-report?${currQuery}` : null
  );
  const { data: trendResult } = useApiQuery(
    currQuery ? `${API_BASE_URL}/api/events-trend?${currQuery}` : null
  );
  const { data: prevDataRaw } = useApiQuery(
    prevQuery ? `${API_BASE_URL}/api/events-full-report?${prevQuery}` : null
  );
  const { data: searchTermsRaw } = useApiQuery(
    currQuery ? `${API_BASE_URL}/api/search-terms?${currQuery}` : null
  );

  const events = Array.isArray(eventsRaw) ? eventsRaw : [];
  const prevEvents = Array.isArray(prevDataRaw) ? prevDataRaw : [];
  const searchTerms = Array.isArray(searchTermsRaw) ? searchTermsRaw : [];

  const getPrevEvent = (name, key) => {
    const row = prevEvents.find((e) => e.name === name);
    return row ? row[key] : null;
  };

  // ─── Mappatura in nomi commerciali ───────────────────────────────────────
  const enriched = useMemo(
    () => events.map((e) => ({ ...e, meta: getEventMeta(e.name) })),
    [events]
  );

  // ─── Metriche per le card e il funnel ─────────────────────────────────────
  const stats = useMemo(() => {
    const sumByKind = (kind, key = 'count') =>
      enriched.filter((e) => e.meta.kind === kind).reduce((s, e) => s + (Number(e[key]) || 0), 0);

    const totalUsers = enriched.reduce((m, e) => Math.max(m, Number(e.users) || 0), 0);
    const pageViews = enriched.find((e) => /page_view/.test((e.name || '').toLowerCase()))?.count;
    const visite = Number(pageViews) || totalUsers;

    const leads = sumByKind('lead');
    const leadUsers = sumByKind('lead', 'users');
    const downloads = sumByKind('download');
    const searches = sumByKind('search');

    const conversionRate = totalUsers > 0 ? (leadUsers / totalUsers) * 100 : 0;

    // Azione più frequente fra gli eventi non automatici
    const meaningful = enriched.filter((e) => !AUTO_EVENTS.test((e.name || '').toLowerCase()));
    const top = (meaningful.length ? meaningful : enriched)
      .slice()
      .sort((a, b) => (b.count || 0) - (a.count || 0))[0];

    return {
      visite,
      leads,
      downloads,
      searches,
      conversionRate,
      topAction: top ? top.meta.label : '—',
      topActionCount: top ? top.count : 0,
    };
  }, [enriched]);

  // ─── Stadi del funnel (decrescente) ──────────────────────────────────────
  const funnel = useMemo(() => {
    const stages = [
      { label: 'Visite totali', value: stats.visite, color: '#3B82F6' },
      { label: 'Download / Ricerche', value: stats.downloads + stats.searches, color: '#06B6D4' },
      { label: 'Invio Contatto (Lead)', value: stats.leads, color: '#059669' },
    ];
    const max = Math.max(...stages.map((s) => s.value), 1);
    return stages.map((s, i) => ({
      ...s,
      pct: Math.max((s.value / max) * 100, s.value > 0 ? 6 : 0),
      conv: i > 0 && stages[i - 1].value > 0 ? (s.value / stages[i - 1].value) * 100 : null,
    }));
  }, [stats]);

  // ─── Tabella performance (nomi commerciali) ──────────────────────────────
  const tableRows = useMemo(() => {
    const rows = enriched.map((e) => ({
      key: e.name,
      label: e.meta.label,
      Icon: e.meta.Icon,
      color: e.meta.color,
      count: Number(e.count) || 0,
      users: Number(e.users) || 0,
    }));
    const filtered = searchQuery
      ? rows.filter((r) => r.label.toLowerCase().includes(searchQuery.toLowerCase()))
      : rows;
    return filtered.sort((a, b) => b.count - a.count);
  }, [enriched, searchQuery]);

  // ─── Widget ricerche interne (parole chiave reali dalla dimensione searchTerm) ──
  const searchRows = useMemo(
    () =>
      searchTerms
        .map((s) => ({ label: s.term, count: Number(s.count) || 0, users: Number(s.users) || 0 }))
        .sort((a, b) => b.count - a.count),
    [searchTerms]
  );

  const csvColumns = useMemo(
    () => [
      { label: 'Azione', key: 'label' },
      { label: 'Volume', accessor: (r) => fmt(r.count) },
      { label: 'Utenti', accessor: (r) => fmt(r.users) },
    ],
    []
  );

  if (isLoading)
    return (
      <div className="glass-card py-12 text-center">
        <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="font-black text-[10px] uppercase tracking-widest text-slate-400">Analisi performance in corso...</p>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* ── 3 CARD KPI ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          Icon={Trophy}
          color="#059669"
          label="Totale Conversioni"
          value={fmt(stats.leads)}
          sub="Nuovi contatti acquisiti"
        />
        <KpiCard
          Icon={TrendingUp}
          color="#2563EB"
          label="Tasso di Conversione"
          value={`${stats.conversionRate.toFixed(1)}%`}
          sub="Visitatori che diventano lead"
        />
        <KpiCard
          Icon={Activity}
          color="#7C3AED"
          label="Azione più Frequente"
          value={stats.topAction}
          sub={`${fmt(stats.topActionCount)} interazioni`}
        />
      </div>

      {/* ── FUNNEL ── */}
      <div className="glass-card">
        <div className="mb-5">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Percorso di Conversione</p>
          <h3 className="text-lg font-black text-slate-900">Dalla visita al contatto</h3>
        </div>
        <div className="space-y-3">
          {funnel.map((s, i) => (
            <div key={s.label} className="flex items-center gap-3">
              <div className="w-32 md:w-44 shrink-0 text-right">
                <p className="text-[10px] md:text-xs font-black text-slate-600 uppercase tracking-tight leading-tight">{s.label}</p>
                {s.conv != null && (
                  <p className="text-[9px] font-bold text-slate-400">{s.conv.toFixed(1)}% dello stadio prec.</p>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="h-9 md:h-11 rounded-xl flex items-center px-3 text-white font-black text-xs md:text-sm shadow-sm transition-all duration-700"
                  style={{ width: `${s.pct}%`, backgroundColor: s.color, minWidth: '56px' }}
                >
                  {fmt(s.value)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TABELLA + WIDGET RICERCHE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabella performance */}
        <div className="lg:col-span-2 glass rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200/50 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Performance delle Azioni
              <span className="ml-2 text-slate-400">({tableRows.length})</span>
            </p>
            <div className="flex items-center gap-2">
              <div className="w-40 md:w-48">
                <TableSearchFilter value={searchQuery} onChange={setSearchQuery} placeholder="Cerca azione..." />
              </div>
              <CsvExportButton data={tableRows} columns={csvColumns} filename={`performance-${dates.start}-${dates.end}.csv`} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200/50 bg-slate-50">
                  <th className="px-5 py-3.5 text-left">Azione (in linguaggio business)</th>
                  <th className="px-5 py-3.5 text-right">Volume</th>
                  {compareMode && <th className="px-5 py-3.5 text-right w-20">Δ volume</th>}
                  <th className="px-5 py-3.5 text-right">Utenti coinvolti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tableRows.map((row) => {
                  const delta = compareMode ? calcSmartDelta(row.count, getPrevEvent(row.key, 'count')) : null;
                  const Icon = row.Icon;
                  return (
                    <tr key={row.key} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3 font-bold text-slate-700">
                        <span className="flex items-center gap-2.5">
                          <span
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: row.color + '1A', color: row.color }}
                          >
                            <Icon className="w-3.5 h-3.5" strokeWidth={2.4} />
                          </span>
                          <span className="truncate">{row.label}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-black text-slate-900">{fmt(row.count)}</td>
                      {compareMode && <td className="px-5 py-3 text-right"><DeltaBadge delta={delta} /></td>}
                      <td className="px-5 py-3 text-right font-medium text-slate-600">{fmt(row.users)}</td>
                    </tr>
                  );
                })}
                {tableRows.length === 0 && (
                  <tr>
                    <td colSpan={compareMode ? 4 : 3} className="px-5 py-12 text-center text-slate-400 text-xs font-bold">
                      Nessuna azione registrata in questo periodo
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Widget "Cosa cercano i tuoi clienti?" */}
        <div className="glass rounded-2xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-200/50 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Search className="w-4 h-4" strokeWidth={2.4} />
            </span>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-tight">Cosa cercano i tuoi clienti?</p>
          </div>
          <div className="flex-1 p-4 space-y-2">
            {searchRows.length > 0 ? (
              searchRows.map((s, i) => (
                <div key={i} className="flex items-center justify-between gap-3 border-b border-slate-100 last:border-0 pb-2">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="text-[9px] font-black text-amber-400 w-5 shrink-0">#{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-[11px] font-bold text-slate-600 truncate">{s.label}</span>
                  </span>
                  <span className="text-xs font-black text-amber-600 shrink-0">{fmt(s.count)}</span>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-8 gap-2">
                <FileText className="w-6 h-6 text-slate-300" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nessuna ricerca interna rilevata</p>
                <p className="text-[10px] text-slate-400 max-w-[180px]">Attiva l'evento <span className="font-mono">view_search_results</span> in GA4 per vedere i termini più cercati.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventsPage;
