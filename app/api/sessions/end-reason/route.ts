// app/api/sessions/end-reason/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServer } from '@/lib/supabase/server';

const BodySchema = z.object({
  conversation_id: z.string().min(1),
  reason: z.enum(['timeout', 'goodbye', 'manual', 'inactivity', 'error']),
});

export async function POST(req: Request): Promise<NextResponse> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const supabase = getSupabaseServer();
  const { error } = await supabase
    .from('pending_end_reasons')
    .upsert(
      {
        conversation_id: parsed.data.conversation_id,
        reason: parsed.data.reason,
      },
      { onConflict: 'conversation_id' }
    );

  if (error) {
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
