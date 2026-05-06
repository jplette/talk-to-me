// app/(public)/layout.tsx
import { AppHeader } from '@/components/AppHeader';
import { Footer } from '@/components/Footer';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppHeader />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
