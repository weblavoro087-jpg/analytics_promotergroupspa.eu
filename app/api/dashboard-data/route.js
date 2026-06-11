import { NextResponse } from 'next/server';
import { dataClient, formatTime, capDateRange } from '@/lib/ga';

export const revalidate = 300;

async function queryGA(propertyId, dateRange, dimensions, metrics, opts = {}) {
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
    console.error('GA4 query error:', e.message);
    return null;
  }
}

function extractKPI(response) {
  const row = response?.rows?.[0];
  if (!row) return null;
  const v = (idx) => row.metricValues?.[idx]?.value || '0';

  const totalUsers = parseInt(v(0));
  const sessions = parseInt(v(1));
  const keyEvents = parseInt(v(5));
  const totalRevenue = parseFloat(v(8));

  return {
    totalUsers: totalUsers.toLocaleString('it-IT'),
    sessions: sessions.toLocaleString('it-IT'),
    bounceRate: (parseFloat(v(2)) * 100).toFixed(1) + '%',
    avgDuration: formatTime(v(3)),
    engagementRate: (parseFloat(v(4)) * 100).toFixed(1) + '%',
    keyEvents: keyEvents.toLocaleString('it-IT'),
    conversionRate: sessions > 0
      ? ((keyEvents / sessions) * 100).toFixed(2) + '%'
      : '0.00%',
    avgEngagementTime: formatTime(v(6)),
    sessionsPerUser: totalUsers > 0
      ? (sessions / totalUsers).toFixed(2)
      : '0.00',
    totalRevenue: totalRevenue > 0
      ? '€ ' + totalRevenue.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : 'N/A',
  };
}

function extractUserTypes(response) {
  return (response?.rows || [])
    .map((row) => {
      const type = row.dimensionValues[0].value;
      if (type !== 'new' && type !== 'returning') return null;
      return {
        type: type === 'new' ? 'Nuovi visitatori' : 'Visitatori di ritorno',
        users: parseInt(row.metricValues[0].value).toLocaleString('it-IT'),
        sessions: parseInt(row.metricValues[1].value).toLocaleString('it-IT'),
        bounceRate: (parseFloat(row.metricValues[2].value) * 100).toFixed(1) + '%',
        avgDuration: formatTime(row.metricValues[3].value),
      };
    })
    .filter(Boolean);
}

function extractMixedChart(response) {
  return (response?.rows || []).map((row) => ({
    date: row.dimensionValues[0].value.replace(/(\d{4})(\d{2})(\d{2})/, '$3/$2'),
    total: parseInt(row.metricValues[0].value),
    newUsers: parseInt(row.metricValues[1].value),
    activeUsers: parseInt(row.metricValues[2].value),
  }));
}

function extractPageUrls(response) {
  return (response?.rows || []).map((row) => ({
    url: row.dimensionValues[0].value,
    users: parseInt(row.metricValues[0].value).toLocaleString('it-IT'),
    sessions: parseInt(row.metricValues[1].value).toLocaleString('it-IT'),
    bounceRate: (parseFloat(row.metricValues[2].value) * 100).toFixed(2) + '%',
    avgDuration: formatTime(row.metricValues[3].value),
  }));
}

async function fetchSection(propertyId, dateRange) {
  const [kpiResp, userTypeResp, chartResp, pagesResp] = await Promise.all([
    queryGA(propertyId, dateRange, [], [
      { name: 'totalUsers' },
      { name: 'sessions' },
      { name: 'bounceRate' },
      { name: 'averageSessionDuration' },
      { name: 'engagementRate' },
      { name: 'keyEvents' },
      { name: 'userEngagementDuration' },
      { name: 'sessionsPerUser' },
      { name: 'totalRevenue' },
    ]),
    queryGA(propertyId, dateRange, [{ name: 'newVsReturning' }], [
      { name: 'totalUsers' },
      { name: 'sessions' },
      { name: 'bounceRate' },
      { name: 'averageSessionDuration' },
    ]),
    queryGA(propertyId, dateRange, [{ name: 'date' }], [
      { name: 'totalUsers' },
      { name: 'newUsers' },
      { name: 'activeUsers' },
    ], { orderBys: [{ dimension: { dimensionName: 'date' } }] }),
    queryGA(propertyId, dateRange, [{ name: 'landingPagePlusQueryString' }], [
      { name: 'totalUsers' },
      { name: 'sessions' },
      { name: 'bounceRate' },
      { name: 'averageSessionDuration' },
    ], { limit: 15, orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }] }),
  ]);

  return {
    kpi: extractKPI(kpiResp),
    userTypes: extractUserTypes(userTypeResp),
    chart: extractMixedChart(chartResp),
    topPages: extractPageUrls(pagesResp),
  };
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

  const current = await fetchSection(propertyId, { startDate, endDate: cappedEnd });

  let previous = null;
  if (prevStartDate && prevEndDate) {
    previous = await fetchSection(propertyId, { startDate: prevStartDate, endDate: prevEndDate });
  }

  return NextResponse.json({ current, previous });
}
