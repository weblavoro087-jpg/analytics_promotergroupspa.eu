'use client';
import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { API_BASE_URL } from '../services/apiConfig';
import { useApiQuery } from '../hooks/useApiQuery';
import { calcSmartDelta } from '../utils/calcDelta';
import TableSearchFilter from './TableSearchFilter';
import CsvExportButton from './CsvExportButton';

const GeoMap = dynamic(() => import('./GeoMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin" />
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Caricamento mappa...</span>
      </div>
    </div>
  ),
});

const TableSkeleton = () => (
  <div className="space-y-1.5 p-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex gap-4 animate-pulse">
        <div className="h-3 w-24 bg-slate-200 rounded" />
        <div className="h-3 flex-1 bg-slate-200 rounded" />
        <div className="h-3 w-12 bg-slate-200 rounded" />
      </div>
    ))}
  </div>
);

const GeoBehaviorPage = ({ propertyId, dates, compareMode, prevDates }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mapView] = useState('density');

  const cityQ = propertyId && dates?.start && dates?.end
    ? `propertyId=${propertyId}&startDate=${dates.start}&endDate=${dates.end}`
    : null;
  const geoQ = compareMode && prevDates?.start && prevDates?.end
    ? `propertyId=${propertyId}&startDate=${dates.start}&endDate=${dates.end}&prevStartDate=${prevDates.start}&prevEndDate=${prevDates.end}`
    : cityQ;
  const prevCityQ = compareMode && prevDates?.start && prevDates?.end
    ? `propertyId=${propertyId}&startDate=${prevDates.start}&endDate=${prevDates.end}`
    : null;

  const { data: cityMatchesRaw, isLoading: cityLoading } = useApiQuery(
    cityQ ? `${API_BASE_URL}/api/city-pages-match?${cityQ}` : null
  );
  const { data: geoRaw, isLoading: geoLoading } = useApiQuery(
    geoQ ? `${API_BASE_URL}/api/geo-map-data?${geoQ}` : null
  );
  const { data: prevCityMatchesRaw } = useApiQuery(
    prevCityQ ? `${API_BASE_URL}/api/city-pages-match?${prevCityQ}` : null
  );

  const loading = cityLoading || geoLoading;
  const cityMatches = Array.isArray(cityMatchesRaw) ? cityMatchesRaw : [];
  const mapData = Array.isArray(geoRaw?.current) ? geoRaw.current : [];
  const prevMapData = geoRaw?.previous && Array.isArray(geoRaw.previous) ? geoRaw.previous : null;
  const prevCityMatches = Array.isArray(prevCityMatchesRaw) ? prevCityMatchesRaw : [];

  const getPrevMatch = (city, url, key) => {
    const row = prevCityMatches.find(m => m.city === city && m.url === url);
    return row ? row[key] : null;
  };

  const getPrevCity = (city, key) => {
    if (!prevMapData) return null;
    const row = prevMapData.find(c => c.city === city);
    return row ? row[key] : null;
  };

  const mergedMapData = useMemo(() => {
    if (!compareMode || !prevMapData) return mapData;
    return mapData.map(city => {
      const prev = prevMapData.find(p => p.city === city.city);
      return {
        ...city,
        prevUsers: prev ? prev.users : null,
        deltaUsers: prev ? city.users - prev.users : null,
        deltaPercent: prev && prev.users > 0
          ? ((city.users - prev.users) / prev.users * 100).toFixed(1)
          : null,
      };
    });
  }, [mapData, prevMapData, compareMode]);

  const filteredMatches = useMemo(() => {
    let result = cityMatches;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.city?.toLowerCase().includes(q) ||
        item.url?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [cityMatches, searchQuery]);

  const topCities = useMemo(() => {
    return mapData.slice(0, 10);
  }, [mapData]);

  const csvColumns = useMemo(() => [
    { label: 'Città', key: 'city' },
    { label: 'Pagina', key: 'url' },
    { label: 'Utenti', key: 'users' },
    { label: 'Durata Media', key: 'avgDuration' },
  ], []);

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

        <div className="lg:col-span-8 h-[350px] md:h-[480px] glass rounded-xl overflow-hidden z-10 p-0 relative">
          {loading && !geoRaw ? (
            <div className="h-full w-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-blue-500/30 border-t-blue-400 rounded-full animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Caricamento mappa...</span>
              </div>
            </div>
          ) : (
            <GeoMap mapData={mergedMapData} />
          )}
          {compareMode && prevMapData && (
            <div className="absolute top-3 right-3 z-[1000] glass-strong rounded-lg px-2.5 py-1.5 text-[9px] shadow-lg">
              <span className="text-amber-600 font-black">⟳</span>
              <span className="text-slate-500 font-bold ml-1">Delta vs periodo prec.</span>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 glass rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-slate-200/50 bg-slate-50/40">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Top 10 Città</p>
          </div>
          <div className="flex-1 p-4 space-y-2 overflow-y-auto">
            {loading && !geoRaw ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center animate-pulse">
                  <div className="h-3 w-20 bg-slate-200 rounded" />
                  <div className="h-3 w-12 bg-slate-200 rounded" />
                </div>
              ))
            ) : (
              topCities.map((city, i) => {
                const prevUsers = getPrevCity(city.city, 'users');
                const delta = compareMode && prevUsers !== null
                  ? calcSmartDelta(city.users, prevUsers) : null;
                return (
                  <div key={i} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0 group hover:bg-slate-50/50 rounded-lg px-2 -mx-2 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[9px] font-black text-blue-400 w-5 shrink-0">
                        #{String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight truncate">
                        {city.city}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-black text-[#1A73E8]">
                        {city.users.toLocaleString('it-IT')}
                      </span>
                      {delta && (
                        <span className={`text-[9px] font-black ${delta.isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                          {delta.formatted}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200/50 bg-slate-50/40 flex items-center justify-between gap-3">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Città di Origine / Pagina di Atterraggio</p>
          <div className="flex items-center gap-2">
            <div className="w-44">
              <TableSearchFilter value={searchQuery} onChange={setSearchQuery} placeholder="Cerca città o pagina..." />
            </div>
            <CsvExportButton data={filteredMatches} columns={csvColumns} filename={`geo-citta-${dates.start}-${dates.end}.csv`} />
          </div>
        </div>
        <div className="max-h-[350px] overflow-y-auto">
          {loading && !cityMatchesRaw ? (
            <TableSkeleton />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] border-collapse">
                <thead className="sticky top-0 z-20 bg-slate-100/60">
                  <tr className="text-[10px] font-black text-slate-500 uppercase tracking-tight border-b border-slate-200/50">
                    <th className="px-3 py-2.5 text-left border-r border-slate-200/50 whitespace-nowrap">Città di Origine</th>
                    <th className="px-3 py-2.5 text-left border-r border-slate-200/50 whitespace-nowrap">Pagina di Atterraggio</th>
                    <th className="px-3 py-2.5 text-right border-r border-slate-200/50 w-20 whitespace-nowrap">Utenti</th>
                    {compareMode && <th className="px-3 py-2.5 text-right border-r border-slate-200/50 w-16 whitespace-nowrap">Δ</th>}
                    <th className="px-3 py-2.5 text-right w-24 whitespace-nowrap">Durata Media</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMatches.map((item, i) => {
                    const delta = compareMode ? calcSmartDelta(item.users, getPrevMatch(item.city, item.url, 'users')) : null;
                    return (
                      <tr key={i} className="hover:bg-white/60 transition-colors">
                        <td className="px-3 py-1.5 font-black uppercase text-slate-700 whitespace-nowrap">{item.city}</td>
                        <td className="px-3 py-1.5 text-[#1A73E8] truncate max-w-[250px] md:max-w-[450px] italic font-medium">{item.url}</td>
                        <td className="px-3 py-1.5 text-right font-bold text-slate-700">{item.users}</td>
                        {compareMode && <td className="px-3 py-1.5 text-right">{delta ? <span className={`font-black ${delta.isPositive ? 'text-emerald-600' : 'text-red-500'}`}>{delta.formatted}</span> : '-'}</td>}
                        <td className="px-3 py-1.5 text-right font-bold text-slate-500">{item.avgDuration}</td>
                      </tr>
                    );
                  })}
                  {filteredMatches.length === 0 && (
                    <tr><td colSpan={compareMode ? 5 : 4} className="py-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Nessun dato trovato</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeoBehaviorPage;
