// app/(gated)/layout.tsx
export default function GatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
