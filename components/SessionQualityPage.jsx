'use client';
import React, { useState, useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { API_BASE_URL } from '../services/apiConfig';
import { useApiQuery } from '../hooks/useApiQuery';
import { calcSmartDelta } from '../utils/calcDelta';
import { GA4 } from '../lib/gaColors';
import TableSearchFilter from './TableSearchFilter';
import CsvExportButton from './CsvExportButton';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const SessionQualityPage = ({ propertyId, dates, compareMode, prevDates }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const currQ = propertyId && dates?.start && dates?.end
    ? `propertyId=${propertyId}&startDate=${dates.start}&endDate=${dates.end}`
    : null;
  const prevQ = compareMode && prevDates?.start && prevDates?.end
    ? `${currQ}&prevStartDate=${prevDates.start}&prevEndDate=${prevDates.end}`
    : currQ;

  const { data, isLoading, isError, error } = useApiQuery(
    currQ ? `${API_BASE_URL}/api/engagement-sources?${prevQ}` : null
  );

  const kpi = data?.kpi;
  const prevKpi = data?.prevKpi;
  const sources = data?.sources || [];
  const prevSources = data?.prevSources || [];
  const trend = data?.trend || [];

  const getPrevSource = (source, key) => {
    const row = prevSources.find(s => s.source === source);
    return row ? row[key] : null;
  };

  const filteredSources = useMemo(() => {
    if (!searchQuery) return sources;
    const q = searchQuery.toLowerCase();
    return sources.filter(s => s.source.toLowerCase().includes(q));
  }, [sources, searchQuery]);

  const trendChart = useMemo(() => {
    const labels = trend.map(t => t.date);
    return {
      labels,
      datasets: [
        {
          label: 'Tasso Coinvolgimento %',
          data: trend.map(t => parseFloat(t.engagementRate)),
          borderColor: GA4.blue,
          backgroundColor: GA4.blueBg + '80',
          fill: true,
          tension: 0.4,
          pointRadius: 2,
          pointBackgroundColor: GA4.blue,
          borderWidth: 2,
          yAxisID: 'y',
        },
        {
          label: 'Sessioni',
          data: trend.map(t => t.sessions),
          borderColor: GA4.grey,
          backgroundColor: 'transparent',
          borderDash: [4, 4],
          fill: false,
          tension: 0.3,
          pointRadius: 1.5,
          pointBackgroundColor: GA4.grey,
          borderWidth: 1.5,
          yAxisID: 'y1',
        },
      ],
    };
  }, [trend]);

  const kpiCards = useMemo(() => [
    { label: 'Tasso Coinvolgimento', value: kpi?.engagementRate, prev: prevKpi?.engagementRate, key: 'engagementRate' },
    { label: 'Durata Media Sessione', value: kpi?.avgDuration, prev: prevKpi?.avgDuration, key: 'avgDuration' },
    { label: 'Frequenza di Rimbalzo', value: kpi?.bounceRate, prev: prevKpi?.bounceRate, key: 'bounceRate' },
    { label: 'Sessioni Coinvolgenti', value: kpi?.engagedSessions, prev: prevKpi?.engagedSessions, key: 'engagedSessions' },
  ], [kpi, prevKpi]);

  const csvColumns = useMemo(() => [
    { label: 'Sorgente', key: 'source' },
    { label: 'Sessioni', key: 'sessions' },
    { label: 'Utenti', key: 'users' },
    { label: 'Coinvolgimento', key: 'engagementRate' },
    { label: 'Rimbalzo', key: 'bounceRate' },
    { label: 'Durata Media', key: 'avgDuration' },
  ], []);

  if (isLoading) return (
    <div className="glass rounded-xl p-8 text-center">
      <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-3" />
      <p className="font-black text-[10px] uppercase tracking-widest text-slate-400">Analisi qualità sessioni...</p>
    </div>
  );

  if (isError) {
    return (
      <div className="glass rounded-xl p-8 text-center">
        <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2">ERRORE CARICAMENTO DATI</p>
        <p className="text-xs text-slate-500">{error?.message || 'Impossibile caricare i dati di coinvolgimento'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map(({ label, value, prev, key }) => {
          const delta = compareMode && prev ? calcSmartDelta(value, prev) : null;
          return (
            <div key={key} className="glass rounded-xl p-4 text-center">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
              <p className="text-xl md:text-2xl font-black text-slate-900">{value || '—'}</p>
              {delta && (
                <p className={`text-[10px] font-black mt-1 ${delta.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {delta.formatted}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Trend Chart */}
      <div className="glass rounded-xl p-6">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Andamento Coinvolgimento</p>
        <div className="h-[220px] md:h-[260px]">
          {trend.length > 0 ? (
            <Line
              data={trendChart}
              options={{
                maintainAspectRatio: false,
                interaction: { intersect: false, mode: 'index' },
                plugins: {
                  legend: { position: 'bottom', labels: { boxWidth: 10, padding: 16, font: { size: 10, weight: 'bold' }, color: '#475569' } },
                  tooltip: { backgroundColor: 'rgba(255,255,255,0.95)', titleColor: '#1e293b', bodyColor: '#475569', borderColor: '#e2e8f0', borderWidth: 1, cornerRadius: 12, padding: 12 },
                },
                scales: {
                  y: { beginAtZero: true, max: 100, grid: { color: '#e2e8f0' }, ticks: { font: { size: 9 }, color: '#94a3b8', callback: (v) => v + '%' } },
                  y1: { position: 'right', grid: { display: false }, ticks: { font: { size: 9 }, color: '#94a3b8' } },
                  x: { grid: { display: false }, ticks: { font: { size: 8 }, color: '#94a3b8', maxTicksLimit: 10 } },
                },
              }}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Dati trend non disponibili
            </div>
          )}
        </div>
      </div>

      {/* Sources Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200/50 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Sorgenti per Qualità Sessione
            <span className="ml-2 text-slate-400 font-bold">({sources.length})</span>
          </p>
          <div className="flex items-center gap-2">
            <div className="w-44">
              <TableSearchFilter value={searchQuery} onChange={setSearchQuery} placeholder="Cerca sorgente..." />
            </div>
            <CsvExportButton data={filteredSources} columns={csvColumns} filename={`coinvolgimento-sorgenti-${dates?.start}-${dates?.end}.csv`} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200/50 bg-slate-50">
                <th className="px-5 py-3 text-left">Sorgente</th>
                <th className="px-5 py-3 text-right">Sessioni</th>
                {compareMode && <th className="px-5 py-3 text-right">Δ</th>}
                <th className="px-5 py-3 text-right">Utenti</th>
                <th className="px-5 py-3 text-right">Coinvolgimento</th>
                <th className="px-5 py-3 text-right">Rimbalzo</th>
                <th className="px-5 py-3 text-right">Durata Media</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSources.map((row, i) => {
                const deltaSessions = compareMode ? calcSmartDelta(row.sessions, getPrevSource(row.source, 'sessions')) : null;
                return (
                  <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3 font-bold text-slate-700 capitalize">{row.source}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-700">{row.sessions.toLocaleString('it-IT')}</td>
                    {compareMode && <td className="px-5 py-3 text-right">{deltaSessions ? <span className={`font-black ${deltaSessions.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>{deltaSessions.formatted}</span> : '-'}</td>}
                    <td className="px-5 py-3 text-right font-medium text-slate-600">{row.users.toLocaleString('it-IT')}</td>
                    <td className="px-5 py-3 text-right font-bold" style={{ color: parseFloat(row.engagementRate) > 50 ? '#059669' : parseFloat(row.engagementRate) > 30 ? '#D97706' : '#DC2626' }}>{row.engagementRate}</td>
                    <td className="px-5 py-3 text-right font-medium text-slate-600">{row.bounceRate}</td>
                    <td className="px-5 py-3 text-right font-mono text-slate-600">{row.avgDuration}</td>
                  </tr>
                );
              })}
              {filteredSources.length === 0 && (
                <tr><td colSpan={compareMode ? 7 : 6} className="py-12 text-center text-slate-400 text-xs font-bold">
                  {searchQuery ? 'Nessuna sorgente trovata' : 'Nessun dato di coinvolgimento disponibile'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SessionQualityPage;
