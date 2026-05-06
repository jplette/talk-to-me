'use client';

import { ConversationProvider } from '@elevenlabs/react';
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

  const isActive =
    conv.state.name === 'active' ||
    conv.state.name === 'warning' ||
    conv.state.name === 'inactivity-prompt';
  const agentSpeaking =
    (conv.state.name === 'active' || conv.state.name === 'warning') &&
    conv.state.sub === 'speaking';

  const timer = useSessionTimer({
    running: isActive,
    onWarning: () =>
      conv.setState((s) =>
        s.name === 'active' ? { name: 'warning', sub: s.sub } : s,
      ),
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

  if (conv.state.name === 'error-mic') {
    return (
      <LoungeShell>
        <MicPermissionRecovery />
      </LoungeShell>
    );
  }
  if (conv.state.name === 'error-connect') {
    return (
      <LoungeShell>
        <ConnectFailRecovery onRetry={conv.start} />
      </LoungeShell>
    );
  }
  if (conv.state.name === 'ended') {
    return (
      <LoungeShell>
        <EndedView turns={conv.turns} onNewSession={() => location.reload()} />
      </LoungeShell>
    );
  }
  if (conv.state.name === 'idle') {
    return (
      <LoungeShell>
        <IdlePreStart onStart={conv.start} />
        <StatusLine text={t('lounge.status_idle')} variant="idle" />
      </LoungeShell>
    );
  }

  return (
    <LoungeShell>
      <div className="flex w-full items-center justify-end">
        <SessionHeader
          remainingFormatted={timer.remainingFormatted}
          isWarning={timer.phase === 'warning' || timer.phase === 'hardLimit'}
          onEnd={() => {
            void conv.endSession('manual');
          }}
        />
      </div>
      <VoiceIndicator state={indicatorState} amplitude={amplitude} />
      <StatusLine text={t(statusKey)} variant={statusVariant} />
      <TranscriptStream turns={conv.turns} agentSpeaking={agentSpeaking} />
    </LoungeShell>
  );
}
