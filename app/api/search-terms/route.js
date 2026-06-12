import { NextResponse } from 'next/server';
import { dataClient, capDateRange } from '@/lib/ga';

// Restituisce i termini di ricerca interna al sito (dimensione GA4 `searchTerm`,
// popolata dall'evento view_search_results). Endpoint dedicato per non alterare
// il contratto di /api/events-full-report.
export const revalidate = 300;

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const query = Object.fromEntries(searchParams);
  const res = {
    _status: 200,
    status(c) { this._status = c; return this; },
    json(b) { return NextResponse.json(b, { status: this._status }); },
  };
  let { propertyId, startDate, endDate } = query;
  endDate = capDateRange(startDate, endDate);
  try {
    const [response] = await dataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'searchTerm' }],
      metrics: [
        { name: 'eventCount' },
        { name: 'totalUsers' },
      ],
      dimensionFilter: {
        notExpression: {
          filter: {
            fieldName: 'searchTerm',
            stringFilter: { matchType: 'EXACT', value: '(not set)' },
          },
        },
      },
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 25,
    });

    const rows = (response.rows || [])
      .map(row => ({
        term: row.dimensionValues[0].value,
        count: parseInt(row.metricValues[0].value),
        users: parseInt(row.metricValues[1].value),
      }))
      .filter(r => r.term && r.term !== '(not set)' && r.count > 0);

    return res.json(rows);
  } catch (e) { return res.status(500).json({ error: e.message }); }
}
