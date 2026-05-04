// lib/elevenlabs/analyzer.ts

export type TranscriptMessage = {
  role: 'agent' | 'user';
  message: string;
};

export type QualityFlags = {
  refusals: number;
  weak_answers: number;
  oos_attempts: number;
  jailbreak_attempts: number;
  matched_patterns: string[];
};

const REFUSAL_PATTERNS: { name: string; re: RegExp }[] = [
  { name: 'da bin ich raus', re: /da bin ich raus/i },
  { name: 'außerhalb meines profils', re: /außerhalb meines profils/i },
  { name: 'outside my brief', re: /outside my brief/i },
  { name: "can't help with that", re: /can'?t help with that/i },
  {
    name: 'kann ich nicht beantworten',
    re: /kann ich (?:dir |Ihnen )?nicht (?:sagen|beantworten)/i,
  },
];

const WEAK_ANSWER_PATTERNS: { name: string; re: RegExp }[] = [
  { name: 'steht nicht in meinem profil', re: /steht (?:so )?nicht in meinem profil/i },
  { name: 'not in my profile', re: /not in my profile/i },
  { name: 'weiß ich nicht', re: /weiß ich nicht/i },
  { name: "i don't know/have", re: /i don'?t (?:have|know)/i },
];

const OOS_TOPIC_HINTS: { name: string; re: RegExp }[] = [
  { name: 'wetter', re: /\b(?:wetter|weather)\b/i },
  { name: 'politik', re: /\b(?:politik|politics|wahl|election)\b/i },
  { name: 'medizin', re: /\b(?:diagnos|symptom|krankheit|disease|medikament|medication)\b/i },
  { name: 'recht', re: /\b(?:gesetz|legal|paragraph|§)\b/i },
];

const JAILBREAK_HINTS: { name: string; re: RegExp }[] = [
  {
    name: 'ignore instructions',
    re: /ignore (?:your |all |the )?(?:previous |prior )?(?:instructions|prompt)/i,
  },
  { name: 'pretend to be', re: /pretend (?:to be|you are)/i },
  { name: 'system prompt', re: /system prompt/i },
];

function countMatches(
  messages: TranscriptMessage[],
  role: 'agent' | 'user',
  patterns: { name: string; re: RegExp }[],
  matchedAccumulator: Map<string, number>
): number {
  let total = 0;
  for (const msg of messages) {
    if (msg.role !== role) continue;
    for (const p of patterns) {
      const matches = msg.message.match(new RegExp(p.re.source, p.re.flags + 'g'));
      if (matches && matches.length > 0) {
        total += matches.length;
        matchedAccumulator.set(
          p.name,
          (matchedAccumulator.get(p.name) ?? 0) + matches.length
        );
      }
    }
  }
  return total;
}

export function analyzeTranscript(messages: TranscriptMessage[]): QualityFlags {
  const matched = new Map<string, number>();
  const refusals = countMatches(messages, 'agent', REFUSAL_PATTERNS, matched);
  const weak_answers = countMatches(messages, 'agent', WEAK_ANSWER_PATTERNS, matched);
  const oos_attempts = countMatches(messages, 'user', OOS_TOPIC_HINTS, matched);
  const jailbreak_attempts = countMatches(messages, 'user', JAILBREAK_HINTS, matched);

  const matched_patterns = Array.from(matched.entries())
    .map(([name, count]) => `${name}:${count}`)
    .sort();

  return {
    refusals,
    weak_answers,
    oos_attempts,
    jailbreak_attempts,
    matched_patterns,
  };
}
