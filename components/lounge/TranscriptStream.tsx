// components/lounge/TranscriptStream.tsx
'use client';

import { useEffect, useRef } from 'react';
import type { Turn } from '@/lib/hooks/useElevenLabsConversation';
import { TranscriptTurn } from './TranscriptTurn';

type Props = { turns: Turn[]; agentSpeaking: boolean };

export function TranscriptStream({ turns, agentSpeaking }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [turns]);

  if (turns.length === 0) return null;

  // Index of last agent turn
  let lastAgentIdx = -1;
  for (let i = turns.length - 1; i >= 0; i--) {
    if (turns[i].role === 'agent') {
      lastAgentIdx = i;
      break;
    }
  }

  return (
    <div
      ref={ref}
      className="w-full max-w-[420px] space-y-3 border-t border-dashed border-border pt-6 text-sm"
    >
      {turns.map((t, i) => (
        <TranscriptTurn
          key={`${i}-${t.role}`}
          turn={t}
          isLatestAgent={i === lastAgentIdx}
          agentSpeaking={agentSpeaking}
        />
      ))}
    </div>
  );
}
