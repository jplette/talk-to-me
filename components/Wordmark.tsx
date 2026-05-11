// components/Wordmark.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type MouseEvent } from 'react';

type Props = {
  onClickGuard?: (proceed: () => void) => void;
};

export function Wordmark({ onClickGuard }: Props) {
  const router = useRouter();

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    if (!onClickGuard) return;
    e.preventDefault();
    onClickGuard(() => router.push('/'));
  }

  return (
    <Link
      href="/"
      onClick={handleClick}
      className="focus-visible:outline-none"
      aria-label="Jonathan Plettenberg — start"
    >
      <span className="font-mono text-xs tracking-wide text-muted-foreground">
        jp<span className="text-[var(--jk-flame)]">.</span>talk-to-me
      </span>
    </Link>
  );
}
