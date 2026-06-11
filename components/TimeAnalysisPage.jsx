'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE_URL } from '../services/apiConfig';

const daysLabels = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
const hoursLabels = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));

const TimeAnalysisPage = ({ propertyId, dates, compareMode, prevDates }) => {
  const [data, setData] = useState({ current: [], previous: null });
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const visibleHours = useMemo(() => {
    if (!isMobile) return hoursLabels;
    return hoursLabels.filter((_, i) => i % 4 === 0);
  }, [isMobile]);

  useEffect(() => {
    if (!propertyId || !dates?.start || !dates?.end) return;
    setLoading(true);

    let url = `${API_BASE_URL}/api/traffic-by-time?propertyId=${propertyId}&startDate=${dates.start}&endDate=${dates.end}`;
    if (compareMode && prevDates) {
      url += `&prevStartDate=${prevDates.start}&prevEndDate=${prevDates.end}`;
    }

    fetch(url)
      .then(r => r.json())
      .then(d => {
        setData({
          current: Array.isArray(d.current) ? d.current : Array.isArray(d) ? d : [],
          previous: d.previous || null,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [propertyId, dates, compareMode, prevDates]);

  const currentData = data.current;
  const prevData = data.previous;

  const getPrevValue = (day, hour, key) => {
    if (!prevData) return 0;
    const row = prevData.find(d => parseInt(d.day) === day && d.hour === hour);
    return row ? (row[key] || 0) : 0;
  };

  const getInsights = () => {
    if (currentData.length === 0) return null;
    const peak = [...currentData].sort((a, b) => b.sessions - a.sessions)[0];
    const morning = currentData.filter(d => parseInt(d.hour) >= 6 && parseInt(d.hour) < 12).reduce((a, b) => a + b.sessions, 0);
    const afternoon = currentData.filter(d => parseInt(d.hour) >= 12 && parseInt(d.hour) < 18).reduce((a, b) => a + b.sessions, 0);
    const evening = currentData.filter(d => parseInt(d.hour) >= 18 || parseInt(d.hour) < 6).reduce((a, b) => a + b.sessions, 0);
    let bestFascia = 'Mattina';
    if (afternoon > morning && afternoon > evening) bestFascia = 'Pomeriggio';
    if (evening > morning && evening > afternoon) bestFascia = 'Sera/Notte';
    const dailyTotals = daysLabels.map((label, idx) => {
      const total = currentData.filter(d => parseInt(d.day) === idx).reduce((acc, curr) => acc + parseInt(curr.sessions), 0);
      const prevTotal = prevData
        ? prevData.filter(d => parseInt(d.day) === idx).reduce((acc, curr) => acc + parseInt(curr.sessions), 0)
        : 0;
      return { label, total, prevTotal };
    });
    const worstDay = [...dailyTotals].sort((a, b) => a.total - b.total)[0];
    return { peak, bestFascia, dailyTotals, worstDay };
  };

  const insights = getInsights();

  const getColor = (val, prevVal) => {
    if (!val) return 'bg-slate-50';
    if (compareMode && prevVal !== undefined) {
      const delta = val - prevVal;
      if (delta > 10) return 'bg-emerald-200 text-emerald-900';
      if (delta < -10) return 'bg-red-200 text-red-900';
    }
    if (val < 10) return 'bg-blue-100 text-blue-800';
    if (val < 50) return 'bg-blue-300 text-blue-900';
    if (val < 100) return 'bg-blue-500 text-white';
    return 'bg-blue-700 text-white font-black shadow-inner';
  };

  if (loading) return (
    <div className="glass-card py-20 text-center">
      <p className="font-black text-slate-400 animate-pulse text-[10px] uppercase tracking-widest">Mappatura dei flussi orari...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {insights && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Momento d'Oro</p>
            <p className="text-xl font-black text-slate-900 italic">
              {daysLabels[parseInt(insights.peak.day)]} <span className="text-blue-600">@{insights.peak.hour}:00</span>
            </p>
            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase italic">
              {insights.peak.sessions} sessioni
              {compareMode && prevData && (() => {
                const prev = getPrevValue(parseInt(insights.peak.day), insights.peak.hour, 'sessions');
                if (prev > 0) {
                  const delta = ((insights.peak.sessions - prev) / prev * 100);
                  const isPos = delta >= 0;
                  return (
                    <span className={isPos ? 'text-emerald-500' : 'text-red-500'}>
                      {' '}({isPos ? '+' : ''}{delta.toFixed(1)}%)
                    </span>
                  );
                }
                return null;
              })()}
            </p>
          </div>
          <div className="glass-card">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Volume per Fascia</p>
            <p className="text-xl font-black text-slate-900 uppercase italic">{insights.bestFascia}</p>
            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase italic">Fascia redditizia</p>
          </div>
          <div className="bg-blue-600 p-5 rounded-2xl border border-blue-500 shadow-lg">
            <p className="text-[9px] font-black text-blue-100 uppercase tracking-[0.2em] mb-1">Consiglio Strategico</p>
            <p className="text-[11px] font-black text-white leading-tight uppercase italic">
              Posta contenuti 30 min prima delle {insights.peak.hour}:00
            </p>
            <p className="text-[10px] text-blue-200 font-bold mt-1 uppercase italic">Intercetta l'onda</p>
          </div>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mappa di Calore</p>
            <p className="text-[9px] text-slate-400 font-bold italic mt-1">Incrocio Giorno/Ora</p>
          </div>
          <div className="flex gap-2 items-center text-[8px] font-black uppercase text-slate-400 bg-white/60 px-3 py-1.5 rounded-full border border-slate-200/50">
            <span>Low</span>
            <div className="flex gap-0.5">
              {[100, 300, 500, 700].map(c => (
                <div key={c} className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: `hsl(221, 83%, ${c > 500 ? 60 - (c - 500) / 20 : 80 - c / 20}%)` }} />
              ))}
            </div>
            <span>High</span>
            {compareMode && <span className="ml-1 text-amber-500">(colori = delta)</span>}
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full table-fixed border-separate border-spacing-[1px]">
            <thead>
              <tr>
                <th className="w-8"></th>
                {hoursLabels.map(h => (
                  <th key={h} className="text-[6px] md:text-[7px] font-black text-slate-400 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {daysLabels.map((dayName, dayIdx) => (
                <tr key={dayName} className="group">
                  <td className="text-[9px] font-black text-slate-400 group-hover:text-slate-800 transition-colors uppercase pr-2 text-right">{dayName}</td>
                  {hoursLabels.map(hour => {
                    const entry = currentData.find(d => parseInt(d.day) === dayIdx && d.hour === hour);
                    const val = entry ? entry.sessions : 0;
                    const prevVal = getPrevValue(dayIdx, hour, 'sessions');
                    return (
                      <td
                        key={hour}
                        className={`h-5 md:h-6 rounded-[2px] text-[6px] md:text-[7px] text-center transition-all hover:scale-110 hover:z-10 hover:shadow-md cursor-pointer ${getColor(val, prevVal)}`}
                        title={`${dayName} ore ${hour}:00 - ${val} sessioni${compareMode ? ` (precedente: ${prevVal})` : ''}`}
                      >
                        {val > 5 ? val : ''}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {insights && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card min-h-[250px]">
            <p className="text-[10px] font-black text-slate-500 uppercase text-center mb-6 tracking-widest">Volume Totale Settimanale</p>
            <div className="flex items-end justify-between h-32 px-2 gap-3 border-b border-slate-200/50">
              {insights.dailyTotals.map((d, i) => {
                const maxTotal = Math.max(...insights.dailyTotals.map(x => x.total));
                const height = maxTotal > 0 ? (d.total / maxTotal) * 100 : 0;
                const prevHeight = maxTotal > 0 && d.prevTotal > 0 ? (d.prevTotal / maxTotal) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                    <div className="absolute -top-8 glass-strong text-slate-800 text-[9px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-30 font-black whitespace-nowrap shadow-md">
                      {d.total} sess. {compareMode && d.prevTotal > 0 ? `(prec: ${d.prevTotal})` : ''}
                    </div>
                    {compareMode && prevHeight > 0 && (
                      <div
                        className="w-full rounded-t-md bg-slate-200 transition-all"
                        style={{ height: `${prevHeight}%`, minHeight: '2px' }}
                      />
                    )}
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-700 group-hover:shadow-lg"
                      style={{ height: `${height}%`, minHeight: d.total > 0 ? '4px' : '0px' }}
                    />
                    <div className="text-[9px] font-black text-slate-500 mt-1 uppercase italic">{d.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-red-50/60 backdrop-blur-sm p-6 rounded-2xl border border-red-100/60 flex flex-col justify-center items-center text-center group hover:bg-red-100/80 transition-all duration-300">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 text-red-500 group-hover:rotate-12 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
            <p className="text-[9px] font-black text-red-400 uppercase tracking-widest">Giorno Critico (Magra)</p>
            <p className="text-2xl font-black text-red-600 uppercase italic">{insights.worstDay.label}</p>
            {compareMode && insights.worstDay.prevTotal > 0 && (() => {
              const delta = ((insights.worstDay.total - insights.worstDay.prevTotal) / insights.worstDay.prevTotal * 100);
              const isPos = delta >= 0;
              return (
                <p className={`text-[10px] font-bold mt-1 uppercase italic ${isPos ? 'text-emerald-500' : 'text-red-400'}`}>
                  {isPos ? '+' : ''}{delta.toFixed(1)}% vs periodo precedente
                </p>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeAnalysisPage;
