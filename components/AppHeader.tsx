// components/AppHeader.tsx
import { ThemeToggle } from './ThemeToggle';
import { Wordmark } from './Wordmark';

type Props = {
  middleSlot?: React.ReactNode;
  /** Pass through to Wordmark. */
  wordmarkClickGuard?: (proceed: () => void) => void;
};

export function AppHeader({ middleSlot, wordmarkClickGuard }: Props) {
  return (
    <header className="shrink-0 sticky top-0 z-50 h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6 md:px-10">
        <Wordmark onClickGuard={wordmarkClickGuard} />
        {middleSlot && <div className="flex items-center gap-3">{middleSlot}</div>}
        <ThemeToggle />
      </div>
    </header>
  );
}
