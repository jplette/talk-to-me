// app/(gated)/layout.tsx
import { Footer } from '@/components/Footer';
import { OfflineBanner } from '@/components/OfflineBanner';

export default function GatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <OfflineBanner />
      {children}
      <Footer />
    </div>
  );
}
