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
      <header className="border-b border-eco-border bg-eco-surface/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
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
              className="px-4 py-2 rounded-lg bg-eco-primary text-eco-bg text-sm font-semibold hover:bg-eco-primary/90 transition-colors"
            >
              Open App
            </Link>
            <HeaderAuth />
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-eco-border mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-xs text-eco-muted">
          EcoWatch AI — Environmental Health Intelligence Platform
        </div>
      </footer>
    </div>
  );
}
