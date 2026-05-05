// tests/integration/api/end-reason.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockUpsert = vi.fn();
const mockFrom = vi.fn(() => ({ upsert: mockUpsert }));

vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServer: () => ({ from: mockFrom }),
}));

import { POST } from '@/app/api/sessions/end-reason/route';

beforeEach(() => {
  mockUpsert.mockReset();
  mockFrom.mockClear();
  mockUpsert.mockResolvedValue({ data: null, error: null });
});

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/sessions/end-reason', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/sessions/end-reason', () => {
  it('upserts a valid reason', async () => {
    const res = await POST(
      makeRequest({ conversation_id: 'conv_1', reason: 'goodbye' })
    );
    expect(res.status).toBe(200);
    expect(mockFrom).toHaveBeenCalledWith('pending_end_reasons');
    expect(mockUpsert).toHaveBeenCalledWith(
      { conversation_id: 'conv_1', reason: 'goodbye' },
      { onConflict: 'conversation_id' }
    );
  });

  it('rejects invalid reason value', async () => {
    const res = await POST(
      makeRequest({ conversation_id: 'conv_1', reason: 'unknown' })
    );
    expect(res.status).toBe(400);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('rejects missing conversation_id', async () => {
    const res = await POST(makeRequest({ reason: 'goodbye' }));
    expect(res.status).toBe(400);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON body', async () => {
    const req = new Request('http://localhost/api/sessions/end-reason', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'not-json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 500 if upsert errors', async () => {
    mockUpsert.mockResolvedValue({
      data: null,
      error: { message: 'db down' },
    });
    const res = await POST(
      makeRequest({ conversation_id: 'conv_1', reason: 'manual' })
    );
    expect(res.status).toBe(500);
  });
});
