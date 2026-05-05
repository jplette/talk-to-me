// tests/integration/api/webhook.test.ts
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';

const SECRET = 'whsec_test_secret_at_least_32_chars_long_aaaaaa';

beforeAll(() => {
  process.env.ELEVENLABS_WEBHOOK_SECRET = SECRET;
});

const mockSessionsInsert = vi.fn();
const mockPendingSelect = vi.fn();
const mockPendingDelete = vi.fn();

const sessionsTable = {
  insert: (...args: unknown[]) => mockSessionsInsert(...args),
};

const pendingTable = {
  select: () => ({
    eq: (col: string, val: string) => ({
      maybeSingle: () => mockPendingSelect(col, val),
    }),
  }),
  delete: () => ({
    eq: (col: string, val: string) => mockPendingDelete(col, val),
  }),
};

vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServer: () => ({
    from: (table: string) => {
      if (table === 'sessions') return sessionsTable;
      if (table === 'pending_end_reasons') return pendingTable;
      throw new Error(`Unexpected table: ${table}`);
    },
  }),
}));

import { POST } from '@/app/api/webhooks/elevenlabs/route';

async function signedRequest(
  body: unknown,
  options: { secretOverride?: string; tsOffset?: number } = {}
): Promise<Request> {
  const raw = JSON.stringify(body);
  const ts = Math.floor(Date.now() / 1000) + (options.tsOffset ?? 0);
  const secret = options.secretOverride ?? SECRET;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${ts}.${raw}`)
  );
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return new Request('http://localhost/api/webhooks/elevenlabs', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'elevenlabs-signature': `t=${ts},v0=${hex}`,
    },
    body: raw,
  });
}

const VALID_PAYLOAD = {
  type: 'post_call_transcription',
  data: {
    conversation_id: 'conv_xyz',
    transcript: [
      { role: 'agent', message: 'Hi.', time_in_call_secs: 0 },
      { role: 'user', message: 'Wie ist das Wetter?', time_in_call_secs: 3 },
      { role: 'agent', message: 'Da bin ich raus.', time_in_call_secs: 5 },
    ],
    metadata: {
      start_time_unix_secs: 1730000000,
      call_duration_secs: 60,
      termination_reason: 'client_disconnected',
    },
    analysis: {
      transcript_summary: 'A short call.',
      data_collection_results: {
        visitor_name: { value: 'Pat' },
        topic_tags: { value: ['cv'] },
        sentiment: { value: 'neutral' },
        language: { value: 'mixed' },
      },
    },
  },
};

beforeEach(() => {
  mockSessionsInsert.mockReset();
  mockPendingSelect.mockReset();
  mockPendingDelete.mockReset();
  mockSessionsInsert.mockResolvedValue({ data: null, error: null });
  mockPendingSelect.mockResolvedValue({ data: null, error: null });
  mockPendingDelete.mockResolvedValue({ data: null, error: null });
});

describe('POST /api/webhooks/elevenlabs', () => {
  it('inserts a session on valid signature + payload', async () => {
    mockPendingSelect.mockResolvedValue({
      data: { reason: 'goodbye' },
      error: null,
    });
    const res = await POST(await signedRequest(VALID_PAYLOAD));
    expect(res.status).toBe(200);
    expect(mockSessionsInsert).toHaveBeenCalledOnce();
    const insertedRow = mockSessionsInsert.mock.calls[0][0] as Record<
      string,
      unknown
    >;
    expect(insertedRow.conversation_id).toBe('conv_xyz');
    expect(insertedRow.end_reason).toBe('goodbye');
    expect(insertedRow.duration_seconds).toBe(60);
    expect(insertedRow.visitor_name).toBe('Pat');
    expect(insertedRow.topic_tags).toEqual(['cv']);
    expect(insertedRow.channel).toBe('web');
    const flags = insertedRow.quality_flags as Record<string, unknown>;
    expect(flags.refusals).toBe(1);
    expect(flags.oos_attempts).toBe(1);
    expect(mockPendingDelete).toHaveBeenCalledWith(
      'conversation_id',
      'conv_xyz'
    );
  });

  it('falls back to "unknown" when no pending end-reason exists', async () => {
    mockPendingSelect.mockResolvedValue({ data: null, error: null });
    const res = await POST(await signedRequest(VALID_PAYLOAD));
    expect(res.status).toBe(200);
    const row = mockSessionsInsert.mock.calls[0][0] as Record<string, unknown>;
    expect(row.end_reason).toBe('unknown');
    expect(mockPendingDelete).not.toHaveBeenCalled();
  });

  it('returns 401 on invalid HMAC (wrong secret)', async () => {
    const res = await POST(
      await signedRequest(VALID_PAYLOAD, { secretOverride: 'wrong' })
    );
    expect(res.status).toBe(401);
    expect(mockSessionsInsert).not.toHaveBeenCalled();
  });

  it('returns 401 on missing signature header', async () => {
    const req = new Request('http://localhost/api/webhooks/elevenlabs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(VALID_PAYLOAD),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 on invalid payload schema', async () => {
    const broken = { type: 'post_call_transcription', data: { foo: 'bar' } };
    const res = await POST(await signedRequest(broken));
    expect(res.status).toBe(400);
    expect(mockSessionsInsert).not.toHaveBeenCalled();
  });

  it('returns 200 even on duplicate insert (idempotent)', async () => {
    mockSessionsInsert.mockResolvedValue({ data: null, error: null });
    const res = await POST(await signedRequest(VALID_PAYLOAD));
    expect(res.status).toBe(200);
  });
});
