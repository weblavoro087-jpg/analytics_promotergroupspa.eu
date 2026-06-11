// lib/ga.js — client Google Analytics condivisi + helper, usati dai Route Handler in app/api.
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { AnalyticsAdminServiceClient } from '@google-analytics/admin';

// Credenziali service-account da variabili d'ambiente (supporta sia MAIL che EMAIL).
const credentials = {
  client_email: process.env.GOOGLE_CLIENT_MAIL || process.env.GOOGLE_CLIENT_EMAIL,
  private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!credentials.client_email || !credentials.private_key) {
  console.error('❌ Credenziali Google incomplete: verificare GOOGLE_CLIENT_EMAIL / GOOGLE_PRIVATE_KEY');
}

// In ambiente serverless i client vanno riusati tra invocazioni: li mettiamo su globalThis
// per evitare di ricrearli ad ogni richiesta durante l'hot-reload di sviluppo.
const clientConfig = { credentials, timeout: 120_000 };
export const dataClient =
  globalThis.__ga_dataClient || (globalThis.__ga_dataClient = new BetaAnalyticsDataClient(clientConfig));
export const adminClient =
  globalThis.__ga_adminClient || (globalThis.__ga_adminClient = new AnalyticsAdminServiceClient(clientConfig));

// Limita un date range a massimo 12 mesi per evitare DEADLINE_EXCEEDED.
export const capDateRange = (startDate, endDate, maxMonths = 12) => {
  const s = new Date(startDate);
  const e = new Date(endDate);
  const maxEnd = new Date(s);
  maxEnd.setMonth(maxEnd.getMonth() + maxMonths);
  return e > maxEnd ? maxEnd.toISOString().split('T')[0] : endDate;
};

// Formatta i secondi in mm:ss.
export const formatTime = (s) => {
  const sec = Math.floor(Number(s) || 0);
  const mins = Math.floor(sec / 60);
  const rs = sec % 60;
  return `${mins.toString().padStart(2, '0')}:${rs.toString().padStart(2, '0')}`;
};
