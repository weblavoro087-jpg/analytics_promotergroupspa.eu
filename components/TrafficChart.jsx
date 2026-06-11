'use client';
import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { GA4, GA4_CHART_COLORS } from '../lib/gaColors';
import InfoTooltip from './InfoTooltip';

const TrafficChart = React.memo(({ chartData, prevChartData, compareMode, prevDates }) => {
  const data = chartData || [];
  const prevData = prevChartData || [];

  const mergedData = compareMode && prevData.length > 0
    ? data.map((item, i) => ({
        ...item,
        prevTotal: prevData[i]?.total || null,
      }))
    : data;

  return (
    <div className="glass-card min-h-[350px] md:min-h-[420px] overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.04] rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: GA4.blue }}
      />
      <div className="mb-6 relative">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
          Andamento Temporale
          <InfoTooltip definition="Andamento giornaliero di nuovi utenti e utenti attivi. Le barre mostrano la composizione (nuovi vs attivi), la linea sovrapposta mostra il totale. Il confronto con il periodo precedente appare come linea tratteggiata." />
        </p>
        <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
          Utenti per Giorno
          <InfoTooltip term="activeUsers" />
        </h3>
        {compareMode && prevData.length > 0 && (
          <p className="text-[10px] font-bold text-slate-400 mt-1">
            <span style={{ color: GA4.grey }}>⟋⟋</span> Linea tratteggiata = periodo precedente ({prevDates.start} → {prevDates.end})
          </p>
        )}
      </div>
      <div className="h-[250px] md:h-[300px] w-full relative">
        {mergedData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%" debounce={1}>
            <ComposedChart data={mergedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GA4_CHART_COLORS.grid} />
              <XAxis
                dataKey="date" axisLine={false} tickLine={false}
                tick={{ fontSize: 10, fill: GA4_CHART_COLORS.text }}
                minTickGap={60}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false} tickLine={false}
                tick={{ fontSize: 10, fill: GA4_CHART_COLORS.text }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: GA4_CHART_COLORS.tooltipBg,
                  backdropFilter: 'blur(8px)',
                  borderRadius: '12px',
                  border: `1px solid ${GA4_CHART_COLORS.tooltipBorder}`,
                  color: '#1e293b',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{
                  fontSize: '10px', fontWeight: '900',
                  textTransform: 'uppercase', paddingBottom: '20px',
                  color: '#475569',
                }}
              />
              <Bar
                dataKey="newUsers" name="Nuovi Utenti"
                stackId="a" fill={GA4.blueLight}
                barSize={15} radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="activeUsers" name="Utenti Attivi"
                stackId="a" fill={GA4.blue}
                barSize={15} radius={[4, 4, 0, 0]}
              />
              <Line
                type="monotone" dataKey="total" name="Periodo Corrente"
                stroke={GA4.blueDark} strokeWidth={3} dot={false}
              />
              {compareMode && (
                <Line
                  type="monotone" dataKey="prevTotal" name="Periodo Precedente"
                  stroke={GA4.grey} strokeWidth={2}
                  strokeDasharray="5 5" dot={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-slate-400 text-sm">Nessun dato disponibile</p>
        )}
      </div>
    </div>
  );
});

TrafficChart.displayName = 'TrafficChart';
export default TrafficChart;
