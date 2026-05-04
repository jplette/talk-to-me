// lib/elevenlabs/webhook-verify.ts
import { WEBHOOK } from '@/lib/config';

export type VerifyResult = { valid: true } | { valid: false; reason: string };

function parseHeader(header: string): { ts: number; sig: string } | null {
  const parts = header.split(',').map((p) => p.trim());
  let ts: number | null = null;
  let sig: string | null = null;
  for (const part of parts) {
    const [k, v] = part.split('=', 2);
    if (k === 't') ts = parseInt(v, 10);
    else if (k === 'v0') sig = v;
  }
  if (ts === null || isNaN(ts) || !sig) return null;
  return { ts, sig };
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): Promise<VerifyResult> {
  if (!signatureHeader) return { valid: false, reason: 'missing_header' };

  const parsed = parseHeader(signatureHeader);
  if (!parsed) return { valid: false, reason: 'malformed_header' };

  const now = Math.floor(Date.now() / 1000);
  const drift = Math.abs(now - parsed.ts);
  if (drift > WEBHOOK.SIGNATURE_TOLERANCE_SECONDS) {
    return { valid: false, reason: 'timestamp_out_of_tolerance' };
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const data = new TextEncoder().encode(`${parsed.ts}.${rawBody}`);
  const sig = await crypto.subtle.sign('HMAC', key, data);
  const expectedHex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  if (!timingSafeEqual(parsed.sig, expectedHex)) {
    return { valid: false, reason: 'signature_mismatch' };
  }
  return { valid: true };
}
