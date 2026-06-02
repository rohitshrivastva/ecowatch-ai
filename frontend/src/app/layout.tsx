import type { Metadata } from "next";
import { Leaf, Globe } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "EcoWatch AI — Environmental Health Intelligence",
  description:
    "Analyze environmental conditions, pollution levels, and receive AI-powered recommendations for any geographic area.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <div className="min-h-screen bg-eco-bg">
          <header className="border-b border-eco-border bg-eco-surface/50 backdrop-blur-xl sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-eco-primary/10 animate-pulse-glow">
                  <Leaf className="w-6 h-6 text-eco-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-eco-text">
                    EcoWatch <span className="text-eco-primary">AI</span>
                  </h1>
                  <p className="text-xs text-eco-muted">
                    Environmental Health Intelligence
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-eco-muted">
                <Globe className="w-4 h-4" />
                <span>Real-time Environmental Analysis</span>
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>

          <footer className="border-t border-eco-border mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-xs text-eco-muted">
              EcoWatch AI v1.0 — Environmental Health Intelligence Platform
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
