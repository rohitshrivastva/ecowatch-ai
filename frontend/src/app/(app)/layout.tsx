import Link from "next/link";
import { Leaf } from "lucide-react";
import HeaderAuth from "@/components/HeaderAuth";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-eco-border bg-white/90 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="page-container py-3 flex items-center justify-between">
          <Link href="/app" className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-eco-primary/10">
              <Leaf className="w-5 h-5 text-eco-primary" />
            </div>
            <div>
              <span className="text-lg font-bold text-eco-text">
                EcoWatch <span className="text-eco-primary">AI</span>
              </span>
              <p className="text-[10px] text-eco-muted leading-none mt-0.5">
                Environmental Assistant
              </p>
            </div>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs text-eco-muted hover:text-eco-text transition-colors hidden sm:inline"
            >
              Home
            </Link>
            <HeaderAuth />
          </nav>
        </div>
      </header>
      <main className="flex-1 page-container py-8">
        {children}
      </main>
    </div>
  );
}
