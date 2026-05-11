'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useConversation } from '@elevenlabs/react';
import { SESSION } from '@/lib/config';
import type { Lang } from '@/lib/i18n/messages';

export type Turn = {
  role: 'agent' | 'user';
  message: string;
  inProgress?: boolean;
};

export type EndReason =
  | 'timeout' | 'goodbye' | 'manual' | 'inactivity' | 'error';

export type AppState =
  | { name: 'idle' }
  | { name: 'connecting' }
  | { name: 'active'; sub: 'listening' | 'speaking' }
  | { name: 'warning'; sub: 'listening' | 'speaking' }
  | { name: 'inactivity-prompt' }
  | { name: 'reconnecting' }
  | { name: 'ending'; reason: EndReason }
  | { name: 'ended'; reason: EndReason }
  | { name: 'error-mic' }
  | { name: 'error-connect' };

const GOODBYE_PATTERNS = [
  /\b(tschüss|tschuess|ciao|bye)\b/i,
  /danke[, ].{0,10}das war('?s|s)/i,
  /thanks?[, ].{0,10}that('?s|s) (it|all)/i,
];

type Options = {
  agentId: string;
  uiLang: Lang;
};

function isMicPermissionError(message: string): boolean {
  return /permission|denied|notallowed/i.test(message);
}

export function useElevenLabsConversation({ agentId, uiLang }: Options) {
  const [state, setState] = useState<AppState>({ name: 'idle' });
  const [turns, setTurns] = useState<Turn[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [inputAmplitude, setInputAmplitude] = useState(0);
  const [outputAmplitude, setOutputAmplitude] = useState(0);

  const lastUserSpeechRef = useRef<number>(0);
  const inactivityTimerRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const endSessionRef = useRef<((reason: EndReason) => Promise<void>) | null>(null);
  const startRef = useRef<(() => Promise<void>) | null>(null);

  const conv = useConversation({
    onConnect: ({ conversationId: cid }: { conversationId?: string }) => {
      if (cid) setConversationId(cid);
      lastUserSpeechRef.current = Date.now();
      setState({ name: 'active', sub: 'listening' });
      reconnectAttemptsRef.current = 0;
    },
    onDisconnect: () => {
      // Transitions handled in endSession + reconnect flow.
    },
    onMessage: ({ message, source }) => {
      // SDK source is "user" | "ai"; map to Turn role "user" | "agent"
      const role: Turn['role'] = source === 'user' ? 'user' : 'agent';
      setTurns((prev) => {
        const last = prev[prev.length - 1];
        const next: Turn = { role, message };
        if (role === 'user') {
          lastUserSpeechRef.current = Date.now();
          for (const p of GOODBYE_PATTERNS) {
            if (p.test(message)) {
              queueMicrotask(() => endSessionRef.current?.('goodbye'));
              break;
            }
          }
        }
        if (last && last.role === next.role) {
          return [...prev.slice(0, -1), { ...last, message: next.message }];
        }
        return [...prev, next];
      });
    },
    onError: (message: string) => {
      const isMic = isMicPermissionError(message);
      setState((s) => {
        if (isMic && (s.name === 'connecting' || s.name === 'idle')) {
          return { name: 'error-mic' };
        }
        if (s.name === 'active' || s.name === 'warning') {
          return { name: 'reconnecting' };
        }
        return { name: 'error-connect' };
      });
    },
    onModeChange: ({ mode }: { mode: 'listening' | 'speaking' }) => {
      setState((s) => {
        if (s.name === 'active' || s.name === 'warning') {
          return { ...s, sub: mode };
        }
        return s;
      });
    },
  });

  // Keep latest conv accessible from RAF closures without re-running effect on every render.
  const convRef = useRef(conv);
  convRef.current = conv;

  // ---- Public methods ----
  const start = useCallback(async () => {
    setState({ name: 'connecting' });
    try {
      await conv.startSession({ agentId });
    } catch {
      reconnectAttemptsRef.current += 1;
      setState((s) => (s.name === 'connecting' ? { name: 'error-connect' } : s));
    }
  }, [agentId, conv]);
  startRef.current = start;

  const endSession = useCallback(
    async (reason: EndReason) => {
      setState({ name: 'ending', reason });
      if (conversationId) {
        try {
          await fetch('/api/sessions/end-reason', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ conversation_id: conversationId, reason }),
            keepalive: true,
          });
        } catch {
          // best-effort
        }
      }
      try {
        await conv.endSession();
      } catch {
        // ignore
      }
      setState({ name: 'ended', reason });
    },
    [conversationId, conv],
  );
  endSessionRef.current = endSession;

  // ---- Amplitude polling via RAF (only while connected) ----
  useEffect(() => {
    if (conv.status !== 'connected') {
      setInputAmplitude(0);
      setOutputAmplitude(0);
      return;
    }
    let raf = 0;
    let lastTick = 0;
    let inSm = 0;
    let outSm = 0;
    const ALPHA = 0.2;
    const tick = (t: number) => {
      if (t - lastTick >= 33) {
        lastTick = t;
        try {
          const i = Math.max(0, Math.min(1, convRef.current.getInputVolume()));
          const o = Math.max(0, Math.min(1, convRef.current.getOutputVolume()));
          inSm = inSm + ALPHA * (i - inSm);
          outSm = outSm + ALPHA * (o - outSm);
          setInputAmplitude(inSm);
          setOutputAmplitude(outSm);
        } catch {
          // noop
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [conv.status]);

  // ---- Inactivity watcher ----
  useEffect(() => {
    if (state.name !== 'active' && state.name !== 'warning') {
      if (inactivityTimerRef.current) {
        window.clearInterval(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      return;
    }
    if (!lastUserSpeechRef.current) lastUserSpeechRef.current = Date.now();
    inactivityTimerRef.current = window.setInterval(() => {
      const idleMs = Date.now() - lastUserSpeechRef.current;
      if (idleMs >= SESSION.INACTIVITY_END_MS) {
        endSessionRef.current?.('inactivity');
      } else if (idleMs >= SESSION.INACTIVITY_PROMPT_MS) {
        setState((s) =>
          s.name === 'active' || s.name === 'warning'
            ? { name: 'inactivity-prompt' }
            : s,
        );
      }
    }, 1_000);
    return () => {
      if (inactivityTimerRef.current) {
        window.clearInterval(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    };
  }, [state.name]);

  // ---- Reconnect attempts: max 2× over ~5s ----
  useEffect(() => {
    if (state.name !== 'reconnecting') return;
    if (reconnectAttemptsRef.current >= 2) {
      endSessionRef.current?.('error');
      return;
    }
    reconnectAttemptsRef.current += 1;
    const id = window.setTimeout(() => {
      void startRef.current?.();
    }, 2_500);
    return () => window.clearTimeout(id);
  }, [state.name]);

  return {
    state,
    setState,
    turns,
    conversationId,
    inputAmplitude,
    outputAmplitude,
    start,
    endSession,
    sendContextualUpdate: conv.sendContextualUpdate,
  };
}
