"use client";

import { memo } from "react";
import {
  Shield,
  TrendingDown,
  TrendingUp,
  Minus,
  Sparkles,
  TreePine,
  Droplets,
  Thermometer,
  Wind,
  Activity,
  Sun,
} from "lucide-react";
import clsx from "clsx";
import type { ClimateRiskIntelligence } from "@/types/environment";

const CATEGORY_STYLES: Record<string, string> = {
  Excellent: "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Low Risk": "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Moderate Risk": "bg-amber-100 text-amber-900 border-amber-200",
  "High Risk": "bg-orange-100 text-orange-900 border-orange-200",
  "Critical Risk": "bg-red-100 text-red-900 border-red-200",
};

const TREND_META = {
  Improving: {
    icon: TrendingDown,
    className: "text-emerald-700 bg-emerald-50 border-emerald-200",
    label: "Improving",
  },
  Stable: {
    icon: Minus,
    className: "text-slate-700 bg-slate-50 border-slate-200",
    label: "Stable",
  },
  Worsening: {
    icon: TrendingUp,
    className: "text-orange-700 bg-orange-50 border-orange-200",
    label: "Worsening",
  },
} as const;

const COMPONENT_ICONS: Record<string, React.ReactNode> = {
  air_quality: <Wind className="w-4 h-4 text-sky-600" />,
  water_stress: <Droplets className="w-4 h-4 text-blue-600" />,
  drought: <TreePine className="w-4 h-4 text-emerald-600" />,
  temperature: <Thermometer className="w-4 h-4 text-orange-600" />,
  climate_stability: <Activity className="w-4 h-4 text-violet-600" />,
};

const SAFETY_STYLES: Record<string, string> = {
  Safe: "text-emerald-700 bg-emerald-50 border-emerald-200",
  Caution: "text-amber-800 bg-amber-50 border-amber-200",
  Unsafe: "text-red-800 bg-red-50 border-red-200",
};

function scoreColor(score: number): string {
  if (score <= 20) return "#22c55e";
  if (score <= 40) return "#06b6d4";
  if (score <= 60) return "#f59e0b";
  if (score <= 80) return "#f97316";
  return "#991b1b";
}

function ClimateRiskPanel({
  data,
  showTitle = true,
}: {
  data: ClimateRiskIntelligence;
  showTitle?: boolean;
}) {
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (data.score / 100) * circumference;
  const categoryStyle =
    CATEGORY_STYLES[data.category] ?? CATEGORY_STYLES["Moderate Risk"];
  const trendMeta =
    TREND_META[data.trend as keyof typeof TREND_META] ?? TREND_META.Stable;
  const TrendIcon = trendMeta.icon;
  const change = data.trend_change_3yr;
  const changeLabel =
    change === 0
      ? "No significant change vs 5-year average"
      : change > 0
        ? `+${change} points vs 5-year average`
        : `${change} points vs 5-year average`;

  return (
    <section className="glass-panel rounded-2xl p-6 lg:p-8">
      {showTitle && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-violet-600" />
            <h2 className="text-lg font-semibold text-slate-900">
              Climate Risk Score
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <span
              className={clsx(
                "text-xs font-semibold px-3 py-1 rounded-full border",
                categoryStyle
              )}
            >
              {data.category}
            </span>
            <span
              className={clsx(
                "inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full border",
                trendMeta.className
              )}
            >
              <TrendIcon className="w-3.5 h-3.5" />
              {trendMeta.label}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 mb-6">
        <div className="flex flex-col items-center">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke={scoreColor(data.score)}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-slate-900 tabular-nums">
                {data.score}
              </span>
              <span className="text-xs text-slate-500">/ 100 risk</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center max-w-[160px]">
            {changeLabel}
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-violet-200/60 bg-violet-50/40 px-4 py-3">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-violet-600 mt-0.5 shrink-0" />
              <p className="text-sm text-slate-800 leading-relaxed">
                {data.summary}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className={clsx(
                "inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border",
                SAFETY_STYLES[data.outdoor_safety] ?? SAFETY_STYLES.Caution
              )}
            >
              <Sun className="w-3.5 h-3.5" />
              Outdoor: {data.outdoor_safety}
            </span>
            <span className="text-xs text-slate-500 self-center">
              Safety index {data.outdoor_safety_score}/100
            </span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">
          Risk components
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {data.components.map((comp) => (
            <div
              key={comp.key}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                  {COMPONENT_ICONS[comp.key]}
                  {comp.name}
                </div>
                <span className="text-xs text-slate-500">
                  {Math.round(comp.weight * 100)}% wt
                </span>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-slate-900 tabular-nums">
                  {Math.round(comp.score)}
                </span>
                <span className="text-xs text-slate-500">
                  +{comp.contribution.toFixed(1)} contribution
                </span>
              </div>
              <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(comp.score, 100)}%`,
                    backgroundColor: scoreColor(comp.score),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Current year", value: data.historical.current_year },
          { label: "Last year", value: data.historical.last_year },
          { label: "5-year avg", value: data.historical.five_year_avg },
          { label: "10-year avg", value: data.historical.ten_year_avg },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-center"
          >
            <p className="text-[10px] uppercase tracking-wide text-slate-500">
              {item.label}
            </p>
            <p className="text-lg font-bold text-slate-900 tabular-nums mt-0.5">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {data.insights.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-4">
          <p className="text-sm font-semibold text-slate-800 mb-2">
            AI environmental insights
          </p>
          <ul className="space-y-1.5">
            {data.insights.map((tip) => (
              <li key={tip} className="text-sm text-slate-700">
                · {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export default memo(ClimateRiskPanel);
