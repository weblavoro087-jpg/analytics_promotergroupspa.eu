import { NextResponse } from 'next/server';
import { dataClient, adminClient, formatTime, capDateRange } from '@/lib/ga';

// Route Handler generato dalla migrazione di backend/server.js (endpoint /api/full-report).
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
      metrics: [
        { name: 'totalUsers' }, 
        { name: 'sessions' }, 
        { name: 'bounceRate' }, 
        { name: 'averageSessionDuration' }, 
        { name: 'engagementRate' }
      ]
    });
    const kpiRow = response.rows?.[0];
    const getVal = (idx) => kpiRow?.metricValues?.[idx]?.value || "0";
    return res.json({
      kpi: {
        totalUsers: parseInt(getVal(0)).toLocaleString('it-IT'),
        sessions: parseInt(getVal(1)).toLocaleString('it-IT'),
        bounceRate: (parseFloat(getVal(2)) * 100).toFixed(1) + "%",
        avgDuration: formatTime(getVal(3)),
        engagementRate: (parseFloat(getVal(4)) * 100).toFixed(1) + "%"
      }
    });
  } catch (e) { return res.status(500).json({ error: e.message }); }
}
