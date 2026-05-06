import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { cookies, headers } from 'next/headers';
import { Toaster } from 'sonner';
import { detectLanguage } from '@/lib/i18n/detect';
import { I18nProvider } from '@/lib/i18n/provider';
import { ThemeProvider } from '@/lib/theme/provider';
import { readThemeCookie } from '@/lib/theme/cookie';
import './globals.css';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'Jonathan Plettenberg — talk to me',
  description:
    'Eine kuratierte Voice-Konversation mit Jonathans digitalem Zwilling.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F0F0F3' },
    { media: '(prefers-color-scheme: dark)',  color: '#14151C' },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const acceptLang = headerStore.get('accept-language');
  const langCookie = cookieStore.get('tt_lang')?.value;
  const lang = langCookie === 'de' || langCookie === 'en'
    ? langCookie
    : detectLanguage(acceptLang);
  const theme = readThemeCookie(cookieStore.get('tt_theme')?.value);

  return (
    <html
      lang={lang}
      data-theme={theme ?? undefined}
      className={`${inter.variable} ${jetbrainsMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider initialTheme={theme}>
          <I18nProvider initialLang={lang}>
            {children}
            <Toaster position="bottom-right" richColors closeButton />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
