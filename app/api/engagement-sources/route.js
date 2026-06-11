import { NextResponse } from 'next/server';
import { dataClient, capDateRange, formatTime } from '@/lib/ga';

export const revalidate = 300;

async function run(propertyId, dateRange, dimensions, metrics, opts = {}) {
  try {
    const [response] = await dataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [dateRange],
      dimensions,
      metrics,
      ...opts,
    });
    return response;
  } catch (e) {
    console.error('GA4 engagement-sources error:', e.message);
    return null;
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const propertyId = searchParams.get('propertyId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const prevStartDate = searchParams.get('prevStartDate');
  const prevEndDate = searchParams.get('prevEndDate');

  if (!propertyId || !startDate || !endDate) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  const cappedEnd = capDateRange(startDate, endDate);
  const range = { startDate, endDate: cappedEnd };
  const prevRange = prevStartDate && prevEndDate
    ? { startDate: prevStartDate, endDate: capDateRange(prevStartDate, prevEndDate) }
    : null;

  const [kpiResp, sourcesResp, trendResp] = await Promise.all([
    run(propertyId, range, [], [
      { name: 'engagementRate' },
      { name: 'averageSessionDuration' },
      { name: 'bounceRate' },
      { name: 'sessions' },
      { name: 'engagedSessions' },
      { name: 'totalUsers' },
    ]),
    run(propertyId, range, [{ name: 'sessionSource' }], [
      { name: 'sessions' },
      { name: 'engagementRate' },
      { name: 'bounceRate' },
      { name: 'averageSessionDuration' },
      { name: 'totalUsers' },
    ], { limit: 15, orderBys: [{ metric: { metricName: 'sessions' }, desc: true }] }),
    run(propertyId, range, [{ name: 'date' }], [
      { name: 'engagementRate' },
      { name: 'sessions' },
      { name: 'averageSessionDuration' },
    ], { orderBys: [{ dimension: { dimensionName: 'date' } }] }),
  ]);

  let prevKpi = null;
  let prevSources = null;
  if (prevRange) {
    const [pkpi, psrc] = await Promise.all([
      run(propertyId, prevRange, [], [
        { name: 'engagementRate' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
        { name: 'sessions' },
        { name: 'engagedSessions' },
        { name: 'totalUsers' },
      ]),
      run(propertyId, prevRange, [{ name: 'sessionSource' }], [
        { name: 'sessions' },
        { name: 'engagementRate' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
        { name: 'totalUsers' },
      ], { limit: 15, orderBys: [{ metric: { metricName: 'sessions' }, desc: true }] }),
    ]);
    prevKpi = extractKpi(pkpi);
    prevSources = extractSources(psrc);
  }

  return NextResponse.json({
    kpi: extractKpi(kpiResp),
    prevKpi,
    sources: extractSources(sourcesResp),
    prevSources,
    trend: extractTrend(trendResp),
  });
}

function extractKpi(resp) {
  const row = resp?.rows?.[0];
  if (!row) return null;
  const v = (idx) => row.metricValues?.[idx]?.value || '0';
  const sessions = parseInt(v(3));
  const engaged = parseInt(v(4));
  return {
    engagementRate: (parseFloat(v(0)) * 100).toFixed(1) + '%',
    avgDuration: formatTime(v(1)),
    bounceRate: (parseFloat(v(2)) * 100).toFixed(1) + '%',
    sessions: sessions.toLocaleString('it-IT'),
    engagedSessions: engaged.toLocaleString('it-IT'),
    totalUsers: parseInt(v(5)).toLocaleString('it-IT'),
    engagementPerSession: sessions > 0 ? (engaged / sessions * 100).toFixed(1) + '%' : '0.0%',
  };
}

function extractSources(resp) {
  return (resp?.rows || []).map(row => ({
    source: row.dimensionValues[0].value || '(direct)',
    sessions: parseInt(row.metricValues[0].value) || 0,
    engagementRate: (parseFloat(row.metricValues[1].value) * 100).toFixed(1) + '%',
    bounceRate: (parseFloat(row.metricValues[2].value) * 100).toFixed(1) + '%',
    avgDuration: formatTime(row.metricValues[3].value),
    users: parseInt(row.metricValues[4].value) || 0,
  }));
}

function extractTrend(resp) {
  return (resp?.rows || []).map(row => ({
    date: row.dimensionValues[0].value.replace(/(\d{4})(\d{2})(\d{2})/, '$3/$2'),
    engagementRate: (parseFloat(row.metricValues[0].value) * 100).toFixed(1),
    sessions: parseInt(row.metricValues[1].value) || 0,
    avgDuration: formatTime(row.metricValues[2].value),
  }));
}
