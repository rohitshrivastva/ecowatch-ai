"use client";

import { memo, useMemo } from "react";
import {
  Waves,
  CloudRain,
  Sparkles,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  ListChecks,
} from "lucide-react";
import clsx from "clsx";
import type { WaterCrisisIntelligence } from "@/types/environment";

const STRESS_STYLES: Record<string, string> = {
  Low: "bg-cyan-100 text-cyan-800 border-cyan-200",
  Moderate: "bg-amber-100 text-amber-900 border-amber-200",
  High: "bg-orange-100 text-orange-900 border-orange-200",
  Critical: "bg-red-100 text-red-900 border-red-200",
};

const INDICATOR_PILL: Record<string, string> = {
  good: "bg-emerald-100 border-emerald-300 text-emerald-800",
  moderate: "bg-amber-100 border-amber-300 text-amber-900",
  warning: "bg-orange-100 border-orange-300 text-orange-900",
  critical: "bg-red-100 border-red-300 text-red-900",
};

const OUTLOOK_BADGE: Record<string, string> = {
  Worsening: "bg-orange-100 text-orange-800 border-orange-200",
  Improving: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Stable: "bg-slate-100 text-slate-700 border-slate-200",
};

function uniqueLines(items: string[]): string[] {
  const seen = new Set<string>();
  return items.filter((line) => {
    const key = line.toLowerCase().replace(/\s+/g, " ").trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function overlaps(a: string, b: string): boolean {
  const na = a.toLowerCase();
  const nb = b.toLowerCase();
  if (na.includes(nb.slice(0, 24)) || nb.includes(na.slice(0, 24))) return true;
  const wordsA = new Set(na.split(/\W+/).filter((w) => w.length > 4));
  let shared = 0;
  for (const w of nb.split(/\W+/)) {
    if (w.length > 4 && wordsA.has(w)) shared += 1;
  }
  return shared >= 3;
}

function WaterCrisisPanel({
  data,
  showTitle = true,
}: {
  data: WaterCrisisIntelligence;
  compact?: boolean;
  showTitle?: boolean;
}) {
  const outlook = data.drought_forecast?.outlook ?? "Stable";
  const stressStyle = STRESS_STYLES[data.stress_level] ?? STRESS_STYLES.Moderate;

  const narrative = data.environmental_summary || data.summary;
  const showWhy =
    data.why &&
    !overlaps(data.why, narrative) &&
    !overlaps(data.why, data.summary);

  const signals = useMemo(() => {
    const anomalyItems =
      data.climate_anomalies?.map((a) => ({
        key: `${a.metric}-${a.message}`,
        label: a.metric,
        text: a.message,
        severity: a.severity,
      })) ?? [];

    const degradation =
      data.degradation_signals?.filter(
        (sig) =>
          !sig.startsWith("No major") &&
          !anomalyItems.some((a) => overlaps(a.text, sig))
      ) ?? [];

    return [
      ...anomalyItems,
      ...degradation.map((text) => ({
        key: text,
        label: "Signal",
        text,
        severity: "moderate" as const,
      })),
    ];
  }, [data.climate_anomalies, data.degradation_signals]);

  const actions = useMemo(() => {
    const droughtSummary = data.drought_forecast?.summary ?? "";
    return uniqueLines([
      ...data.recommendations,
      ...(data.sustainability_insights ?? []),
    ])
      .filter(
        (tip) =>
          !droughtSummary ||
          !overlaps(tip, droughtSummary)
      )
      .slice(0, 4);
  }, [
    data.recommendations,
    data.sustainability_insights,
    data.drought_forecast?.summary,
  ]);

  const showGlobalContext =
    data.global_stress_context &&
    (data.stress_level === "High" ||
      data.stress_level === "Critical" ||
      data.climate_risk_level === "High" ||
      data.climate_risk_level === "Critical");

  return (
    <section className="glass-panel rounded-2xl p-6 lg:p-8">
      {showTitle && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <Waves className="w-5 h-5 text-cyan-600" />
            <h2 className="text-lg font-semibold text-slate-900">
              Environmental intelligence
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <span
              className={clsx(
                "text-xs font-semibold px-3 py-1 rounded-full border",
                stressStyle
              )}
            >
              {data.stress_level} stress
            </span>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-violet-100 text-violet-800">
              Drought: {data.drought_risk}
            </span>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
              Climate: {data.climate_risk_level}
            </span>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white px-5 py-4 mb-5">
        {data.environmental_summary && (
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-violet-600 mt-0.5 shrink-0" />
            <p className="text-sm text-slate-800 leading-relaxed">
              {data.environmental_summary}
            </p>
          </div>
        )}
        {!data.environmental_summary && (
          <p className="text-sm font-medium text-slate-900 leading-relaxed">
            {data.summary}
          </p>
        )}
        {showWhy && (
          <p className="text-sm text-slate-600 leading-relaxed mt-2">{data.why}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <MetricChip
          icon={<BarChart3 className="w-3.5 h-3.5" />}
          label="Risk score"
          value={`${data.environmental_risk_score}/100`}
        />
        <MetricChip
          icon={<CloudRain className="w-3.5 h-3.5" />}
          label="Rainfall"
          value={
            data.rainfall_deficit_pct != null && data.rainfall_deficit_pct > 0
              ? `${Math.round(data.rainfall_deficit_pct)}% below typical`
              : "Near typical"
          }
        />
        {data.rainfall_status && (
          <span className="text-xs text-slate-500 self-center px-1">
            {data.rainfall_status}
          </span>
        )}
      </div>

      {data.indicators.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-5">
          {data.indicators.map((ind) => (
            <div
              key={ind.name}
              className={clsx(
                "rounded-xl border px-3 py-2.5 text-xs",
                INDICATOR_PILL[ind.status] ?? INDICATOR_PILL.moderate
              )}
            >
              <p className="font-semibold opacity-80">{ind.name}</p>
              <p className="mt-0.5 font-medium tabular-nums">{ind.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        {data.drought_forecast && (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <TrendingDown className="w-4 h-4 text-cyan-600" />
                Drought outlook (~{data.drought_forecast.horizon_hours}h)
              </div>
              <span
                className={clsx(
                  "text-xs font-semibold px-2 py-0.5 rounded-full border",
                  OUTLOOK_BADGE[outlook] ?? OUTLOOK_BADGE.Stable
                )}
              >
                {outlook}
              </span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {data.drought_forecast.summary}
            </p>
          </div>
        )}

        {signals.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-slate-800">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Key signals
            </div>
            <ul className="space-y-2">
              {signals.slice(0, 4).map((sig) => (
                <li
                  key={sig.key}
                  className="text-xs text-slate-700 leading-relaxed pl-3 border-l-2 border-amber-300"
                >
                  {sig.label !== "Signal" && (
                    <span className="font-semibold">{sig.label}: </span>
                  )}
                  {sig.text}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {showGlobalContext && (
        <p className="text-xs text-cyan-900/80 bg-cyan-50/80 border border-cyan-100 rounded-lg px-4 py-3 mb-5">
          {data.global_stress_context}
        </p>
      )}

      {actions.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-4">
          <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-slate-800">
            <ListChecks className="w-4 h-4 text-emerald-600" />
            Recommended actions
          </div>
          <ul className="space-y-1.5">
            {actions.map((tip) => (
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

function MetricChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700">
      {icon}
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </span>
  );
}

export default memo(WaterCrisisPanel);
