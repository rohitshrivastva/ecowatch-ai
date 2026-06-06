"use client";

import { memo } from "react";
import {
  Waves,
  Droplets,
  CloudRain,
  Sparkles,
  TrendingDown,
  AlertTriangle,
  Globe,
  Leaf,
  BarChart3,
} from "lucide-react";
import clsx from "clsx";
import type { WaterCrisisIntelligence } from "@/types/environment";

const HERO_BY_STRESS: Record<
  string,
  { card: string; badge: string; text: string }
> = {
  Low: {
    card: "bg-cyan-50/90 border-cyan-200",
    badge: "bg-cyan-600 text-white",
    text: "text-cyan-900",
  },
  Moderate: {
    card: "bg-amber-100/90 border-amber-200",
    badge: "bg-amber-600 text-white",
    text: "text-amber-900",
  },
  High: {
    card: "bg-orange-100/90 border-orange-200",
    badge: "bg-orange-600 text-white",
    text: "text-orange-900",
  },
  Critical: {
    card: "bg-red-100/90 border-red-200",
    badge: "bg-red-600 text-white",
    text: "text-red-900",
  },
};

const INDICATOR_PILL: Record<string, string> = {
  good: "bg-emerald-100 border-emerald-300 text-emerald-800",
  moderate: "bg-amber-100 border-amber-300 text-amber-900",
  warning: "bg-orange-100 border-orange-300 text-orange-900",
  critical: "bg-red-100 border-red-300 text-red-900",
};

const ANOMALY_SEVERITY: Record<string, string> = {
  moderate: "bg-amber-50 border-amber-200 text-amber-900",
  high: "bg-red-50 border-red-200 text-red-900",
  low: "bg-slate-50 border-slate-200 text-slate-700",
};

const OUTLOOK_BADGE: Record<string, string> = {
  Worsening: "bg-orange-100 text-orange-800 border-orange-200",
  Improving: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Stable: "bg-slate-100 text-slate-700 border-slate-200",
};

function WaterCrisisPanel({ data }: { data: WaterCrisisIntelligence }) {
  const hero = HERO_BY_STRESS[data.stress_level] ?? HERO_BY_STRESS.Moderate;
  const outlook = data.drought_forecast?.outlook ?? "Stable";

  return (
    <section className="glass-panel p-6 lg:p-8 rounded-2xl">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-2">
          <Waves className="w-5 h-5 text-cyan-600" />
          <h2 className="text-lg font-semibold text-slate-900">
            Environmental Intelligence
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={clsx(
              "text-xs font-semibold px-3 py-1 rounded-full",
              hero.badge
            )}
          >
            Drought risk: {data.drought_risk}
          </span>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-violet-100 text-violet-800">
            Climate risk: {data.climate_risk_level}
          </span>
        </div>
      </div>

      {data.environmental_summary && (
        <div className="rounded-2xl border border-violet-200 bg-violet-50/80 px-5 py-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-violet-600" />
            <p className="text-sm font-semibold text-violet-900">
              AI Environmental Summary
            </p>
          </div>
          <p className="text-sm text-violet-900/90 leading-relaxed">
            {data.environmental_summary}
          </p>
        </div>
      )}

      <div className={clsx("rounded-3xl border px-6 py-5 shadow-sm", hero.card)}>
        <p className="text-xl lg:text-2xl font-semibold text-slate-900 leading-snug">
          {data.summary}
        </p>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span
            className={clsx(
              "text-xs font-semibold px-3 py-1 rounded-full",
              hero.badge
            )}
          >
            {data.stress_level} water stress
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-white/70 text-slate-700 border border-white/80">
            <BarChart3 className="w-3.5 h-3.5" />
            Risk score {data.environmental_risk_score}/100
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-white/70 text-slate-700 border border-white/80">
            <CloudRain className="w-3.5 h-3.5" />
            {data.rainfall_status}
          </span>
          {data.rainfall_deficit_pct != null && data.rainfall_deficit_pct > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-white/70 text-slate-700 border border-white/80">
              <Droplets className="w-3.5 h-3.5" />
              {Math.round(data.rainfall_deficit_pct)}% below typical rain
            </span>
          )}
        </div>

        <p className={clsx("text-sm mt-4 leading-relaxed", hero.text)}>
          {data.why}
        </p>

        {data.indicators.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-5">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {data.drought_forecast && (
          <div className="rounded-2xl border border-slate-200 bg-white/60 px-5 py-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-cyan-600" />
                <p className="text-sm font-semibold text-slate-800">
                  Drought Forecast
                </p>
              </div>
              <span
                className={clsx(
                  "text-xs font-semibold px-2.5 py-0.5 rounded-full border",
                  OUTLOOK_BADGE[outlook] ?? OUTLOOK_BADGE.Stable
                )}
              >
                {outlook}
              </span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {data.drought_forecast.summary}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Horizon: ~{data.drought_forecast.horizon_hours}h
            </p>
          </div>
        )}

        {(data.climate_anomalies?.length ?? 0) > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white/60 px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <p className="text-sm font-semibold text-slate-800">
                Climate Anomalies
              </p>
            </div>
            <ul className="space-y-2">
              {data.climate_anomalies!.map((a) => (
                <li
                  key={`${a.metric}-${a.message}`}
                  className={clsx(
                    "text-xs rounded-lg border px-3 py-2",
                    ANOMALY_SEVERITY[a.severity] ?? ANOMALY_SEVERITY.low
                  )}
                >
                  <span className="font-semibold">{a.metric}: </span>
                  {a.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {(data.degradation_signals?.length ?? 0) > 0 && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/70 px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <Leaf className="w-4 h-4 text-amber-700" />
            <p className="text-sm font-semibold text-amber-900">
              Environmental Degradation Signals
            </p>
          </div>
          <ul className="space-y-1.5">
            {data.degradation_signals!.map((signal) => (
              <li key={signal} className="text-sm text-amber-900/90">
                · {signal}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.global_stress_context && (
        <div className="mt-4 rounded-2xl border border-cyan-200 bg-cyan-50/60 px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-cyan-700" />
            <p className="text-sm font-semibold text-cyan-900">
              Global Water Stress Context
            </p>
          </div>
          <p className="text-sm text-cyan-900/90 leading-relaxed">
            {data.global_stress_context}
          </p>
        </div>
      )}

      {(data.sustainability_insights?.length ?? 0) > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <p className="text-sm font-medium text-slate-700 mb-2">
            AI-Assisted Sustainability Insights
          </p>
          <ul className="space-y-1.5">
            {data.sustainability_insights!.map((tip) => (
              <li key={tip} className="text-sm text-slate-600">
                · {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.recommendations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <p className="text-sm font-medium text-slate-700 mb-2">
            Decision-Making Recommendations
          </p>
          <ul className="space-y-1.5">
            {data.recommendations.map((tip) => (
              <li key={tip} className="text-sm text-slate-600">
                · {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export default memo(WaterCrisisPanel);
