import { NextResponse } from 'next/server';
import { dataClient, capDateRange } from '@/lib/ga';

export const revalidate = 300;

async function queryTimeData(propertyId, startDate, endDate) {
  try {
    const [response] = await dataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'dayOfWeek' },
        { name: 'hour' },
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'activeUsers' },
      ],
      orderBys: [
        { dimension: { dimensionName: 'dayOfWeek' } },
        { dimension: { dimensionName: 'hour' } },
      ],
    });

    return (response?.rows || []).map(row => ({
      day: row.dimensionValues[0].value,
      hour: row.dimensionValues[1].value,
      sessions: parseInt(row.metricValues[0].value),
      users: parseInt(row.metricValues[1].value),
    }));
  } catch (e) {
    console.error('GA4 traffic-by-time error:', e.message);
    return [];
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

  const [current, previous] = await Promise.all([
    queryTimeData(propertyId, startDate, cappedEnd),
    prevStartDate && prevEndDate
      ? queryTimeData(propertyId, prevStartDate, prevEndDate)
      : Promise.resolve(null),
  ]);

  return NextResponse.json({ current, previous });
}
