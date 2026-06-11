import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const password = process.env.SITE_PASSWORD || 'Promoter2026';

  // 1. Permetti sempre l'accesso alla pagina di login, alle API e ai file statici palesi
  if (
    pathname === '/login' ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Verifica la presenza del cookie di autenticazione
  const isAuthenticated = req.cookies.get('site_authenticated')?.value === password;

  // 3. Se l'utente non è autenticato, effettua il reindirizzamento forzato a /login
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Configurazione semplificata del matcher accettata nativamente da Next.js/Vercel
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/.*).*)',
  ],
};
