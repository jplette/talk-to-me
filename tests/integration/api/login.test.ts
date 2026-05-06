// @vitest-environment node
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { POST } from '@/app/api/auth/login/route';
import { resetLockout } from '@/lib/auth/lockout';

beforeAll(() => {
  process.env.ACCESS_PASSWORD = 'correct-horse-battery-staple';
  process.env.AUTH_JWT_SECRET =
    'test-secret-at-least-32-bytes-long-padding-padding';
});

beforeEach(() => {
  resetLockout();
});

function makeRequest(body: unknown, ip = '1.1.1.1'): Request {
  return new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/login', () => {
  it('sets auth cookie on correct password', async () => {
    const res = await POST(
      makeRequest({ password: 'correct-horse-battery-staple' })
    );
    expect(res.status).toBe(200);
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toContain('tt_auth=');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=lax');
  });

  it('rejects wrong password with 401', async () => {
    const res = await POST(makeRequest({ password: 'nope' }));
    expect(res.status).toBe(401);
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  it('rejects malformed body', async () => {
    const res = await POST(makeRequest({ wrongField: 'x' }));
    expect(res.status).toBe(400);
  });

  it('returns 429 after 5 failed attempts', async () => {
    for (let i = 0; i < 5; i++) {
      await POST(makeRequest({ password: 'wrong' }, '9.9.9.9'));
    }
    const res = await POST(
      makeRequest({ password: 'correct-horse-battery-staple' }, '9.9.9.9')
    );
    expect(res.status).toBe(429);
  });
});
