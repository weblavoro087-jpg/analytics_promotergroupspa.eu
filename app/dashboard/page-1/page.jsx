'use client';
import { useMemo } from 'react';
import { useDashboard } from '../../../components/DashboardContext';
import { useDashboardData } from '../../../hooks/useDashboardData';
import { StatCard, CompareStatCard } from '../../../components/StatCards';
import PrintPageButton from '../../../components/PrintPageButton';
import UserTypeTable from '../../../components/UserTypeTable';
import TrafficChart from '../../../components/TrafficChart';
import TopPagesTable from '../../../components/TopPagesTable';

export default function Page1() {
  const { selectedProp, dates, compareMode, prevDates, currentStyle } = useDashboard();

  const { data, isPlaceholderData } = useDashboardData({
    selectedProp,
    dates,
    compareMode,
    prevDates,
  });

  const chartTrend = useMemo(() => {
    const chart = data?.current?.chart;
    if (!chart || chart.length === 0) return null;
    return chart.map(d => d.total);
  }, [data?.current?.chart]);

  const topPages = useMemo(() => (data?.current?.topPages || []).map(p => ({ title: p.url, views: p.users })), [data?.current?.topPages]);
  const prevTopPages = useMemo(() => (data?.previous?.topPages || []).map(p => ({ title: p.url, views: p.users })), [data?.previous?.topPages]);

  if (!selectedProp) return null;

  const opaque = isPlaceholderData ? 'opacity-60 transition-opacity duration-300' : '';

  return (
    <div className={`dashboard-page space-y-8 animate-in fade-in duration-500 ${opaque}`}>
      <div className="flex justify-end no-print">
        <PrintPageButton currentStyle={currentStyle} label="STAMPA PAGINA 1" />
      </div>
      {compareMode && data?.previous && (
        <div className="glass rounded-xl px-4 py-2.5 text-xs font-bold text-blue-300 border-blue-500/20">
          <span className="text-blue-400">⟳</span> Confronto con periodo precedente: {prevDates.start} → {prevDates.end}
        </div>
      )}

      {/* Core KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        {compareMode && data?.previous ? (
          <>
            <CompareStatCard title="Utenti Totali" current={data?.current?.kpi?.totalUsers} previous={data?.previous?.kpi?.totalUsers} sparklineData={chartTrend} primaryColor={currentStyle?.primaryColor} />
            <CompareStatCard title="Sessioni" current={data?.current?.kpi?.sessions} previous={data?.previous?.kpi?.sessions} sparklineData={chartTrend} primaryColor={currentStyle?.primaryColor} />
            <CompareStatCard title="Rimbalzo" current={data?.current?.kpi?.bounceRate} previous={data?.previous?.kpi?.bounceRate} />
            <CompareStatCard title="Durata Media" current={data?.current?.kpi?.avgDuration} previous={data?.previous?.kpi?.avgDuration} />
            <CompareStatCard title="Coinvolgimento" current={data?.current?.kpi?.engagementRate} previous={data?.previous?.kpi?.engagementRate} />
          </>
        ) : (
          <>
            <StatCard title="Utenti Totali" value={data?.current?.kpi?.totalUsers} primaryColor={currentStyle?.primaryColor} sparklineData={chartTrend} />
            <StatCard title="Sessioni" value={data?.current?.kpi?.sessions} primaryColor={currentStyle?.primaryColor} sparklineData={chartTrend} />
            <StatCard title="Rimbalzo" value={data?.current?.kpi?.bounceRate} primaryColor={currentStyle?.primaryColor} />
            <StatCard title="Durata Media" value={data?.current?.kpi?.avgDuration} primaryColor={currentStyle?.primaryColor} />
            <StatCard title="Coinvolgimento" value={data?.current?.kpi?.engagementRate} primaryColor={currentStyle?.primaryColor} />
          </>
        )}
      </div>

      {/* Deep-dive KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {compareMode && data?.previous ? (
          <>
            <CompareStatCard title="Tasso Conversione" current={data?.current?.kpi?.conversionRate} previous={data?.previous?.kpi?.conversionRate} />
            <CompareStatCard title="Sessioni/Utente" current={data?.current?.kpi?.sessionsPerUser} previous={data?.previous?.kpi?.sessionsPerUser} />
            <CompareStatCard title="Engagement Medio" current={data?.current?.kpi?.avgEngagementTime} previous={data?.previous?.kpi?.avgEngagementTime} />
            <CompareStatCard title="Ricavi" current={data?.current?.kpi?.totalRevenue} previous={data?.previous?.kpi?.totalRevenue} />
          </>
        ) : (
          <>
            <StatCard title="Tasso Conversione" value={data?.current?.kpi?.conversionRate} primaryColor="#10B981" />
            <StatCard title="Sessioni/Utente" value={data?.current?.kpi?.sessionsPerUser} primaryColor="#8B5CF6" />
            <StatCard title="Engagement Medio" value={data?.current?.kpi?.avgEngagementTime} primaryColor="#06B6D4" />
            <StatCard title="Ricavi" value={data?.current?.kpi?.totalRevenue} primaryColor="#F59E0B" />
          </>
        )}
      </div>

      <UserTypeTable data={data?.current?.userTypes} prevData={data?.previous?.userTypes} compareMode={compareMode} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrafficChart chartData={data?.current?.chart} prevChartData={data?.previous?.chart} compareMode={compareMode} prevDates={prevDates} />
        </div>
        <div className="lg:col-span-1">
          <TopPagesTable topPages={topPages} prevTopPages={prevTopPages} compareMode={compareMode} dates={dates} />
        </div>
      </div>
    </div>
  );
}
