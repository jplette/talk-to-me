// lib/elevenlabs/payload-schema.ts
import { z } from 'zod';

const TranscriptMsgSchema = z.object({
  role: z.enum(['agent', 'user']),
  message: z.string(),
  time_in_call_secs: z.number().optional(),
}).passthrough();

const DataCollectionFieldSchema = z.object({
  value: z.unknown(),
}).passthrough();

const RawPayloadSchema = z.object({
  type: z.string(),
  event_timestamp: z.number().optional(),
  data: z.object({
    agent_id: z.string().optional(),
    conversation_id: z.string(),
    status: z.string().optional(),
    transcript: z.array(TranscriptMsgSchema),
    metadata: z.object({
      start_time_unix_secs: z.number().optional(),
      call_duration_secs: z.number().optional(),
      termination_reason: z.string().optional(),
    }).passthrough().optional(),
    analysis: z.object({
      transcript_summary: z.string().optional(),
      data_collection_results: z.record(z.string(), DataCollectionFieldSchema).optional(),
    }).passthrough().optional(),
  }).passthrough(),
}).passthrough();

export type ParsedPayload = {
  conversation_id: string;
  transcript: { role: 'agent' | 'user'; message: string }[];
  start_time_unix_secs: number | null;
  duration_seconds: number | null;
  termination_reason: string | null;

  visitor_name: string | null;
  visitor_company: string | null;
  summary: string | null;
  topic_tags: string[] | null;
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  questions: string[] | null;
  language: 'de' | 'en' | 'mixed' | null;
};

function extractStringField(
  results: Record<string, { value: unknown }> | undefined,
  key: string
): string | null {
  const v = results?.[key]?.value;
  return typeof v === 'string' ? v : null;
}

function extractStringArrayField(
  results: Record<string, { value: unknown }> | undefined,
  key: string
): string[] | null {
  const v = results?.[key]?.value;
  if (Array.isArray(v) && v.every((x) => typeof x === 'string')) return v;
  if (typeof v === 'string' && v.trim().length > 0) {
    return v.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return null;
}

function extractEnumField<T extends string>(
  results: Record<string, { value: unknown }> | undefined,
  key: string,
  allowed: readonly T[]
): T | null {
  const v = results?.[key]?.value;
  if (typeof v === 'string' && (allowed as readonly string[]).includes(v)) {
    return v as T;
  }
  return null;
}

export type ParseResult =
  | { success: true; data: ParsedPayload }
  | { success: false; error: z.ZodError };

export function parseWebhookPayload(input: unknown): ParseResult {
  const parsed = RawPayloadSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error };

  const dcr = parsed.data.data.analysis?.data_collection_results;

  return {
    success: true,
    data: {
      conversation_id: parsed.data.data.conversation_id,
      transcript: parsed.data.data.transcript.map((m) => ({
        role: m.role,
        message: m.message,
      })),
      start_time_unix_secs: parsed.data.data.metadata?.start_time_unix_secs ?? null,
      duration_seconds: parsed.data.data.metadata?.call_duration_secs ?? null,
      termination_reason: parsed.data.data.metadata?.termination_reason ?? null,

      visitor_name: extractStringField(dcr, 'visitor_name'),
      visitor_company: extractStringField(dcr, 'visitor_company'),
      summary:
        extractStringField(dcr, 'summary') ??
        parsed.data.data.analysis?.transcript_summary ??
        null,
      topic_tags: extractStringArrayField(dcr, 'topic_tags'),
      sentiment: extractEnumField(dcr, 'sentiment', [
        'positive',
        'neutral',
        'negative',
      ] as const),
      questions: extractStringArrayField(dcr, 'questions'),
      language: extractEnumField(dcr, 'language', [
        'de',
        'en',
        'mixed',
      ] as const),
    },
  };
}
