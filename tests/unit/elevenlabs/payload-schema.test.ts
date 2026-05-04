// tests/unit/elevenlabs/payload-schema.test.ts
import { describe, it, expect } from 'vitest';
import { parseWebhookPayload } from '@/lib/elevenlabs/payload-schema';

const VALID_PAYLOAD = {
  type: 'post_call_transcription',
  event_timestamp: 1730000000,
  data: {
    agent_id: 'agent_abc',
    conversation_id: 'conv_123',
    status: 'done',
    transcript: [
      { role: 'agent', message: 'Hi!', time_in_call_secs: 0 },
      { role: 'user', message: 'Hey.', time_in_call_secs: 2 },
    ],
    metadata: {
      start_time_unix_secs: 1730000000,
      call_duration_secs: 234,
      termination_reason: 'client_disconnected',
    },
    analysis: {
      transcript_summary: 'Brief chat.',
      data_collection_results: {
        visitor_name: { value: 'Jane' },
        visitor_company: { value: 'Acme' },
        summary: { value: 'CV stuff.' },
        topic_tags: { value: ['cv', 'projects'] },
        sentiment: { value: 'positive' },
        questions: { value: ['What is your stack?'] },
        language: { value: 'en' },
      },
    },
  },
};

describe('parseWebhookPayload', () => {
  it('parses a valid payload', () => {
    const result = parseWebhookPayload(VALID_PAYLOAD);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.conversation_id).toBe('conv_123');
      expect(result.data.transcript).toHaveLength(2);
      expect(result.data.visitor_name).toBe('Jane');
      expect(result.data.topic_tags).toEqual(['cv', 'projects']);
    }
  });

  it('handles missing optional analysis fields', () => {
    const payload = {
      ...VALID_PAYLOAD,
      data: {
        ...VALID_PAYLOAD.data,
        analysis: { data_collection_results: {} },
      },
    };
    const result = parseWebhookPayload(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.visitor_name).toBeNull();
      expect(result.data.topic_tags).toBeNull();
    }
  });

  it('rejects payload missing conversation_id', () => {
    const payload = {
      ...VALID_PAYLOAD,
      data: { ...VALID_PAYLOAD.data, conversation_id: undefined },
    };
    const result = parseWebhookPayload(payload);
    expect(result.success).toBe(false);
  });

  it('rejects payload missing transcript', () => {
    const payload = {
      ...VALID_PAYLOAD,
      data: { ...VALID_PAYLOAD.data, transcript: undefined },
    };
    const result = parseWebhookPayload(payload);
    expect(result.success).toBe(false);
  });

  it('passes through unknown top-level fields (forward-compat)', () => {
    const payload = { ...VALID_PAYLOAD, unknown_future_field: 'whatever' };
    const result = parseWebhookPayload(payload);
    expect(result.success).toBe(true);
  });

  it('returns null sentiment when sentiment.value is missing', () => {
    const payload = {
      ...VALID_PAYLOAD,
      data: {
        ...VALID_PAYLOAD.data,
        analysis: {
          data_collection_results: {},
        },
      },
    };
    const result = parseWebhookPayload(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sentiment).toBeNull();
    }
  });
});
