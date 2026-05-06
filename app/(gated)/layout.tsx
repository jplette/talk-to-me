// app/(gated)/layout.tsx
import { AppHeader } from '@/components/AppHeader';
import { Footer } from '@/components/Footer';
import { OfflineBanner } from '@/components/OfflineBanner';

export default function GatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppHeader />
      <OfflineBanner />
      {children}
      <Footer />
    </>
  );
}
