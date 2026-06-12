"use client";

import clsx from "clsx";
import {
  HEALTH_RING,
  HEALTH_STYLES,
  type HealthCategory,
} from "@/lib/platform-health";

export default function ScoreCard({
  score,
  category,
  title = "Environmental Health Score",
  subtitle,
  loading,
}: {
  score: number;
  category: HealthCategory;
  title?: string;
  subtitle?: string;
  loading?: boolean;
}) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  const ring = HEALTH_RING[category];

  if (loading) {
    return (
      <div className="hero-panel p-8 animate-pulse">
        <div className="h-4 w-48 bg-slate-200 rounded mb-6" />
        <div className="h-32 w-32 bg-slate-200 rounded-full mx-auto" />
      </div>
    );
  }

  return (
    <div className="hero-panel p-6 lg:p-8">
      <p className="text-sm font-medium text-eco-muted mb-1">{title}</p>
      {subtitle && (
        <p className="text-xs text-eco-muted mb-6 max-w-md">{subtitle}</p>
      )}
      <div className="flex flex-col sm:flex-row items-center gap-8">
        <div className="relative w-36 h-36 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="10"
            />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke={ring}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-eco-text tabular-nums">
              {score}
            </span>
            <span className="text-xs text-eco-muted">/ 100</span>
          </div>
        </div>
        <div>
          <span
            className={clsx(
              "inline-flex text-sm font-semibold px-4 py-1.5 rounded-full border",
              HEALTH_STYLES[category]
            )}
          >
            {category}
          </span>
          <p className="text-sm text-eco-muted mt-4 max-w-sm leading-relaxed">
            How environmentally healthy your location is right now — blending air,
            water, climate, and weather signals.
          </p>
        </div>
      </div>
    </div>
  );
}
