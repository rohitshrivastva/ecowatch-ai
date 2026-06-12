"use client";

import clsx from "clsx";
import { Check, X } from "lucide-react";
import {
  HEALTH_RING,
  HEALTH_STYLES,
  type HealthCategory,
} from "@/lib/platform-health";
import type { StatusChip } from "@/lib/dashboard-intelligence";

export default function HealthOverviewPanel({
  score,
  category,
  chips,
  loading,
  locationName,
}: {
  score: number;
  category: HealthCategory;
  chips: StatusChip[];
  loading?: boolean;
  locationName?: string;
}) {
  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-5 animate-pulse">
        <div className="h-4 w-40 bg-slate-200 rounded mb-4" />
        <div className="flex gap-4">
          <div className="h-20 w-20 rounded-full bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-24 bg-slate-200 rounded-full" />
            <div className="h-8 w-full bg-slate-100 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;

  return (
    <section className="glass-panel rounded-2xl p-5 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="flex items-center gap-4 shrink-0">
          <div className="relative w-20 h-20">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="36" fill="none" stroke="#e2e8f0" strokeWidth="6" />
              <circle
                cx="40"
                cy="40"
                r="36"
                fill="none"
                stroke={HEALTH_RING[category]}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-eco-text tabular-nums">{score}</span>
              <span className="text-[10px] text-eco-muted">/ 100</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-eco-muted uppercase tracking-wide">
              Environmental Health
            </p>
            <p className="text-2xl font-bold text-eco-text tabular-nums leading-tight">
              {score}{" "}
              <span className="text-sm font-normal text-eco-muted">/ 100</span>
            </p>
            <span
              className={clsx(
                "inline-flex mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border",
                HEALTH_STYLES[category]
              )}
            >
              {category}
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {locationName && (
            <p className="text-xs text-eco-muted mb-2 truncate">{locationName}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {chips.map((chip) => (
              <span
                key={chip.label}
                className={clsx(
                  "inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border",
                  chip.positive
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-amber-50 text-amber-900 border-amber-200"
                )}
              >
                {chip.positive ? (
                  <Check className="w-3 h-3 shrink-0" />
                ) : (
                  <X className="w-3 h-3 shrink-0 opacity-70" />
                )}
                {chip.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
