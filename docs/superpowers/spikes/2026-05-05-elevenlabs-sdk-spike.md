# ElevenLabs SDK Audio-Tap Spike

**Datum:** 2026-05-06
**Author:** Claude (Plan-3 Phase A subagent, Sonnet)

## Frage

Wie kommen wir an die Amplitude des User-Mic-Streams und des Agent-Audio-Outputs für den Voice-Indikator?

Drei mögliche Pfade (Visual-Spec §6.2):
- **(a)** SDK-Event mit Audio-Chunks / offizielle Volume-API
- **(b)** `<audio>`-Element + `MediaElementAudioSourceNode`
- **(c)** Synthetische Pulse aus `speech_started/ended`-Events

## Probe-Setup

- `@elevenlabs/react` v1.4.0, `@elevenlabs/client` v1.5.0
- Einfache Page mit `useConversation()` innerhalb `ConversationProvider`, getestet über Playwright/Chromium gegen lokales `npm run dev` (Next.js 16.2.4)
- Methode: statische Typ-Analyse der `.d.ts`-Dateien + Runtime-Inspektion via `browser_evaluate` gegen `window.__conv`
- Kein Live-Agent-Connect nötig — API-Shape vollständig aus disconnected State ablesbar (Agent-ID war leer)

## Findings (live-aufgezeichnet)

### useConversation() Return-Shape

Vollständige Schlüsselliste aus `window.__conv` (Runtime-verified):

**Methoden (functions):**
- `startSession(options?)` — startet eine Session; mergt Hook-defaults mit per-call-options
- `endSession()` — beendet Session, null-safe
- `getInputVolume()` → `number` (0–1) — safe auch wenn disconnected: gibt `0` zurück (kein Throw)
- `getOutputVolume()` → `number` (0–1) — safe auch wenn disconnected: gibt `0` zurück (kein Throw)
- `getInputByteFrequencyData()` → `Uint8Array` — voice-range 100–8000 Hz, 0–255 pro Band; gibt `EMPTY_FREQUENCY_DATA` wenn disconnected
- `getOutputByteFrequencyData()` → `Uint8Array` — identisch, Output-Seite
- `changeInputDevice(config)` — wechselt Mikrofon-Device async
- `changeOutputDevice(config)` — wechselt Speaker-Device async
- `setVolume({ volume })` — setzt globale Output-Lautstärke
- `setMuted(bool)` — stummt Mikrofon
- `sendUserMessage(text)` — text-only Message
- `sendMultimodalMessage(options)` — text + fileId
- `sendContextualUpdate(text, options?)` — System-Kontext-Update
- `sendUserActivity()` — Activity-Signal
- `sendMCPToolApprovalResult(toolCallId, isApproved)`
- `uploadFile(file)` → `Promise<{ fileId: string }>`
- `sendFeedback(like: boolean)`
- `getId()` — throws wenn kein aktiver Session

**Status-Felder (state values):**
- `status: "disconnected" | "connecting" | "connected" | "error"` — Runtime: `"disconnected"` im disconnected State
- `mode: "speaking" | "listening"` — Runtime: `"listening"` im disconnected State
- `isMuted: boolean` — Runtime: `false`
- `isSpeaking: boolean` — Runtime: `false`
- `isListening: boolean` — Runtime: `true`
- `canSendFeedback: boolean` — Runtime: `false`
- `message?: string` — undefined wenn kein Error

### Callbacks (aus HookCallbacks-Typ, via `onXxx` Optionen an `useConversation(props)`)

Alle Callbacks werden als Props an `useConversation()` oder `ConversationProvider` übergeben:
- `onConnect({ conversationId })`
- `onDisconnect()`
- `onMessage({ message, source })` — jede Agent/User-Nachricht
- `onModeChange({ mode })` — `"speaking"` ↔ `"listening"`
- `onStatusChange({ status })` — Verbindungsstatus
- `onError(message, context?)`
- `onVadScore({ score })` — Voice Activity Detection Score
- `onInterruption()` — Agent wurde unterbrochen
- `onAudio(base64)` — rohe Agent-Audio-Chunks als Base64
- `onAudioAlignment({ chars, charStartTimesMs, charDurationsMs })`
- `onCanSendFeedbackChange({ canSendFeedback })`
- `onAgentToolRequest`, `onAgentToolResponse`, `onMCPToolCall`, `onMCPConnectionStatus`
- `onConversationMetadata`, `onAsrInitiationMetadata`, `onAgentChatResponsePart`
- `onGuardrailTriggered`, `onDebug`, `onUnhandledClientToolCall`

### DOM-Audio-Element

- **Audio-Tag vom SDK gerendert: nein** — `document.querySelectorAll('audio').length === 0`
- Das SDK verwaltet Audio intern via `AudioContext` + `AudioWorklet` (`MediaDeviceOutput`-Klasse) und spielt Audio über einen eigenen `AudioContext`-Graph ab, nicht über ein `<HTMLAudioElement>`
- `getAnalyser(): AnalyserNode` auf `InputController`/`OutputController` ist als `@deprecated` markiert (web-only API)

