import './globals.css';
import QueryProvider from '../providers/QueryProvider';

export const metadata = {
  title: 'Promotergroup KPI',
  description: 'Dashboard Analisi Google GA4 — promotergroup',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css"
        />
      </head>
      <body className="min-h-screen bg-zinc-50 antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
