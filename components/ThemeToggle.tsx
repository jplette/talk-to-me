// components/ThemeToggle.tsx
'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme/provider';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      className="inline-flex h-11 w-11 items-center justify-center rounded-md text-foreground/80 hover:text-foreground hover:bg-muted transition-colors"
    >
      {theme === 'dark' ? (
        <Sun className="h-[18px] w-[18px]" strokeWidth={1.5} />
      ) : (
        <Moon className="h-[18px] w-[18px]" strokeWidth={1.5} />
      )}
    </button>
  );
}
