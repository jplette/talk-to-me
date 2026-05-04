// tests/unit/elevenlabs/webhook-verify.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { verifyWebhookSignature } from '@/lib/elevenlabs/webhook-verify';

const SECRET = 'whsec_test_secret_at_least_32_chars_long_aaaaaa';

async function makeSig(body: string, timestamp: number, secret = SECRET) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const data = new TextEncoder().encode(`${timestamp}.${body}`);
  const sig = await crypto.subtle.sign('HMAC', key, data);
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `t=${timestamp},v0=${hex}`;
}

beforeEach(() => {
  vi.useRealTimers();
});

describe('verifyWebhookSignature', () => {
  it('accepts a valid signature within tolerance', async () => {
    const body = '{"foo":"bar"}';
    const ts = Math.floor(Date.now() / 1000);
    const header = await makeSig(body, ts);
    const result = await verifyWebhookSignature(body, header, SECRET);
    expect(result.valid).toBe(true);
  });

  it('rejects a tampered body', async () => {
    const body = '{"foo":"bar"}';
    const ts = Math.floor(Date.now() / 1000);
    const header = await makeSig(body, ts);
    const result = await verifyWebhookSignature(
      '{"foo":"baz"}',
      header,
      SECRET
    );
    expect(result.valid).toBe(false);
  });

  it('rejects a wrong secret', async () => {
    const body = '{"foo":"bar"}';
    const ts = Math.floor(Date.now() / 1000);
    const header = await makeSig(body, ts);
    const result = await verifyWebhookSignature(body, header, 'wrong-secret');
    expect(result.valid).toBe(false);
  });

  it('rejects an expired timestamp (>5min old)', async () => {
    const body = '{"foo":"bar"}';
    const ts = Math.floor(Date.now() / 1000) - 6 * 60;
    const header = await makeSig(body, ts);
    const result = await verifyWebhookSignature(body, header, SECRET);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toMatch(/timestamp|expired/i);
  });

  it('rejects a future timestamp (>5min ahead)', async () => {
    const body = '{"foo":"bar"}';
    const ts = Math.floor(Date.now() / 1000) + 6 * 60;
    const header = await makeSig(body, ts);
    const result = await verifyWebhookSignature(body, header, SECRET);
    expect(result.valid).toBe(false);
  });

  it('rejects malformed header', async () => {
    const result = await verifyWebhookSignature(
      'body',
      'not-a-valid-header',
      SECRET
    );
    expect(result.valid).toBe(false);
  });

  it('rejects missing v0 component', async () => {
    const ts = Math.floor(Date.now() / 1000);
    const result = await verifyWebhookSignature(
      'body',
      `t=${ts}`,
      SECRET
    );
    expect(result.valid).toBe(false);
  });
});
