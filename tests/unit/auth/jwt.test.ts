import { describe, it, expect, beforeAll } from 'vitest';
import { signAuthToken, verifyAuthToken } from '@/lib/auth/jwt';

const TEST_SECRET = 'test-secret-at-least-32-bytes-long-padding-padding';

beforeAll(() => {
  process.env.AUTH_JWT_SECRET = TEST_SECRET;
});

describe('signAuthToken / verifyAuthToken', () => {
  it('signs a token that verifies', async () => {
    const token = await signAuthToken();
    const result = await verifyAuthToken(token);
    expect(result.valid).toBe(true);
  });

  it('rejects a tampered token', async () => {
    const token = await signAuthToken();
    const tampered = token.slice(0, -3) + 'xyz';
    const result = await verifyAuthToken(tampered);
    expect(result.valid).toBe(false);
  });

  it('rejects garbage', async () => {
    const result = await verifyAuthToken('not-a-jwt');
    expect(result.valid).toBe(false);
  });

  it('rejects empty string', async () => {
    const result = await verifyAuthToken('');
    expect(result.valid).toBe(false);
  });
});
