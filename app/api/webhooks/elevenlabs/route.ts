// app/api/webhooks/elevenlabs/route.ts
import { NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/elevenlabs/webhook-verify';
import { parseWebhookPayload } from '@/lib/elevenlabs/payload-schema';
import { analyzeTranscript } from '@/lib/elevenlabs/analyzer';
import { getSupabaseServer } from '@/lib/supabase/server';

type EndReason =
  | 'timeout'
  | 'goodbye'
  | 'manual'
  | 'inactivity'
  | 'error'
  | 'unknown';

const CLIENT_REASONS: ReadonlyArray<EndReason> = [
  'timeout',
  'goodbye',
  'manual',
  'inactivity',
  'error',
];

function isClientReason(value: string): value is Exclude<EndReason, 'unknown'> {
  return (CLIENT_REASONS as readonly string[]).includes(value);
}

export async function POST(req: Request): Promise<NextResponse> {
  const secret = process.env.ELEVENLABS_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: 'server_misconfigured' },
      { status: 500 }
    );
  }

  const signatureHeader = req.headers.get('elevenlabs-signature');
  const rawBody = await req.text();

  const sigResult = await verifyWebhookSignature(
    rawBody,
    signatureHeader,
    secret
  );
  if (!sigResult.valid) {
    return NextResponse.json(
      { error: 'invalid_signature', reason: sigResult.reason },
      { status: 401 }
    );
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = parseWebhookPayload(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }
  const p = parsed.data;

  const supabase = getSupabaseServer();

  let end_reason: EndReason = 'unknown';
  const pending = await supabase
    .from('pending_end_reasons')
    .select()
    .eq('conversation_id', p.conversation_id)
    .maybeSingle();

  if (
    pending.data &&
    typeof pending.data.reason === 'string' &&
    isClientReason(pending.data.reason)
  ) {
    end_reason = pending.data.reason;
    await supabase
      .from('pending_end_reasons')
      .delete()
      .eq('conversation_id', p.conversation_id);
  }

  const flags = analyzeTranscript(p.transcript);

  const startedAtIso = p.start_time_unix_secs
    ? new Date(p.start_time_unix_secs * 1000).toISOString()
    : new Date().toISOString();
  const endedAtIso = p.duration_seconds
    ? new Date(
        ((p.start_time_unix_secs ?? Date.now() / 1000) + p.duration_seconds) *
          1000
      ).toISOString()
    : new Date().toISOString();

  const { error } = await supabase.from('sessions').insert({
    conversation_id: p.conversation_id,
    started_at: startedAtIso,
    ended_at: endedAtIso,
    duration_seconds: p.duration_seconds,
    end_reason,
    visitor_name: p.visitor_name,
    visitor_company: p.visitor_company,
    language: p.language,
    summary: p.summary,
    topic_tags: p.topic_tags,
    sentiment: p.sentiment,
    questions: p.questions,
    quality_flags: flags,
    transcript: p.transcript,
    raw_webhook: json,
    channel: 'web',
  });

  if (error && !error.message?.includes('duplicate')) {
    return NextResponse.json(
      { error: 'db_error', detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
