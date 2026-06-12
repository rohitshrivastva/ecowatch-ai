"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf, Menu, X } from "lucide-react";
import clsx from "clsx";
import HeaderAuth from "@/components/HeaderAuth";

const NAV_ITEMS = [
  { href: "/app", label: "Dashboard", exact: true },
  { href: "/app/air-quality", label: "Air Quality" },
  { href: "/app/water-intelligence", label: "Water" },
  { href: "/app/climate-risk", label: "Climate Risk" },
  { href: "/app/weather", label: "Weather" },
  { href: "/app/assistant", label: "AI Assistant" },
  { href: "/app/reports", label: "Reports" },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href || pathname === `${href}/`;
  return pathname.startsWith(href);
}

export default function PlatformNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-eco-border bg-white/90 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
      <div className="page-container py-3">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/app"
            className="flex items-center gap-2.5 shrink-0"
            onClick={() => setOpen(false)}
          >
            <div className="p-1.5 rounded-lg bg-eco-primary/10">
              <Leaf className="w-5 h-5 text-eco-primary" />
            </div>
            <div>
              <span className="text-lg font-bold text-eco-text">
                EcoWatch<span className="text-eco-primary">.cloud</span>
              </span>
              <p className="text-[10px] text-eco-muted leading-none mt-0.5 hidden sm:block">
                Environmental Intelligence Platform
              </p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  isActive(pathname, item.href, item.exact)
                    ? "bg-eco-primary/10 text-eco-primary"
                    : "text-eco-muted hover:text-eco-text hover:bg-eco-surface-hover"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <HeaderAuth />
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg border border-eco-border text-eco-muted"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {open && (
          <nav className="lg:hidden pt-3 pb-1 grid grid-cols-2 gap-1 border-t border-eco-border mt-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  "px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive(pathname, item.href, item.exact)
                    ? "bg-eco-primary/10 text-eco-primary"
                    : "text-eco-muted hover:bg-eco-surface-hover"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
