import Link from "next/link";
import { Leaf } from "lucide-react";
import HeaderAuth from "@/components/HeaderAuth";
import { getAppUrl } from "@/lib/app-url";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-eco-border bg-white/90 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="page-container py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-eco-primary/10">
              <Leaf className="w-6 h-6 text-eco-primary" />
            </div>
            <div>
              <span className="text-xl font-bold text-eco-text">
                EcoWatch <span className="text-eco-primary">AI</span>
              </span>
              <p className="text-xs text-eco-muted hidden sm:block">
                Environmental Intelligence
              </p>
            </div>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href={getAppUrl("/app")}
              className="text-sm font-medium text-eco-muted hover:text-eco-text transition-colors hidden sm:inline"
            >
              Dashboard
            </Link>
            <Link
              href={getAppUrl("/app")}
              className="px-4 py-2 rounded-lg bg-eco-primary text-white text-sm font-semibold hover:bg-eco-primary/90 transition-colors"
            >
              Open App
            </Link>
            <HeaderAuth />
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-eco-border mt-auto">
        <div className="page-container py-8 text-center text-xs text-eco-muted">
          EcoWatch AI — Environmental Health Intelligence Platform
        </div>
      </footer>
    </div>
  );
}
