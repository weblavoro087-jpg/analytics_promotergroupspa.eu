import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../services/apiConfig';
import { calcSmartDelta } from '../utils/calcDelta';

const LandingPagesPage = ({ propertyId, dates, compareMode, prevDates }) => {
  const [pages, setPages] = useState([]);
  const [prevPages, setPrevPages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId || !dates?.start || !dates?.end) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/api/landing-pages-report?propertyId=${propertyId}&startDate=${dates.start}&endDate=${dates.end}`)
      .then(r => r.json())
      .then(data => {
        setPages(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [propertyId, dates]);

  useEffect(() => {
    if (!compareMode || !prevDates || !propertyId) {
      setPrevPages([]);
      return;
    }
    fetch(`${API_BASE_URL}/api/landing-pages-report?propertyId=${propertyId}&startDate=${prevDates.start}&endDate=${prevDates.end}`)
      .then(r => r.json())
      .then(d => setPrevPages(Array.isArray(d) ? d : []))
      .catch(() => setPrevPages([]));
  }, [propertyId, compareMode, prevDates]);

  const getPrevPage = (path, key) => {
    const row = prevPages.find(p => (p.path === path) || (path === "(not set)" && p.path === path));
    return row ? row[key] : null;
  };

  if (loading) return <div className="py-20 text-center font-black text-slate-300 animate-pulse uppercase tracking-widest">Analisi Pagine di Atterraggio...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 backdrop-blur-sm bg-white/70 border border-white/20 shadow-xl p-6 rounded-2xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-black uppercase text-slate-400 tracking-widest italic">Top Landing Pages</h2>
        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">Prime Pagine della Sessione</span>
      </div>

      <div className="overflow-hidden border border-slate-100 rounded-lg">
        <table className="w-full text-[11px] border-collapse">
          <thead className="bg-slate-50 font-black uppercase text-slate-500 border-b">
            <tr>
              <th className="px-4 py-3 text-left">Pagina di Atterraggio</th>
              <th className="px-4 py-3 text-right">Sessioni</th>
              {compareMode && <th className="px-4 py-3 text-right">Δ</th>}
              <th className="px-4 py-3 text-right">Utenti</th>
              {compareMode && <th className="px-4 py-3 text-right">Δ</th>}
              <th className="px-4 py-3 text-right">Frequenza Rimbalzo</th>
              <th className="px-4 py-3 text-right">Durata Media</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {pages.map((page, i) => {
              const path = page.path === "(not set)" ? "/" : page.path;
              const deltaSessions = compareMode ? calcSmartDelta(page.sessions, getPrevPage(page.path, 'sessions')) : null;
              const deltaUsers = compareMode ? calcSmartDelta(page.users, getPrevPage(page.path, 'users')) : null;
              return (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-blue-600 truncate max-w-md">{path}</td>
                  <td className="px-4 py-3 text-right font-black text-slate-700">{page.sessions.toLocaleString('it-IT')}</td>
                  {compareMode && <td className="px-4 py-3 text-right">{deltaSessions ? <span className={`font-black ${deltaSessions.isPositive ? 'text-emerald-600' : 'text-red-500'}`}>{deltaSessions.formatted}</span> : '-'}</td>}
                  <td className="px-4 py-3 text-right font-bold text-slate-400">{page.users.toLocaleString('it-IT')}</td>
                  {compareMode && <td className="px-4 py-3 text-right">{deltaUsers ? <span className={`font-black ${deltaUsers.isPositive ? 'text-emerald-600' : 'text-red-500'}`}>{deltaUsers.formatted}</span> : '-'}</td>}
                  <td className={`px-4 py-3 text-right font-bold ${parseFloat(page.bounceRate) > 50 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {page.bounceRate}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-500">{page.avgDuration}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LandingPagesPage;
