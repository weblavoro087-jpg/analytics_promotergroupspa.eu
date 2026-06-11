import { NextResponse } from 'next/server';
import { dataClient, adminClient, formatTime } from '@/lib/ga';

// Route Handler generato dalla migrazione di backend/server.js (endpoint /api/channel-monthly-chart).
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
  const { propertyId } = query;

  try {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 1);
    
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 12);

    const [response] = await dataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ 
        startDate: startDate.toISOString().split('T')[0], 
        endDate: endDate.toISOString().split('T')[0] 
      }],
      dimensions: [
        { name: 'yearMonth' },
        { name: 'sessionDefaultChannelGroup' }
      ],
      metrics: [
        { name: 'totalUsers' }
      ],
      orderBys: [{ dimension: { dimensionName: 'yearMonth' } }]
    });

    const monthlyMap = new Map();
    
    response.rows.forEach(row => {
      const yearMonth = row.dimensionValues[0].value;
      const channel = row.dimensionValues[1].value;
      const users = parseInt(row.metricValues[0].value);
      
      if (!monthlyMap.has(yearMonth)) {
        const year = yearMonth.substring(0, 4);
        const month = yearMonth.substring(4, 6);
        const date = new Date(parseInt(year), parseInt(month) - 1);
        const monthName = date.toLocaleString('it-IT', { month: 'short' });
        
        monthlyMap.set(yearMonth, {
          name: monthName,
          year: year,
          month: month
        });
      }
      
      const monthData = monthlyMap.get(yearMonth);
      monthData[channel] = (monthData[channel] || 0) + users;
    });

    const result = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, data]) => {
        const { year, month, ...rest } = data;
        return rest;
      });

    return res.json(result);
  } catch (e) {
    console.error('Errore channel-monthly-chart:', e);
    return res.status(500).json({ error: e.message });
  }
}
