import { NextResponse } from 'next/server';
import { dataClient, adminClient, formatTime, capDateRange } from '@/lib/ga';

// Route Handler generato dalla migrazione di backend/server.js (endpoint /api/top-sources-full).
export const revalidate = 300;

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const query = Object.fromEntries(searchParams);
  // Adapter minimale: mantiene invariata la logica Express (res.json / res.status().json()).
  const res = {
    _status: 200,
    status(c) { this._status = c; return this; },
    json(b) { return NextResponse.json(b, { status: this._status }); },
    send(b) { return new NextResponse(b, { status: this._status }); },
  };
  let { propertyId, startDate, endDate } = query;
  endDate = capDateRange(startDate, endDate);
  
  try {
    const [response] = await dataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'sessionSource' }],
      metrics: [
        { name: 'totalUsers' },
        { name: 'sessions' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' }
      ],
      limit: 50,
      orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }]
    });

    const rows = (response.rows || []).map(row => ({
      name: row.dimensionValues[0].value || '(direct)',
      users: parseInt(row.metricValues[0].value).toLocaleString('it-IT'),
      sessions: parseInt(row.metricValues[1].value).toLocaleString('it-IT'),
      bounceRate: (parseFloat(row.metricValues[2].value) * 100).toFixed(1) + "%",
      avgDuration: formatTime(row.metricValues[3].value),
      usersNumeric: parseInt(row.metricValues[0].value)
    }));

    return res.json(rows);
  } catch (e) {
    console.error('Errore top-sources-full:', e);
    return res.status(500).json({ error: e.message });
  }
}
