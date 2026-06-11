export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
}, {
  // Forza Clerk a ignorare i controlli dei moduli Node nativi in ambiente Edge
  debug: false
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};

export const runtime = 'nodejs';
