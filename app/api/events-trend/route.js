import { NextResponse } from 'next/server';
import { dataClient, capDateRange } from '@/lib/ga';

export const revalidate = 300;

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const propertyId = searchParams.get('propertyId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!propertyId || !startDate || !endDate) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  const cappedEnd = capDateRange(startDate, endDate);

  try {
    const [topResponse] = await dataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate: cappedEnd }],
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 5,
    });

    const topNames = (topResponse?.rows || []).map(r => r.dimensionValues[0].value);
    if (topNames.length === 0) {
      return NextResponse.json({ trend: [] });
    }

    const [trendResponse] = await dataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate: cappedEnd }],
      dimensions: [{ name: 'eventName' }, { name: 'date' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          inListFilter: { values: topNames },
        },
      },
      orderBys: [
        { dimension: { dimensionName: 'eventName' } },
        { dimension: { dimensionName: 'date' } },
      ],
    });

    const grouped = {};
    const allDates = new Set();
    for (const row of trendResponse?.rows || []) {
      const name = row.dimensionValues[0].value;
      const date = row.dimensionValues[1].value.replace(/(\d{4})(\d{2})(\d{2})/, '$3/$2');
      const count = parseInt(row.metricValues[0].value);
      if (!grouped[name]) grouped[name] = {};
      grouped[name][date] = count;
      allDates.add(date);
    }

    const sortedDates = [...allDates].sort((a, b) => {
      const [dA, mA, yA] = a.split('/');
      const [dB, mB, yB] = b.split('/');
      return new Date(yA, mA - 1, dA) - new Date(yB, mB - 1, dB);
    });

    const trend = topNames.map((name) => ({
      name,
      data: sortedDates.map((d) => grouped[name]?.[d] ?? 0),
    }));

    return NextResponse.json({ labels: sortedDates, trend });
  } catch (e) {
    console.error('GA4 events trend error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
