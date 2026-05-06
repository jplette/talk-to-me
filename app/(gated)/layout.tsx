// app/(gated)/layout.tsx
import { Footer } from '@/components/Footer';
import { OfflineBanner } from '@/components/OfflineBanner';

export default function GatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <OfflineBanner />
      {children}
      <Footer />
    </>
  );
}
