'use client';

import { useState } from 'react';
import { ConversationProvider } from '@elevenlabs/react';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LoungeShell } from '@/components/lounge/LoungeShell';
import { IdlePreStart } from '@/components/lounge/IdlePreStart';
import { StatusLine } from '@/components/lounge/StatusLine';
import { SessionHeader } from '@/components/lounge/SessionHeader';
import { VoiceIndicator } from '@/components/lounge/VoiceIndicator';
import { TranscriptStream } from '@/components/lounge/TranscriptStream';
import { MicPermissionRecovery } from '@/components/lounge/MicPermissionRecovery';
import { ConnectFailRecovery } from '@/components/lounge/ConnectFailRecovery';
import { EndedView } from '@/components/lounge/EndedView';
import { useElevenLabsConversation } from '@/lib/hooks/useElevenLabsConversation';
import { useSessionTimer } from '@/lib/hooks/useSessionTimer';
import { useT } from '@/lib/i18n/provider';

export default function LoungePage() {
  return (
    <ConversationProvider>
      <LoungeInner />
    </ConversationProvider>
  );
}

function LoungeInner() {
  const { t, lang } = useT();
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID!;
  const conv = useElevenLabsConversation({ agentId, uiLang: lang });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingNav, setPendingNav] = useState<(() => void) | null>(null);

  const isActive =
    conv.state.name === 'active' ||
    conv.state.name === 'warning' ||
    conv.state.name === 'inactivity-prompt';
  const agentSpeaking =
    (conv.state.name === 'active' || conv.state.name === 'warning') &&
    conv.state.sub === 'speaking';

  const wordmarkGuard = isActive
    ? (proceed: () => void) => {
        setPendingNav(() => proceed);
        setConfirmOpen(true);
      }
    : undefined;

  const timer = useSessionTimer({
    running: isActive,
    onWarning: () => {
      conv.setState((s) =>
        s.name === 'active' ? { name: 'warning', sub: s.sub } : s,
      );
      conv.sendUserMessage(
        lang === 'de'
          ? '[system: Zeit-Warnung — noch 30 Sekunden]'
          : '[system: time-warning — 30 seconds remaining]',
      );
    },
    onGoodbye: () => {
      conv.sendUserMessage(
        lang === 'de'
          ? '[system: Session endet jetzt — bitte verabschiede dich]'
          : '[system: session ending now — please say goodbye]',
      );
    },
    onHardLimit: () => {
      void conv.endSession('timeout');
    },
  });

  // Spike-corrected: amplitudes come pre-smoothed from the SDK hook.
  const amplitude = agentSpeaking ? conv.outputAmplitude : conv.inputAmplitude;

  let indicatorState:
    | 'idle' | 'connecting' | 'listening' | 'speaking' | 'warning' | 'ending' = 'idle';
  let statusKey: Parameters<typeof t>[0] = 'lounge.status_idle';
  let statusVariant: Parameters<typeof StatusLine>[0]['variant'] = 'idle';

  switch (conv.state.name) {
    case 'connecting':
      indicatorState = 'connecting';
      statusKey = 'lounge.status_connecting';
      break;
    case 'active':
      indicatorState = conv.state.sub;
      statusKey =
        conv.state.sub === 'speaking'
          ? 'lounge.status_speaking'
          : 'lounge.status_listening';
      statusVariant = conv.state.sub === 'speaking' ? 'speaking' : 'listening';
      break;
    case 'warning':
      indicatorState = 'warning';
      statusKey = 'lounge.status_warning';
      statusVariant = 'warning';
      break;
    case 'inactivity-prompt':
      indicatorState = 'listening';
      statusKey = 'lounge.status_inactivity';
      statusVariant = 'listening';
      break;
    case 'reconnecting':
      indicatorState = 'connecting';
      statusKey = 'lounge.status_reconnecting';
      break;
    case 'ending':
      indicatorState = 'ending';
      statusKey = 'lounge.status_ending';
      statusVariant = 'ending';
      break;
    default:
      break;
  }

  return (
    <>
      <AppHeader wordmarkClickGuard={wordmarkGuard} />
      {conv.state.name === 'error-mic' ? (
        <LoungeShell>
          <MicPermissionRecovery />
        </LoungeShell>
      ) : conv.state.name === 'error-connect' ? (
        <LoungeShell>
          <ConnectFailRecovery onRetry={conv.start} />
        </LoungeShell>
      ) : conv.state.name === 'ended' ? (
        <LoungeShell>
          <EndedView turns={conv.turns} onNewSession={() => location.reload()} />
        </LoungeShell>
      ) : conv.state.name === 'idle' ? (
        <LoungeShell>
          <IdlePreStart onStart={conv.start} />
          <StatusLine text={t('lounge.status_idle')} variant="idle" />
        </LoungeShell>
      ) : (
        <>
          <SessionHeader
            remainingFormatted={timer.remainingFormatted}
            isWarning={timer.phase === 'warning' || timer.phase === 'hardLimit'}
            onEnd={() => { void conv.endSession('manual'); }}
          />
          <div className="flex flex-1 flex-col items-center gap-6 overflow-y-auto px-6 py-6 min-h-0 md:px-10">
            <VoiceIndicator state={indicatorState} amplitude={amplitude} />
            <StatusLine text={t(statusKey)} variant={statusVariant} />
            <TranscriptStream turns={conv.turns} agentSpeaking={agentSpeaking} />
          </div>
        </>
      )}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('confirm.end_session_title')}</DialogTitle>
            <DialogDescription>{t('confirm.end_session_body')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              {t('confirm.end_session_no')}
            </Button>
            <Button
              onClick={async () => {
                setConfirmOpen(false);
                await conv.endSession('manual');
                pendingNav?.();
                setPendingNav(null);
              }}
            >
              {t('confirm.end_session_yes')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
