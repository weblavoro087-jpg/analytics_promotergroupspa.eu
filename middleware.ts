import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const password = process.env.SITE_PASSWORD || 'Promoter2026';

  // 1. Permetti sempre l'accesso alla pagina di login e ai file di sistema/immagini
  if (
    pathname === '/login' || 
    pathname.startsWith('/_next') || 
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Controlla se l'utente ha il cookie di sblocco valido
  const isAuthenticated = req.cookies.get('site_authenticated')?.value === password;

  // 3. Se non è autenticato, rimandalo alla pagina di login aziendale
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
