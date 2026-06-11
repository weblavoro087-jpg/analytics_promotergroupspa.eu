'use client';
import React, { useState, useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { API_BASE_URL } from '../services/apiConfig';
import { useApiQuery } from '../hooks/useApiQuery';
import { calcSmartDelta, calcPercentDelta } from '../utils/calcDelta';
import TableSearchFilter from './TableSearchFilter';
import CsvExportButton from './CsvExportButton';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const NEON = ['#06B6D4', '#8B5CF6', '#10B981', '#F97316', '#EC4899', '#6366F1', '#14B8A6'];

const EVENT_CATEGORIES = {
  'Core Activation': ['login', 'sign_up', 'first_visit', 'trial_started', 'onboarding_complete', 'registration'],
  'Retention': ['session_start', 'user_engagement', 'page_view', 'scroll', 'app_open'],
  'Conversion': ['purchase', 'add_to_cart', 'begin_checkout', 'subscription_created', 'payment_completed'],
  'Vanity': ['view_item', 'view_item_list', 'share', 'favorite', 'like', 'comment'],
};

const categorizeEvent = (name) => {
  const lower = name.toLowerCase();
  for (const [category, patterns] of Object.entries(EVENT_CATEGORIES)) {
    if (patterns.some(p => lower.includes(p))) return category;
  }
  return 'Altro';
};

const categoryColor = (cat) => {
  const map = {
    'Core Activation': '#8B5CF6',
    'Retention': '#06B6D4',
    'Conversion': '#10B981',
    'Vanity': '#F97316',
    'Altro': '#64748B',
  };
  return map[cat] || '#64748B';
};

const formatDuration = (seconds) => {
  if (!seconds || seconds === 0) return '0s';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins > 60) {
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  }
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
};

const StickinessBadge = ({ score }) => {
  let color = 'bg-slate-100 text-slate-600';
  let label = 'Bassa';
  if (score > 70) { color = 'bg-emerald-100 text-emerald-700'; label = 'Alta'; }
  else if (score > 40) { color = 'bg-cyan-100 text-cyan-700'; label = 'Media'; }
  return <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${color}`}>{label} ({score})</span>;
};

const EventCategoryTag = ({ category }) => (
  <span
    className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
    style={{ backgroundColor: categoryColor(category) + '20', color: categoryColor(category) }}
  >
    {category}
  </span>
);

const DeltaBadge = ({ delta }) => {
  if (!delta) return <span className="text-slate-300">—</span>;
  return (
    <span className={`font-black text-[11px] ${delta.isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
      {delta.formatted}
    </span>
  );
};

const generateInsights = (events, prevEvents) => {
  if (!events.length || !prevEvents.length) return [];
  const insights = [];
  events.forEach((e) => {
    const prev = prevEvents.find(p => p.name === e.name);
    if (!prev) return;
    const delta = calcPercentDelta(e.count, prev.count);
    if (delta && Math.abs(delta.value) > 10) {
      insights.push({
        event: e.name,
        direction: delta.isPositive ? 'up' : 'down',
        percent: Math.abs(delta.value).toFixed(1),
        category: categorizeEvent(e.name),
      });
    }
  });
  insights.sort((a, b) => parseFloat(b.percent) - parseFloat(a.percent));
  return insights.slice(0, 3);
};

