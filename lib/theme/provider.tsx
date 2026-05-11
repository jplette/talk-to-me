'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { serializeThemeCookie, type Theme } from './cookie';

type Ctx = {
  theme: Theme;
  toggle: () => void;
};

const ThemeContext = createContext<Ctx | null>(null);

function systemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function ThemeProvider({
  initialTheme,
  children,
}: {
  initialTheme: Theme;
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<Theme>(initialTheme ?? 'light');
  const [hydrated, setHydrated] = useState(false);

  // On first client render: cookie is always set, so just mark as hydrated.
  useEffect(() => {
    setHydrated(true);
  }, [initialTheme]);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      window.localStorage.setItem('tt_theme', next);
      document.cookie = serializeThemeCookie(next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      <div data-hydrated={hydrated ? 'true' : 'false'} className="contents">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
