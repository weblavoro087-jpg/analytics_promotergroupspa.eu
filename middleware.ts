import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Specifichiamo in modo definitivo le rotte pubbliche da ignorare
const isPublicRoute = createRouteMatcher([
  '/login(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  // Se la rotta non è tra quelle pubbliche, applica la protezione
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Esclude file statici, immagini e asset di Next.js per evitare crash di invocazione
    '/((?!_next|[^?]*.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Esegui sempre il middleware per le chiamate API o TRPC
    '/(api|trpc)(.*)',
  ],
};

export const runtime = 'nodejs';
