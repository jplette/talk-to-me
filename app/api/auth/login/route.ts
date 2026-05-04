import { NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/auth/password';
import { signAuthToken } from '@/lib/auth/jwt';
import { recordFailure, isLockedOut } from '@/lib/auth/lockout';
import { AUTH } from '@/lib/config';

const FAIL_DELAY_MS = 250;

function getClientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

async function delay(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

export async function POST(req: Request): Promise<NextResponse> {
  const ip = getClientIp(req);

  if (isLockedOut(ip)) {
    return NextResponse.json(
      { error: 'too_many_attempts' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const password = (body as { password?: unknown })?.password;
  if (typeof password !== 'string') {
    return NextResponse.json(
      { error: 'missing_password' },
      { status: 400 }
    );
  }

  const expected = process.env.ACCESS_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { error: 'server_misconfigured' },
      { status: 500 }
    );
  }

  if (!verifyPassword(password, expected)) {
    recordFailure(ip);
    await delay(FAIL_DELAY_MS);
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const token = await signAuthToken();
  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.cookies.set(AUTH.COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: AUTH.COOKIE_TTL_SECONDS,
  });
  return res;
}