### Mic-Stream-Zugriff

- Das SDK ruft intern `navigator.mediaDevices.getUserMedia()` auf, wenn `startSession()` aufgerufen wird
- `navigator.mediaDevices.getUserMedia` ist im Browser verfügbar (Chromium: confirmed)
- Der `MediaStream` ist nicht direkt aus dem Hook exposed — nur via deprecated `getAnalyser()` auf den internen `InputController`/`OutputController`
- SDK-eigener Zugriff über `MediaDeviceInput`-Klasse: ruft `getUserMedia` auf und schickt Audio durch einen `AudioWorklet` (rawAudioProcessor)

### Runtime-Verhalten bei disconnected State

```
getInputVolume()  → 0        (kein Throw)
getOutputVolume() → 0        (kein Throw)
getInputByteFrequencyData()  → leere Uint8Array (EMPTY_FREQUENCY_DATA constant)
getOutputByteFrequencyData() → leere Uint8Array
status            → "disconnected"
mode              → "listening"
```

### Interne Architektur (aus Quellcode-Analyse)

```
VoiceConversation
  ├── input: InputController (MediaDeviceInput)
  │     ├── AudioContext
  │     ├── AnalyserNode (deprecated API)
  │     ├── AudioWorklet (rawAudioProcessor)
  │     └── volumeProvider: { getVolume(): 0-1, getByteFrequencyData(buf) }
  └── output: OutputController (MediaDeviceOutput)
        ├── AudioContext
        ├── AnalyserNode (deprecated API)
        ├── GainNode
        ├── AudioWorklet (audioConcatProcessor)
        └── volumeProvider: { getVolume(): 0-1, getByteFrequencyData(buf) }
```

`VolumeProvider.getVolume()` → mapped von AnalyserNode-Frequenzdaten auf einen Scalar 0–1, gefiltert auf den Voice-Bereich 100–8000 Hz via `resampleVoiceRange()`.

## Entscheidung

**Pfad-A (offiziell) ist verfügbar und empfohlen.**

`getInputVolume()` und `getOutputVolume()` sind offiziell dokumentierte, stable API-Methoden am `useConversation()`-Hook. Sie:
- Geben `number` 0–1 zurück (geeignet für direkte Visualisierung)
- Sind safe-to-call auch wenn disconnected (kein Throw, gibt `0`)
- Sind nicht als deprecated markiert (im Gegensatz zu `getAnalyser()`)
- Können über `setInterval` / `requestAnimationFrame` mit ~30 Hz gepollt werden

**Pfad-B ist nicht realisierbar:** Kein `<audio>`-Element im DOM, SDK managed AudioContext intern.

**Pfad-C ist nicht nötig:** Pfad A funktioniert.

→ **Implementierung in Plan 3 Phase F + G nutzt Pfad A.** Die `useAudioAmplitude`-Implementierung pollt `conv.getInputVolume()` und `conv.getOutputVolume()` via `requestAnimationFrame` wenn die Session connected ist, gibt sonst `0` zurück.

## Konsequenzen für Plan 3

1. **`useAudioAmplitude(source)` vereinfacht sich:** Kein Discriminated-Union über `MediaStream | HTMLAudioElement | null` nötig. Stattdessen direkte Delegation an `conv.getInputVolume()` / `conv.getOutputVolume()`. Parameter `source` wird obsolet — der Hook nimmt stattdessen einen `conv`-Ref.

2. **`useElevenLabsConversation` kann `inputAmplitude` und `outputAmplitude` direkt als `number` (0–1) exponieren**, indem es intern `requestAnimationFrame` pollt solange `status === "connected"`.

3. **Kein eigenes `getUserMedia`-Call im App-Code nötig** — das SDK managed den Mic-Stream vollständig. Damit entfällt die Concern um Permission-Handling in Phase G.

4. **Frequenzdaten für erweiterte Visualisierung:** `getInputByteFrequencyData()` und `getOutputByteFrequencyData()` geben `Uint8Array` mit 100–8000 Hz Voice-Range zurück, falls für Phase F ein erweiterter Spectrum-Visualizer gewünscht ist (nice-to-have).

5. **`ConversationProvider` ist Pflicht** — `useConversation()` muss innerhalb `<ConversationProvider>` verwendet werden. Das Provider-Pattern muss in `app/lounge/page.tsx` eingebaut werden.

6. **Infinite-Loop-Falle:** Das Exposieren des `conv`-Objekts in einem `useEffect` mit `[conv]` als Dependency führt zu einem Infinite-Render-Loop, da `useConversation()` bei jedem Render ein neues Objekt-Shape zurückgibt (alle Felder neu). Lösung: `useRef` Guard oder `[]`-Dependency. **Phase G muss darauf achten.**

## Spike-Artefakte

- Spike-Page `app/spike/elevenlabs/page.tsx` — nach Probing gelöscht
- Dieser Report: `docs/superpowers/spikes/2026-05-05-elevenlabs-sdk-spike.md`
