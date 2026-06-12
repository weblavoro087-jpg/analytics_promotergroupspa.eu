import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { API_BASE_URL } from '../services/apiConfig';
import { calcSmartDelta } from '../utils/calcDelta';
import { GA4, GA4_PALETTE } from '../lib/gaColors';

ChartJS.register(ArcElement, Tooltip, Legend);

const chartColors = GA4_PALETTE.slice(0, 7);

const TableHeader = ({ title, compareMode }) => (
  <thead>
    <tr className="text-[10px] font-black text-slate-500 uppercase tracking-tight border-b border-slate-200/50 bg-slate-50">
      <th className="px-3 py-2.5 text-left border-r border-slate-200/50">{title}</th>
      <th className="px-3 py-2.5 text-right border-r border-slate-200/50 w-24">Totale utenti</th>
      {compareMode && <th className="px-3 py-2.5 text-right border-r border-slate-200/50 w-16">Δ</th>}
      <th className="px-3 py-2.5 text-right border-r border-slate-200/50 w-20">Sessioni</th>
      {compareMode && <th className="px-3 py-2.5 text-right border-r border-slate-200/50 w-16">Δ</th>}
      <th className="px-3 py-2.5 text-right border-r border-slate-200/50 w-24">Rimbalzo</th>
      <th className="px-3 py-2.5 text-right w-32">Durata media</th>
    </tr>
  </thead>
);

const renderDelta = (delta) => {
  if (!delta) return <span className="text-slate-300">-</span>;
  return <span className={delta.isPositive ? 'text-emerald-600 font-black' : 'text-rose-600 font-black'}>{delta.formatted}</span>;
};

