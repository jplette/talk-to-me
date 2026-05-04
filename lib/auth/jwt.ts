import { SignJWT, jwtVerify } from 'jose';
import { AUTH } from '@/lib/config';

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_JWT_SECRET must be set and at least 32 chars');
  }
  return new TextEncoder().encode(secret);
}

export async function signAuthToken(): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${AUTH.COOKIE_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export type VerifyResult = { valid: true } | { valid: false; reason: string };

export async function verifyAuthToken(token: string): Promise<VerifyResult> {
  if (!token) return { valid: false, reason: 'empty' };
  try {
    await jwtVerify(token, getSecretKey(), { algorithms: ['HS256'] });
    return { valid: true };
  } catch (e) {
    return { valid: false, reason: e instanceof Error ? e.message : 'unknown' };
  }
}
