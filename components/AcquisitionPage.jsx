import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { API_BASE_URL } from '../services/apiConfig';
import { calcSmartDelta } from '../utils/calcDelta';
import { GA4_PALETTE } from '../lib/gaColors';
import TableSearchFilter from './TableSearchFilter';
import CsvExportButton from './CsvExportButton';

const COLORS = GA4_PALETTE;

const TableHeader = ({ title, compareMode }) => (
  <thead>
    <tr className="text-[10px] font-black text-slate-500 uppercase tracking-tight border-b border-slate-200/50 bg-slate-50">
      <th className="px-4 py-3 text-left w-1/3">{title}</th>
      <th className="px-4 py-3 text-right">Totale utenti</th>
      {compareMode && <th className="px-4 py-3 text-right">Δ utenti</th>}
      <th className="px-4 py-3 text-right">Sessioni</th>
      {compareMode && <th className="px-4 py-3 text-right">Δ sessioni</th>}
      <th className="px-4 py-3 text-right">Frequenza di rimbalzo</th>
      <th className="px-4 py-3 text-right">Durata media</th>
    </tr>
  </thead>
);

const Row = ({ item, compareMode, getPrev, channelKey }) => (
  <tr className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
    <td className="px-4 py-2.5 text-xs font-bold text-slate-700">{item[channelKey]}</td>
    <td className="px-4 py-2.5 text-xs text-right font-semibold text-slate-700">{item.users}</td>
    {compareMode && (
      <td className="px-4 py-2.5 text-xs text-right">
        {(() => {
          const delta = calcSmartDelta(item.users, getPrev(item[channelKey], 'users'));
          return delta ? <span className={delta.isPositive ? 'text-emerald-600 font-black' : 'text-rose-600 font-black'}>{delta.formatted}</span> : '-';
        })()}
      </td>
    )}
    <td className="px-4 py-2.5 text-xs text-right font-semibold text-slate-700">{item.sessions}</td>
    {compareMode && (
      <td className="px-4 py-2.5 text-xs text-right">
        {(() => {
          const delta = calcSmartDelta(item.sessions, getPrev(item[channelKey], 'sessions'));
          return delta ? <span className={delta.isPositive ? 'text-emerald-600 font-black' : 'text-rose-600 font-black'}>{delta.formatted}</span> : '-';
        })()}
      </td>
    )}
    <td className="px-4 py-2.5 text-xs text-right font-medium text-slate-500">{item.bounceRate}</td>
    <td className="px-4 py-2.5 text-xs text-right font-medium text-slate-500">{item.avgDuration}</td>
  </tr>
);

