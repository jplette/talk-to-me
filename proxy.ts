// middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { verifyAuthToken } from '@/lib/auth/jwt';
import { AUTH } from '@/lib/config';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(AUTH.COOKIE_NAME)?.value;
  const result = token ? await verifyAuthToken(token) : { valid: false };

  if (!result.valid) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/lounge/:path*'],
};