const TrafficReportPage = ({ propertyId, dates, compareMode, prevDates }) => {
  const [data, setData] = useState({ pages: [], referrers: [] });
  const [prevData, setPrevData] = useState({ pages: [], referrers: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId || !dates?.start || !dates?.end) return;
    setLoading(true);
    const query = `propertyId=${propertyId}&startDate=${dates.start}&endDate=${dates.end}`;
    Promise.all([
      fetch(`${API_BASE_URL}/api/page-urls-report?${query}`).then(r => r.json()),
      fetch(`${API_BASE_URL}/api/referrers?${query}`).then(r => r.json()),
    ])
      .then(([pages, refs]) => {
        setData({
          pages: Array.isArray(pages) ? pages : [],
          referrers: (Array.isArray(refs) ? refs : []).map(item => ({
            ...item,
            usersNumeric: parseInt((item.users || '0').toString().replace(/\./g, '') || 0),
          })),
        });
        setLoading(false);
      })
      .catch(err => {
        console.error("Errore Fetch Pagina 3:", err);
        setLoading(false);
      });
  }, [propertyId, dates]);

  useEffect(() => {
    if (!compareMode || !prevDates || !propertyId) {
      setPrevData({ pages: [], referrers: [] });
      return;
    }
    const query = `propertyId=${propertyId}&startDate=${prevDates.start}&endDate=${prevDates.end}`;
    Promise.all([
      fetch(`${API_BASE_URL}/api/page-urls-report?${query}`).then(r => r.json()),
      fetch(`${API_BASE_URL}/api/referrers?${query}`).then(r => r.json()),
    ])
      .then(([pages, refs]) => {
        setPrevData({
          pages: Array.isArray(pages) ? pages : [],
          referrers: (Array.isArray(refs) ? refs : []).map(item => ({
            ...item,
            usersNumeric: parseInt((item.users || '0').toString().replace(/\./g, '') || 0),
          })),
        });
      })
      .catch(() => setPrevData({ pages: [], referrers: [] }));
  }, [propertyId, compareMode, prevDates]);

  const getPrevPage = (url, key) => {
    const row = prevData.pages.find(p => p.url === url);
    return row ? row[key] : null;
  };
  const getPrevReferrer = (source, key) => {
    const row = prevData.referrers.find(r => r.source === source);
    return row ? row[key] : null;
  };

  if (loading) return (
    <div className="glass-card py-20 text-center">
      <p className="font-black text-slate-400 animate-pulse text-[10px] uppercase tracking-widest">Generazione Report...</p>
    </div>
  );

  return (
    <div className="glass rounded-2xl p-4 space-y-6">

      {/* Tabella Pagine */}
      <div className="overflow-hidden">
        <div className="px-3 py-3 border-b border-slate-200/50 bg-slate-50/40">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pagina di destinazione</p>
        </div>
        <div className="max-h-[350px] overflow-y-auto">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[10px]">
              <TableHeader title="URL" compareMode={compareMode} />
              <tbody className="divide-y divide-slate-100">
                {data.pages?.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-3 py-1.5 text-slate-600 truncate max-w-[250px] md:max-w-[450px] font-medium">{item.url}</td>
                    <td className="px-3 py-1.5 text-right font-bold text-slate-700">{item.users}</td>
                    {compareMode && <td className="px-3 py-1.5 text-right">{renderDelta(calcSmartDelta(item.users, getPrevPage(item.url, 'users')))}</td>}
                    <td className="px-3 py-1.5 text-right font-bold text-slate-700">{item.sessions}</td>
                    {compareMode && <td className="px-3 py-1.5 text-right">{renderDelta(calcSmartDelta(item.sessions, getPrevPage(item.url, 'sessions')))}</td>}
                    <td className="px-3 py-1.5 text-right font-bold text-slate-500">{item.bounceRate}</td>
                    <td className="px-3 py-1.5 text-right font-bold text-slate-500">{item.avgDuration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Referrer + Doughnut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 overflow-hidden">
          <div className="px-3 py-3 border-b border-slate-200/50 bg-slate-50/40">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Referrer pagina</p>
          </div>
          <div className="max-h-[350px] overflow-y-auto">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[10px]">
                <TableHeader title="Sorgente" compareMode={compareMode} />
                <tbody className="divide-y divide-slate-100">
                  {data.referrers?.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-3 py-1.5 text-blue-600 underline font-medium truncate max-w-[200px] md:max-w-[300px]">{item.source}</td>
                      <td className="px-3 py-1.5 text-right font-bold text-slate-700">{item.users}</td>
                      {compareMode && <td className="px-3 py-1.5 text-right">{renderDelta(calcSmartDelta(item.users, getPrevReferrer(item.source, 'users')))}</td>}
                      <td className="px-3 py-1.5 text-right font-bold text-slate-700">{item.sessions}</td>
                      {compareMode && <td className="px-3 py-1.5 text-right">{renderDelta(calcSmartDelta(item.sessions, getPrevReferrer(item.source, 'sessions')))}</td>}
                      <td className="px-3 py-1.5 text-right font-bold text-slate-500">{item.bounceRate}</td>
                      <td className="px-3 py-1.5 text-right font-bold text-slate-500">{item.avgDuration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 glass rounded-xl p-4 flex flex-col items-center">
          <div className="w-full h-44 relative">
            {data.referrers?.length > 0 && (
              <Doughnut
                data={{
                  labels: data.referrers?.slice(0, 7).map(r => r.source) || [],
                  datasets: [{
                    data: data.referrers?.slice(0, 7).map(r => r.usersNumeric) || [],
                    backgroundColor: chartColors,
                    borderWidth: 2,
                    borderColor: '#fff',
                  }],
                }}
                options={{ cutout: '72%', plugins: { legend: { display: false } }, maintainAspectRatio: false }}
              />
            )}
          </div>
          <div className="mt-6 w-full space-y-1.5">
            {data.referrers?.slice(0, 7).map((item, idx) => {
              const total = data.referrers.reduce((acc, curr) => acc + (Number(curr.usersNumeric) || 0), 0);
              const perc = total > 0 ? ((Number(item.usersNumeric) / total) * 100).toFixed(1) : "0";
              return (
                <div key={idx} className="flex items-center justify-between text-[9px] font-black uppercase text-slate-500 border-b border-slate-100 pb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: chartColors[idx] }} />
                    <span className="truncate max-w-[130px] text-slate-600">{item.source}</span>
                  </div>
                  <span>{perc}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrafficReportPage;
