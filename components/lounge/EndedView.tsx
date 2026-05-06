// components/lounge/EndedView.tsx
'use client';

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
        <Button onClick={onNewSession}>{t('lounge.ended_new_session')}</Button>
        <Button variant="ghost" onClick={copyTranscript}>
          {t('lounge.ended_copy_transcript')}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">{t('lounge.ended_caption')}</p>
    </section>
  );
}
