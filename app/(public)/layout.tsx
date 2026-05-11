// app/(public)/layout.tsx
import { AppHeader } from '@/components/AppHeader';
import { Footer } from '@/components/Footer';
import { WaveBackground } from '@/components/landing/WaveBackground';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* z-0: canvas renders above body background, but below z-[1] content */}
      <WaveBackground />
      <AppHeader />
      <main className="relative z-[1] flex-1">{children}</main>
      <Footer />
    </>
  );
}
