// components/landing/TypewriterPhrase.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

const PHRASES = {
  de: ['Hallo.', 'Was treibt dich an?', 'Erzähl von einem Fail.', 'Wie denkst du über AI?'],
  en: ['Hello.', 'What drives you?', 'Tell me about a failure.', 'Hot take on AI?'],
} as const;

const TYPE_MS = 55;
const DEL_MS = 30;
const PAUSE_TYPED_MS = 2200;
const PAUSE_DELETED_MS = 320;
const INITIAL_DELAY_MS = 2800; // after GSAP animation completes + pause

export function TypewriterPhrase({ lang }: { lang: 'de' | 'en' }) {
  const phrases = PHRASES[lang];
  const [text, setText] = useState<string>(phrases[0]);
  const [cursorActive, setCursorActive] = useState(false);
  const state = useRef({ phraseIdx: 0, charCount: phrases[0].length, deleting: false });

  useEffect(() => {
    const s = state.current;
    const currentPhrases = PHRASES[lang];

    s.phraseIdx = 0;
    s.charCount = currentPhrases[0].length;
    s.deleting = false;
    setText(currentPhrases[0]);
    setCursorActive(false);

    let outerTimer: ReturnType<typeof setTimeout>;
    let innerTimer: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (s.deleting) {
        s.charCount--;
        setText(currentPhrases[s.phraseIdx].slice(0, s.charCount));

        if (s.charCount === 0) {
          s.deleting = false;
          s.phraseIdx = (s.phraseIdx + 1) % currentPhrases.length;
          innerTimer = setTimeout(tick, PAUSE_DELETED_MS);
        } else {
          innerTimer = setTimeout(tick, DEL_MS);
        }
      } else {
        s.charCount++;
        const phrase = currentPhrases[s.phraseIdx];
        setText(phrase.slice(0, s.charCount));

        if (s.charCount === phrase.length) {
          s.deleting = true;
          innerTimer = setTimeout(tick, PAUSE_TYPED_MS);
        } else {
          innerTimer = setTimeout(tick, TYPE_MS);
        }
      }
    };

    outerTimer = setTimeout(() => {
      setCursorActive(true);
      s.deleting = true;
      innerTimer = setTimeout(tick, PAUSE_TYPED_MS);
    }, INITIAL_DELAY_MS);

    return () => {
      clearTimeout(outerTimer);
      clearTimeout(innerTimer);
    };
  }, [lang]);

  return (
    <em style={{ color: 'var(--jk-flame)' }}>
      {text}
      <span aria-hidden="true" className={cursorActive ? 'hero-cursor' : 'opacity-0'}>
        |
      </span>
    </em>
  );
}
