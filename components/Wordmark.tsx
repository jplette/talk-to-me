// components/Wordmark.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type MouseEvent } from 'react';

type Props = {
  /** When provided, intercepts navigation (returns true to allow, false to cancel). */
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
      className="flex items-center gap-3 group focus-visible:outline-none"
      aria-label="Jonathan Plettenberg — start"
    >
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[var(--jk-ink)] text-[var(--fg-on-ink)] dark:bg-[var(--fg-1)] dark:text-[var(--jk-bg)] font-extrabold text-[14px] tracking-[-0.04em] pl-[7px] pr-[5px]"
        aria-hidden="true"
      >
        JP
      </span>
      <span className="text-sm font-semibold tracking-tight text-foreground hidden sm:inline">
        Jonathan Plettenberg
      </span>
    </Link>
  );
}
