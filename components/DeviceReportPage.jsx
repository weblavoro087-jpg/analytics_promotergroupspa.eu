'use client';
import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { API_BASE_URL } from '../services/apiConfig';
import { useApiQuery } from '../hooks/useApiQuery';
import { calcSmartDelta } from '../utils/calcDelta';
import { GA4 } from '../lib/gaColors';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const DeviceReportPage = ({ propertyId, dates, kpiData, prevKpiData, compareMode, prevDates }) => {
  const currQ = propertyId && dates?.start && dates?.end
    ? `propertyId=${propertyId}&startDate=${dates.start}&endDate=${dates.end}`
    : null;
  const prevQ = compareMode && prevDates?.start && prevDates?.end
    ? `propertyId=${propertyId}&startDate=${prevDates.start}&endDate=${prevDates.end}`
    : null;

  const { data: currDevicesData, isLoading: loadingDevices } = useApiQuery(
    currQ ? `${API_BASE_URL}/api/device-full-report?${currQ}` : null
  );
  const { data: timelineData, isLoading: loadingTimeline } = useApiQuery(
    currQ ? `${API_BASE_URL}/api/mixed-chart-data?${currQ}` : null
  );
  const { data: prevDevicesData } = useApiQuery(
    prevQ ? `${API_BASE_URL}/api/device-full-report?${prevQ}` : null
  );

  const devices = currDevicesData?.devices || [];
  const timeline = Array.isArray(timelineData) ? timelineData : [];
  const prevDevices = prevDevicesData?.devices || [];
  const loading = loadingDevices || loadingTimeline;

  const getPrevDevice = (category, key) => {
    const row = prevDevices.find(d => d.category === category);
    return row ? row[key] : null;
  };

  if (loading) return <div className="glass-card py-20 text-center"><p className="font-black text-slate-400 animate-pulse text-[10px] uppercase tracking-widest">GENERAZIONE REPORT DISPOSITIVI...</p></div>;

  return (
    <div className="space-y-6">
      <div className="glass rounded-xl p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
          {[
            { label: 'Totale utenti', key: 'totalUsers' },
            { label: 'Sessioni', key: 'sessions' },
            { label: 'Frequenza di rimbalzo', key: 'bounceRate' },
            { label: 'Durata media', key: 'avgDuration' },
            { label: 'Tasso di coinvolgimento', key: 'engagementRate' },
          ].map(({ label, key }) => {
            const delta = compareMode && prevKpiData ? calcSmartDelta(kpiData?.[key], prevKpiData?.[key]) : null;
            return (
              <div key={key} className="text-center border-r border-slate-200 last:border-r-0 px-1 md:px-0">
                <p className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase">{label}</p>
                <p className="text-lg md:text-2xl font-black text-slate-900">{kpiData?.[key]}</p>
                {delta && (
                  <p className={`text-[10px] font-black ${delta.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {delta.formatted}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead className="bg-slate-50 font-black uppercase text-slate-500 border-b border-slate-200/50">
                <tr>
                  <th className="px-3 py-3 text-left whitespace-nowrap">Categoria del dispositivo</th>
                  <th className="px-3 py-3 text-right whitespace-nowrap">Totale utenti</th>
                  {compareMode && <th className="px-3 py-3 text-right whitespace-nowrap">Δ</th>}
                  <th className="px-3 py-3 text-right whitespace-nowrap">Sessioni</th>
                  {compareMode && <th className="px-3 py-3 text-right whitespace-nowrap">Δ</th>}
                  <th className="px-3 py-3 text-right whitespace-nowrap">Frequenza di rimbalzo</th>
                  <th className="px-3 py-3 text-right whitespace-nowrap">Durata media</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {devices.map((d, i) => {
                  const deltaUsers = compareMode ? calcSmartDelta(d.users, getPrevDevice(d.category, 'users')) : null;
                  const deltaSessions = compareMode ? calcSmartDelta(d.sessions, getPrevDevice(d.category, 'sessions')) : null;
                  return (
                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                      <td className="px-3 py-2 font-medium text-slate-700 whitespace-nowrap">{d.category}</td>
                      <td className="px-3 py-2 text-right font-bold text-slate-900">{d.users.toLocaleString()}</td>
                      {compareMode && <td className="px-3 py-2 text-right">{deltaUsers ? <span className={`font-black ${deltaUsers.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>{deltaUsers.formatted}</span> : '-'}</td>}
                      <td className="px-3 py-2 text-right font-bold text-slate-900">{d.sessions.toLocaleString()}</td>
                      {compareMode && <td className="px-3 py-2 text-right">{deltaSessions ? <span className={`font-black ${deltaSessions.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>{deltaSessions.formatted}</span> : '-'}</td>}
                      <td className="px-3 py-2 text-right font-bold text-slate-600">{d.bounceRate}</td>
                      <td className="px-3 py-2 text-right font-bold text-slate-600">{d.avgDuration}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="glass-card h-[250px] md:h-[300px]">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Distribuzione Dispositivi</p>
          <div className="h-[180px] md:h-[230px]">
            <Bar
              data={{
                labels: ['Desktop', 'Mobile', 'Tablet'],
                datasets: [
                  { label: 'Utenti', data: devices.map(d => d.users || 0), backgroundColor: GA4.blue, borderRadius: 4 },
                  { label: 'Sessioni', data: devices.map(d => d.sessions || 0), backgroundColor: GA4.orange, borderRadius: 4 }
                ]
              }}
              options={{ indexAxis: 'y', plugins: { legend: { position: 'bottom' } }, maintainAspectRatio: false }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceReportPage;