const EventsPage = ({ propertyId, dates, compareMode, prevDates }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  const events = Array.isArray(eventsRaw) ? eventsRaw : [];
  const prevEvents = Array.isArray(prevDataRaw) ? prevDataRaw : [];
  const trendData = trendResult?.trend ? trendResult : null;

  const getPrevEvent = (name, key) => {
    const row = prevEvents.find(e => e.name === name);
    return row ? row[key] : null;
  };

  const enrichedEvents = useMemo(() => {
    const totalAvgEPU = events.reduce((sum, e) => sum + parseFloat(e.countPerUser || 0), 0) / (events.length || 1);
    return events.map(e => {
      const cat = categorizeEvent(e.name);
      const eps = e.sessions > 0 ? (e.count / e.sessions) : 0;
      const stickiness = totalAvgEPU > 0 ? Math.min(100, Math.round((parseFloat(e.countPerUser) / totalAvgEPU) * 100)) : 0;
      const avgEngagement = e.users > 0 ? e.engagementDuration / e.users : 0;
      return { ...e, category: cat, eventsPerSession: eps, stickinessScore: stickiness, avgEngagement };
    });
  }, [events]);

  const insights = useMemo(() => generateInsights(enrichedEvents, prevEvents), [enrichedEvents, prevEvents]);

  const categories = useMemo(() => {
    const set = new Set(enrichedEvents.map(e => e.category));
    return ['all', ...Array.from(set)];
  }, [enrichedEvents]);

  const filteredEvents = useMemo(() => {
    let result = enrichedEvents;
    if (activeFilter !== 'all') result = result.filter(e => e.category === activeFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e => e.name.toLowerCase().includes(q));
    }
    return result;
  }, [enrichedEvents, activeFilter, searchQuery]);

  const chartData = useMemo(() => {
    if (!trendData || !trendData.trend) return { labels: [], datasets: [] };
    return {
      labels: trendData.labels,
      datasets: trendData.trend.map((t, i) => ({
        label: t.name,
        data: t.data,
        borderColor: NEON[i % NEON.length],
        backgroundColor: NEON[i % NEON.length] + '10',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#fff',
        pointBorderColor: NEON[i % NEON.length],
        pointBorderWidth: 2,
        borderWidth: 2.5,
      })),
    };
  }, [trendData]);

  const csvColumns = useMemo(() => [
    { label: 'Evento', key: 'name' },
    { label: 'Categoria', key: 'category' },
    { label: 'Conteggio', accessor: (r) => r.count.toLocaleString('it-IT') },
    { label: 'Utenti', accessor: (r) => r.users.toLocaleString('it-IT') },
    { label: 'Eventi/Utente', key: 'countPerUser' },
    { label: 'Fidelizzazione', key: 'stickinessScore' },
    { label: 'Engagement Medio', accessor: (r) => formatDuration(r.avgEngagement) },
  ], []);

  if (isLoading) return (
    <div className="glass-card py-12 text-center">
      <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
      <p className="font-black text-[10px] uppercase tracking-widest text-slate-400">Analisi Eventi in corso...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {insights.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50/50 backdrop-blur-lg rounded-2xl border border-amber-200/60 shadow-sm p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-2">Approfondimenti Automatici</p>
              <div className="space-y-1">
                {insights.map((ins, i) => (
                  <p key={i} className="text-xs text-slate-700">
                    <span className="font-black">{ins.event}</span>
                    {ins.direction === 'down' ? (
                      <span className="text-red-600 font-black"> calato del {ins.percent}%</span>
                    ) : (
                      <span className="text-emerald-600 font-black"> cresciuto del {ins.percent}%</span>
                    )}
                    <span className="text-slate-400"> — evento {ins.category}</span>
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Trend Eventi</p>
            <h3 className="text-lg font-black text-slate-900">Andamento nel periodo</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 ${
                  activeFilter === cat
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white/60 text-slate-500 border border-slate-200/60 hover:bg-slate-100'
                }`}
              >
                {cat === 'all' ? 'Tutti' : cat}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[220px] md:h-[260px] w-full">
          {chartData.labels.length > 0 ? (
            <Line
              data={chartData}
              options={{
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      boxWidth: 10,
                      padding: 16,
                      font: { size: 10, weight: 'bold' },
                      color: '#475569',
                    },
                  },
                  tooltip: {
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    titleColor: '#1e293b',
                    bodyColor: '#475569',
                    borderColor: '#e2e8f0',
                    borderWidth: 1,
                    cornerRadius: 12,
                    padding: 12,
                    boxPadding: 6,
                  },
                },
                scales: {
                  y: {
                    grid: { color: '#e2e8f0', drawBorder: false },
                    ticks: { font: { size: 9 }, color: '#94a3b8', maxTicksLimit: 6 },
                  },
                  x: {
                    grid: { display: false },
                    ticks: { font: { size: 9 }, color: '#94a3b8' },
                  },
                },
                interaction: { intersect: false, mode: 'index' },
              }}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-[10px] font-black uppercase tracking-widest">
              Dati trend non disponibili
            </div>
          )}
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {activeFilter === 'all' ? 'Tutti gli eventi' : `Eventi · ${activeFilter}`}
              <span className="ml-2 text-slate-400">({filteredEvents.length})</span>
            </p>
            {activeFilter !== 'all' && (
              <button onClick={() => setActiveFilter('all')} className="text-[9px] font-bold text-cyan-600 hover:text-cyan-700 uppercase tracking-wider">
                Mostra tutti
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-48">
              <TableSearchFilter
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Cerca evento..."
              />
            </div>
            <CsvExportButton
              data={filteredEvents}
              columns={csvColumns}
              filename={`eventi-${dates.start}-${dates.end}.csv`}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200/50 bg-slate-100/60">
                <th className="px-5 py-3.5 text-left w-8">#</th>
                <th className="px-5 py-3.5 text-left">Evento</th>
                <th className="px-5 py-3.5 text-left">Categoria</th>
                <th className="px-5 py-3.5 text-right">Conteggio</th>
                {compareMode && <th className="px-5 py-3.5 text-right w-20">Δ conteggio</th>}
                <th className="px-5 py-3.5 text-right">Utenti totali</th>
                {compareMode && <th className="px-5 py-3.5 text-right w-20">Δ utenti</th>}
                <th className="px-5 py-3.5 text-right">Eventi/utente</th>
                <th className="px-5 py-3.5 text-right">Fidelizzazione</th>
                <th className="px-5 py-3.5 text-right">Engagement medio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvents.map((event, i) => {
                const deltaCount = compareMode ? calcSmartDelta(event.count, getPrevEvent(event.name, 'count')) : null;
                const deltaUsers = compareMode ? calcSmartDelta(event.users, getPrevEvent(event.name, 'users')) : null;
                return (
                  <tr key={event.name} className="hover:bg-white/60 transition-colors group">
                    <td className="px-5 py-3 text-slate-400 font-bold group-hover:text-slate-500">{i + 1}</td>
                    <td className="px-5 py-3 font-bold text-slate-700">{event.name}</td>
                    <td className="px-5 py-3"><EventCategoryTag category={event.category} /></td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-700">{event.count.toLocaleString('it-IT')}</td>
                    {compareMode && <td className="px-5 py-3 text-right"><DeltaBadge delta={deltaCount} /></td>}
                    <td className="px-5 py-3 text-right font-semibold text-slate-700">{event.users.toLocaleString('it-IT')}</td>
                    {compareMode && <td className="px-5 py-3 text-right"><DeltaBadge delta={deltaUsers} /></td>}
                    <td className="px-5 py-3 text-right font-medium text-slate-600">{event.countPerUser}</td>
                    <td className="px-5 py-3 text-right"><StickinessBadge score={event.stickinessScore} /></td>
                    <td className="px-5 py-3 text-right font-medium text-slate-600">{formatDuration(event.avgEngagement)}</td>
                  </tr>
                );
              })}
              {filteredEvents.length === 0 && (
                <tr><td colSpan={10} className="px-5 py-12 text-center text-slate-400 text-xs font-bold">Nessun evento in questa categoria</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EventsPage;
