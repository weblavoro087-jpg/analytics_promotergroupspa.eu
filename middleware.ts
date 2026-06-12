import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Auth basata su cookie: la password del sito (env SITE_PASSWORD su Vercel)
// viene salvata nel cookie `site_authenticated` da /api/login-check.
const SITE_PASSWORD = process.env.SITE_PASSWORD || 'Promoter2026';

// Rotte pubbliche: la pagina di login e l'endpoint che imposta il cookie.
const isPublicRoute = (pathname: string) =>
  pathname === '/login' || pathname.startsWith('/api/login-check');

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const authorized = req.cookies.get('site_authenticated')?.value === SITE_PASSWORD;
  if (authorized) {
    return NextResponse.next();
  }

  // API protette → 401; pagine → redirect al login.
  if (pathname.startsWith('/api')) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const loginUrl = new URL('/login', req.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    // Salta i file statici interni di Next e gli asset.
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Esegui sempre per le route API.
    '/(api|trpc)(.*)',
  ],
};
