import { NextResponse } from 'next/server';

export async function POST(request) {
  const { password } = await request.json();
  const correctPassword = process.env.SITE_PASSWORD || 'Promoter2026';

  if (password === correctPassword) {
    const response = NextResponse.json({ success: true });
    // Salva il cookie per 30 giorni
    response.cookies.set('site_authenticated', correctPassword, {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });
    return response;
  }

  return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
}
