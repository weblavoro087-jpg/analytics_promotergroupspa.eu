import { NextResponse } from 'next/server';
import { dataClient, adminClient, formatTime } from '@/lib/ga';

// Route Handler generato dalla migrazione di backend/server.js (endpoint /api/properties).
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
  try {
    const [resp] = await adminClient.listAccountSummaries();
    const props = [];
    resp.forEach(account => {
      account.propertySummaries?.forEach(p => {
        props.push({
          id: p.property.split('/')[1],
          name: p.displayName,
          account: account.displayName,
        });
      });
    });

    // Mostra SOLO l'account "promotergroup" (filtro configurabile via .env).
    const filter = (process.env.PROMOTER_ACCOUNT_FILTER || 'promoter').toLowerCase();
    const filtered = props.filter(p =>
      (p.name || '').toLowerCase().includes(filter) ||
      (p.account || '').toLowerCase().includes(filter)
    );

    return res.json((filtered.length > 0 ? filtered : props).map(({ id, name }) => ({ id, name })));
  } catch (e) { return res.status(500).json({ error: e.message }); }
}
