import { NextRequest, NextResponse } from 'next/server';

const SESSION_HINT_COOKIE = 'agriconnect_session_exp';

/** Resolve authenticated visits to the localized landing route before render. */
export function middleware(request: NextRequest) {
  const match = request.nextUrl.pathname.match(/^\/(en|hi|gu)\/?$/);
  if (!match) return NextResponse.next();

  const expiry = Number(request.cookies.get(SESSION_HINT_COOKIE)?.value);
  if (!Number.isFinite(expiry) || expiry <= Math.floor(Date.now() / 1000)) {
    return NextResponse.next();
  }

  const destination = request.nextUrl.clone();
  destination.pathname = `/${match[1]}/dashboard`;
  return NextResponse.redirect(destination);
}
