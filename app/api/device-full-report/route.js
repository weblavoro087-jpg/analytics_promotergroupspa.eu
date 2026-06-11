import { NextResponse } from 'next/server';
import { dataClient, adminClient, formatTime, capDateRange } from '@/lib/ga';

// Route Handler generato dalla migrazione di backend/server.js (endpoint /api/device-full-report).
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
    const [deviceRes] = await dataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [
        { name: 'totalUsers' }, { name: 'sessions' }, 
        { name: 'bounceRate' }, { name: 'averageSessionDuration' }
      ]
    });

    const devices = (deviceRes.rows || []).map(row => ({
      category: row.dimensionValues[0].value,
      users: parseInt(row.metricValues[0].value),
      sessions: parseInt(row.metricValues[1].value),
      bounceRate: (parseFloat(row.metricValues[2].value) * 100).toFixed(2) + "%",
      avgDuration: formatTime(row.metricValues[3].value)
    }));

    return res.json({ devices });
  } catch (e) { return res.status(500).json({ error: e.message }); }
}
