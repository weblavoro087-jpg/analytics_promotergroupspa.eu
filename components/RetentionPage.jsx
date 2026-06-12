'use client';
import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { API_BASE_URL } from '../services/apiConfig';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);
import { useApiQuery } from '../hooks/useApiQuery';
import { calcSmartDelta } from '../utils/calcDelta';
import { GA4 } from '../lib/gaColors';

const RetentionPage = ({ propertyId, dates, compareMode, prevDates }) => {
  const currUrl = propertyId && dates?.start && dates?.end
    ? `${API_BASE_URL}/api/retention-data?propertyId=${propertyId}&startDate=${dates.start}&endDate=${dates.end}`
    : null;
  const prevUrl = compareMode && prevDates?.start && prevDates?.end
    ? `${API_BASE_URL}/api/retention-data?propertyId=${propertyId}&startDate=${prevDates.start}&endDate=${prevDates.end}`
    : null;

  const { data: rawData, isLoading } = useApiQuery(currUrl);
  const { data: rawPrevData } = useApiQuery(prevUrl);

  const data = Array.isArray(rawData) ? rawData : [];
  const prevData = Array.isArray(rawPrevData) ? rawPrevData : [];

  const getPrevDay = (day, key) => {
    const row = prevData.find(d => d.day === day);
    return row ? row[key] : null;
  };

  const chartData = {
    labels: data.map(d => d.day),
    datasets: [
      {
        label: 'Utenti di Ritorno',
        data: data.map(d => d.returning),
        borderColor: GA4.blue,
        backgroundColor: GA4.blueBg + '99',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#fff',
        pointBorderColor: GA4.blue,
        pointBorderWidth: 2,
        borderWidth: 2.5,
      },
      {
        label: 'Nuovi Utenti',
        data: data.map(d => d.newUsers),
        borderColor: GA4.grey,
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        fill: false,
        tension: 0.4,
        pointRadius: 2,
        pointBackgroundColor: GA4.grey,
        borderWidth: 2,
      }
    ]
  };

  if (isLoading) return <div className="glass-card py-20 text-center"><p className="font-black text-slate-400 animate-pulse text-[10px] uppercase tracking-widest">CALCOLO FIDELIZZAZIONE...</p></div>;

  return (
    <div className="space-y-6">
      <div className="glass-card">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Panoramica Fidelizzazione</p>
        <div className="h-[250px] md:h-[300px] w-full">
          <Line data={chartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 12, font: { size: 10, weight: 'bold' }, color: '#475569' } } } }} />
        </div>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead className="bg-slate-50 border-b border-slate-200/50 text-slate-500 font-black uppercase">
              <tr>
                <th className="px-4 py-3 text-left whitespace-nowrap">Giorno</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Utenti Attivi</th>
                {compareMode && <th className="px-4 py-3 text-right whitespace-nowrap">Δ</th>}
                <th className="px-4 py-3 text-right whitespace-nowrap">Nuovi</th>
                {compareMode && <th className="px-4 py-3 text-right whitespace-nowrap">Δ</th>}
                <th className="px-4 py-3 text-right whitespace-nowrap">Ritorno</th>
                {compareMode && <th className="px-4 py-3 text-right whitespace-nowrap">Δ</th>}
                <th className="px-4 py-3 text-right text-blue-600 whitespace-nowrap">Retention %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.slice(-10).reverse().map((row, i) => {
                const deltaActive = compareMode ? calcSmartDelta(row.active, getPrevDay(row.day, 'active')) : null;
                const deltaNew = compareMode ? calcSmartDelta(row.newUsers, getPrevDay(row.day, 'newUsers')) : null;
                const deltaReturning = compareMode ? calcSmartDelta(row.returning, getPrevDay(row.day, 'returning')) : null;
                return (
                  <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-2 text-slate-700 font-bold whitespace-nowrap">{row.day}</td>
                    <td className="px-4 py-2 text-right font-bold text-slate-900">{row.active}</td>
                    {compareMode && <td className="px-4 py-2 text-right">{deltaActive ? <span className={`font-black ${deltaActive.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>{deltaActive.formatted}</span> : '-'}</td>}
                    <td className="px-4 py-2 text-right text-slate-600">{row.newUsers}</td>
                    {compareMode && <td className="px-4 py-2 text-right">{deltaNew ? <span className={`font-black ${deltaNew.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>{deltaNew.formatted}</span> : '-'}</td>}
                    <td className="px-4 py-2 text-right text-blue-600 font-bold">{row.returning}</td>
                    {compareMode && <td className="px-4 py-2 text-right">{deltaReturning ? <span className={`font-black ${deltaReturning.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>{deltaReturning.formatted}</span> : '-'}</td>}
                    <td className="px-4 py-2 text-right font-black text-blue-600">{row.retentionRate}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RetentionPage;
