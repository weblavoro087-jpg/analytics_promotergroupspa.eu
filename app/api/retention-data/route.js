import { NextResponse } from 'next/server';
import { dataClient, adminClient, formatTime, capDateRange } from '@/lib/ga';

// Route Handler generato dalla migrazione di backend/server.js (endpoint /api/retention-data).
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
      dimensions: [{ name: 'day' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'newUsers' }
      ],
      orderBys: [{ dimension: { dimensionName: 'day' } }]
    });

    const rows = (response.rows || []).map(row => {
      const active = parseInt(row.metricValues[0].value);
      const newUsers = parseInt(row.metricValues[1].value);
      const returning = active - newUsers;
      
      return {
        day: row.dimensionValues[0].value,
        active,
        newUsers,
        returning: returning > 0 ? returning : 0,
        retentionRate: active > 0 ? ((returning / active) * 100).toFixed(1) : 0
      };
    });

    return res.json(rows);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
