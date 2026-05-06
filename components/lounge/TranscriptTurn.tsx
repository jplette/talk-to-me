// components/lounge/TranscriptTurn.tsx
'use client';

import type { Turn } from '@/lib/hooks/useElevenLabsConversation';
import { useT } from '@/lib/i18n/provider';

type Props = { turn: Turn; isLatestAgent: boolean; agentSpeaking: boolean };

export function TranscriptTurn({ turn, isLatestAgent, agentSpeaking }: Props) {
  const { lang } = useT();
  const youLabel = lang === 'de' ? 'Du' : 'You';
  const meLabel = 'Jonathan';
  const showCursor =
    turn.role === 'agent' && isLatestAgent && agentSpeaking;
  return (
    <div className="space-y-1">
      <div className="font-mono text-[11px] tracking-[0.02em] text-muted-foreground/70">
        — {turn.role === 'user' ? youLabel : meLabel}
      </div>
      <div className="text-sm leading-relaxed text-foreground">
        {turn.message}
        {showCursor && <span className="ml-0.5 animate-pulse">▌</span>}
      </div>
    </div>
  );
}
