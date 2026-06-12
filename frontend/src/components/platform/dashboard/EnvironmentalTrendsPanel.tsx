"use client";

import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import clsx from "clsx";
import type { TrendItem } from "@/lib/dashboard-intelligence";

function TrendIcon({ direction }: { direction: TrendItem["direction"] }) {
  if (direction === "up") return <TrendingUp className="w-3.5 h-3.5" />;
  if (direction === "down") return <TrendingDown className="w-3.5 h-3.5" />;
  return <Minus className="w-3.5 h-3.5" />;
}

export default function EnvironmentalTrendsPanel({
  items,
  loading,
}: {
  items: TrendItem[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-5 animate-pulse h-28" />
    );
  }

  return (
    <section className="glass-panel rounded-2xl p-5 lg:p-6">
      <div className="flex items-baseline justify-between gap-2 mb-4">
        <h2 className="text-base font-semibold text-eco-text">Environmental Trends</h2>
        <span className="text-xs text-eco-muted">Last 30 days</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-eco-border/80 bg-white/60 px-3 py-3"
          >
            <p className="text-xs text-eco-muted mb-1">{item.label}</p>
            <div
              className={clsx(
                "flex items-center gap-1.5 text-sm font-semibold tabular-nums",
                item.direction === "stable"
                  ? "text-slate-600"
                  : item.positive
                    ? "text-emerald-700"
                    : item.direction === "up"
                      ? "text-amber-700"
                      : "text-emerald-700"
              )}
            >
              <TrendIcon direction={item.direction} />
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
