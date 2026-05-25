// src/shared/components/layout/SimpleLayout.tsx
interface SimpleLayoutProps {
  children: React.ReactNode;
}

export function SimpleLayout({ children }: SimpleLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className="pt-6">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
