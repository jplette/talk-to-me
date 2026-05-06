// components/lounge/LoungeShell.tsx
export function LoungeShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-8">
      <div className="flex w-full max-w-[640px] flex-col items-center gap-6">
        {children}
      </div>
    </main>
  );
}