const chartTooltipStyle = {
  background: 'rgba(255,255,255,0.95)',
  backdropFilter: 'blur(8px)',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  color: '#1e293b',
  fontSize: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

const AcquisitionPage = ({ propertyId, dates, compareMode, prevDates }) => {
  const [channels, setChannels] = useState([]);
  const [sources, setSources] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prevChannels, setPrevChannels] = useState([]);
  const [prevSources, setPrevSources] = useState([]);
  const [channelSearch, setChannelSearch] = useState('');
  const [sourceSearch, setSourceSearch] = useState('');

  useEffect(() => {
    if (!propertyId) return;
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE_URL}/api/channel-report?propertyId=${propertyId}&startDate=${dates.start}&endDate=${dates.end}`).then(r => r.json()),
      fetch(`${API_BASE_URL}/api/top-sources-full?propertyId=${propertyId}&startDate=${dates.start}&endDate=${dates.end}`).then(r => r.json()),
      fetch(`${API_BASE_URL}/api/channel-monthly-chart?propertyId=${propertyId}`).then(r => r.json()),
    ])
      .then(([c, s, m]) => {
        setChannels(Array.isArray(c) ? c : []);
        setSources((Array.isArray(s) ? s : []).map(item => ({
          ...item,
          usersNumeric: parseInt(item.users?.toString().replace(/\./g, '') || 0)
        })));
        setMonthlyData(Array.isArray(m) ? m : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Errore generale:", err);
        setLoading(false);
      });
  }, [propertyId, dates]);

  useEffect(() => {
    if (!compareMode || !prevDates || !propertyId) {
      setPrevChannels([]);
      setPrevSources([]);
      return;
    }
    fetch(`${API_BASE_URL}/api/channel-report?propertyId=${propertyId}&startDate=${prevDates.start}&endDate=${prevDates.end}`)
      .then(r => r.json()).then(d => setPrevChannels(Array.isArray(d) ? d : [])).catch(() => setPrevChannels([]));
    fetch(`${API_BASE_URL}/api/top-sources-full?propertyId=${propertyId}&startDate=${prevDates.start}&endDate=${prevDates.end}`)
      .then(r => r.json()).then(d => setPrevSources(Array.isArray(d) ? d : [])).catch(() => setPrevSources([]));
  }, [propertyId, compareMode, prevDates]);

  const getPrevChannel = (name, key) => {
    const row = prevChannels.find(c => c.channel === name);
    return row ? row[key] : null;
  };
  const getPrevSource = (name, key) => {
    const row = prevSources.find(s => s.name === name);
    return row ? row[key] : null;
  };
  const channelKeys = monthlyData.length > 0
    ? Object.keys(monthlyData[0]).filter(key => key !== 'name')
    : [];

  const filteredChannels = useMemo(() => {
    if (!channelSearch) return channels;
    const q = channelSearch.toLowerCase();
    return channels.filter(r => r.channel?.toLowerCase().includes(q));
  }, [channels, channelSearch]);

  const filteredSources = useMemo(() => {
    if (!sourceSearch) return sources.slice(0, 10);
    const q = sourceSearch.toLowerCase();
    return sources.filter(r => r.name?.toLowerCase().includes(q)).slice(0, 10);
  }, [sources, sourceSearch]);

  const channelCsvColumns = useMemo(() => [
    { label: 'Canale', key: 'channel' },
    { label: 'Totale utenti', key: 'users' },
    { label: 'Sessioni', key: 'sessions' },
    { label: 'Frequenza di rimbalzo', key: 'bounceRate' },
    { label: 'Durata media', key: 'avgDuration' },
  ], []);

  const sourceCsvColumns = useMemo(() => [
    { label: 'Sorgente', key: 'name' },
    { label: 'Totale utenti', key: 'users' },
    { label: 'Sessioni', key: 'sessions' },
    { label: 'Frequenza di rimbalzo', key: 'bounceRate' },
    { label: 'Durata media', key: 'avgDuration' },
  ], []);

  if (loading) return (
    <div className="glass-card py-20 text-center">
      <p className="font-black text-slate-400 animate-pulse text-[10px] uppercase tracking-widest">CARICAMENTO DATI ACQUISIZIONE...</p>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Tabella Canali */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200/50 bg-slate-50/40 flex items-center justify-between gap-3">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gruppo di canali principale</p>
          <div className="flex items-center gap-2">
            <div className="w-40">
              <TableSearchFilter value={channelSearch} onChange={setChannelSearch} placeholder="Cerca canale..." />
            </div>
            <CsvExportButton data={filteredChannels} columns={channelCsvColumns} filename={`canali-${dates.start}-${dates.end}.csv`} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <TableHeader title="Canale" compareMode={compareMode} />
            <tbody className="divide-y divide-slate-100">
              {filteredChannels.map((row, i) => (
                <Row key={i} item={row} compareMode={compareMode} getPrev={getPrevChannel} channelKey="channel" />
              ))}
              {filteredChannels.length === 0 && (
                <tr><td colSpan={compareMode ? 7 : 5} className="py-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Nessun canale trovato</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabella Sorgenti */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200/50 bg-slate-50/40 flex items-center justify-between gap-3">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sorgente sessione</p>
          <div className="flex items-center gap-2">
            <div className="w-40">
              <TableSearchFilter value={sourceSearch} onChange={setSourceSearch} placeholder="Cerca sorgente..." />
            </div>
            <CsvExportButton data={filteredSources} columns={sourceCsvColumns} filename={`sorgenti-${dates.start}-${dates.end}.csv`} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <TableHeader title="Sorgente" compareMode={compareMode} />
            <tbody className="divide-y divide-slate-100">
              {filteredSources.map((row, i) => (
                <Row key={i} item={row} compareMode={compareMode} getPrev={getPrevSource} channelKey="name" />
              ))}
              {filteredSources.length === 0 && (
                <tr><td colSpan={compareMode ? 7 : 5} className="py-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Nessuna sorgente trovata</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grafici */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card h-[300px] md:h-[400px]">
          <p className="text-[10px] font-black text-slate-500 uppercase mb-4">Distribuzione Sorgenti (Top 5)</p>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={sources.slice(0, 5)} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="usersNumeric" nameKey="name">
                {sources.slice(0, 5).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(val) => val.toLocaleString('it-IT')} contentStyle={chartTooltipStyle} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', color: '#475569' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 glass-card h-[300px] md:h-[400px]">
          <p className="text-[10px] font-black text-slate-500 uppercase mb-4">Andamento Mensile per Canale</p>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'rgba(226,232,240,0.5)' }} contentStyle={chartTooltipStyle} />
              <Legend iconType="rect" wrapperStyle={{ fontSize: '10px', color: '#475569', paddingTop: '10px' }} />
              {channelKeys.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  stackId="a"
                  fill={COLORS[index % COLORS.length]}
                  radius={index === channelKeys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AcquisitionPage;
