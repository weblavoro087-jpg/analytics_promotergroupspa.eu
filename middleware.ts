import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Rotte pubbliche: login (catch-all) e i suoi sotto-path Clerk.
const isPublicRoute = createRouteMatcher(['/login(.*)']);

export default clerkMiddleware(async (auth, req) => {
  // Tutto ciò che non è pubblico richiede autenticazione (dashboard + /api).
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Salta i file statici interni di Next e gli asset, a meno che non siano in query.
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Esegui sempre per le route API.
    '/(api|trpc)(.*)',
  ],
};
