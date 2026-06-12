'use client';
import React from 'react';
import { calcSmartDelta } from '../utils/calcDelta';
import InfoTooltip from './InfoTooltip';

const TITLE_TERMS = {
  'Utenti Totali': 'totalUsers',
  'Sessioni': 'sessions',
  'Rimbalzo': 'bounceRate',
  'Durata Media': 'avgDuration',
  'Coinvolgimento': 'engagementRate',
  'Tasso Conversione': 'conversionRate',
  'Sessioni/Utente': 'sessionsPerUser',
  'Engagement Medio': 'avgEngagementTime',
  'Ricavi': 'revenue',
};

const Sparkline = React.memo(({ data, color }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 2) - 1;
    return `${x},${y}`;
  });
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p}`).join(' ');

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <path d={pathD} fill="none" stroke={color || '#2563EB'} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
});
Sparkline.displayName = 'Sparkline';

export const StatCard = React.memo(({ title, value, primaryColor, sparklineData }) => (
  <div className="glass rounded-2xl p-4 md:p-6 relative overflow-hidden group hover:bg-slate-50/70 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/60 to-transparent pointer-events-none" />
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest group-hover:text-slate-600 transition-colors truncate flex items-center gap-1.5">
          {title}
          <InfoTooltip term={TITLE_TERMS[title]} />
        </p>
        <p className="text-2xl md:text-3xl font-black text-slate-900">{value || '...'}</p>
      </div>
      {sparklineData && (
        <div className="mt-1 opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
          <Sparkline data={sparklineData} color={primaryColor} />
        </div>
      )}
    </div>
    <div
      className="absolute bottom-0 left-0 h-1 w-full rounded-b-2xl opacity-60"
      style={{ backgroundColor: primaryColor || '#2563EB' }}
    />
  </div>
));
StatCard.displayName = 'StatCard';

export const CompareStatCard = React.memo(({ title, current, previous, sparklineData, primaryColor }) => {
  const result = React.useMemo(() => calcSmartDelta(current, previous), [current, previous]);
  const currDisplay = current != null ? current : '...';

  return (
    <div className="glass rounded-2xl p-4 md:p-6 relative overflow-hidden group hover:bg-slate-50/70 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/60 to-transparent pointer-events-none" />
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest group-hover:text-slate-600 transition-colors truncate flex items-center gap-1.5">
            {title}
            <InfoTooltip term={TITLE_TERMS[title]} />
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl md:text-3xl font-black text-slate-900">{currDisplay}</p>
            {result && (
              <span className={`text-[11px] md:text-xs ${result.isPositive ? 'delta-up' : 'delta-down'}`}>
                {result.formatted}
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Precedente: {previous ?? '...'}</p>
        </div>
        {sparklineData && (
          <div className="mt-1 opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
            <Sparkline data={sparklineData} color={primaryColor} />
          </div>
        )}
      </div>
      {result && (
        <div
          className={`absolute bottom-0 left-0 h-1 w-full rounded-b-2xl ${result.isPositive ? 'bg-emerald-500' : 'bg-rose-500'} opacity-60`}
        />
      )}
    </div>
  );
});
CompareStatCard.displayName = 'CompareStatCard';
