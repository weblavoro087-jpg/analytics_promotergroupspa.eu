import { NextResponse } from 'next/server';
import { dataClient, adminClient, formatTime } from '@/lib/ga';

// Route Handler generato dalla migrazione di backend/server.js (endpoint /api/exit-pages).
export const dynamic = 'force-dynamic';

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
  const { propertyId, startDate, endDate } = query;

  const finalStart = (startDate && startDate !== 'undefined') ? startDate : '30daysAgo';
  const finalEnd = (endDate && endDate !== 'undefined' && endDate !== 'today') ? endDate : 'yesterday';

  try {
    const [response] = await dataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: finalStart, endDate: finalEnd }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }], 
      limit: 10
    });

    if (!response.rows || response.rows.length === 0) {
      return res.json([]);
    }

    const rows = response.rows.map(row => ({
      path: row.dimensionValues[0].value,
      views: parseInt(row.metricValues[0].value) || 0
    }));

    return res.json(rows);
  } catch (e) {
    console.error("ERRORE BACKEND GA4:", e.message);
    return res.status(500).json({ error: e.message });
  }
}
