// components/lounge/EndedView.tsx
'use client';

import { toast } from 'sonner';
import { TranscriptStream } from './TranscriptStream';
import type { Turn } from '@/lib/hooks/useElevenLabsConversation';
import { useT } from '@/lib/i18n/provider';

type Props = { turns: Turn[]; onNewSession: () => void };

export function EndedView({ turns, onNewSession }: Props) {
  const { t } = useT();

  function copyTranscript() {
    const text = turns
      .map((t) => `${t.role === 'user' ? 'Du' : 'Jonathan'}: ${t.message}`)
      .join('\n\n');
    navigator.clipboard.writeText(text).then(() => {
      toast.success(t('lounge.ended_copy_toast'));
    });
  }

  return (
    <section className="flex flex-col items-center gap-6 text-center">
      <h2 className="text-5xl font-extrabold tracking-[-0.04em] text-foreground">
        {t('lounge.ended_display')}
      </h2>
      <div className="w-full max-h-[50vh] overflow-y-auto">
        <TranscriptStream turns={turns} agentSpeaking={false} />
      </div>
      <div className="flex flex-col items-center gap-2 sm:flex-row">
        <button
          onClick={onNewSession}
          className="inline-flex items-center gap-2 rounded-[5px] border px-4 py-2.5 font-mono text-[11px] uppercase tracking-widest transition-colors hover:bg-[rgba(239,131,84,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--jk-flame)]"
          style={{
            background: 'rgba(239,131,84,0.10)',
            borderColor: 'rgba(239,131,84,0.28)',
            color: 'var(--jk-flame)',
          }}
        >
          {t('lounge.ended_new_session')}
        </button>
        <button
          onClick={copyTranscript}
          className="px-4 py-2.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none"
        >
          {t('lounge.ended_copy_transcript')}
        </button>
      </div>
      <p className="text-sm text-muted-foreground">
        {t('lounge.ended_caption')}{' '}
        <a
          href="mailto:jonathan@plettenberg.org"
          className="underline underline-offset-2 hover:text-foreground transition-colors"
        >
          jonathan@plettenberg.org
        </a>
      </p>
    </section>
  );
}
