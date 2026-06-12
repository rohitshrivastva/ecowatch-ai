"use client";

import { memo } from "react";
import {
  CloudRain,
  Waves,
  Droplets,
  TrendingDown,
  ArrowDown,
  ArrowUp,
  Minus,
  Gauge,
} from "lucide-react";
import clsx from "clsx";
import type { WaterCrisisIntelligence } from "@/types/environment";

const SEVERITY_STYLES: Record<string, string> = {
  low: "text-emerald-700 bg-emerald-50 border-emerald-200",
  moderate: "text-amber-800 bg-amber-50 border-amber-200",
  high: "text-orange-800 bg-orange-50 border-orange-200",
  critical: "text-red-800 bg-red-50 border-red-200",
};

const STRESS_STYLES: Record<string, string> = {
  Low: "bg-cyan-100 text-cyan-800",
  Moderate: "bg-amber-100 text-amber-900",
  High: "bg-orange-100 text-orange-900",
  Critical: "bg-red-100 text-red-900",
};

const OUTLOOK_BADGE: Record<string, string> = {
  Worsening: "bg-orange-100 text-orange-800 border-orange-200",
  Improving: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Stable: "bg-slate-100 text-slate-700 border-slate-200",
};

const INDICATOR_PILL: Record<string, string> = {
  good: "bg-emerald-100 border-emerald-300 text-emerald-800",
  moderate: "bg-amber-100 border-amber-300 text-amber-900",
  warning: "bg-orange-100 border-orange-300 text-orange-900",
  critical: "bg-red-100 border-red-300 text-red-900",
};

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "Increasing" || trend === "Recovering")
    return <ArrowUp className="w-3.5 h-3.5 text-emerald-600" />;
  if (trend === "Decreasing" || trend === "Declining")
    return <ArrowDown className="w-3.5 h-3.5 text-orange-600" />;
  return <Minus className="w-3.5 h-3.5 text-slate-500" />;
}

function HydrologyCard({
  icon,
  title,
  badge,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-cyan-100 bg-gradient-to-br from-white to-cyan-50/40 p-4 h-full flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          {icon}
          {title}
        </div>
        {badge}
      </div>
      <div className="flex-1 text-sm text-slate-600 leading-relaxed">{children}</div>
    </div>
  );
}

function WaterHydrologyPanel({
  data,
  regionalNdwi,
}: {
  data: WaterCrisisIntelligence;
  regionalNdwi?: number | null;
}) {
  const rainfall = data.rainfall_anomaly;
  const reservoir = data.reservoir_change;
  const groundwater = data.groundwater_stress;
  const drought = data.drought_forecast;

  if (!rainfall && !reservoir && !groundwater && !drought) return null;

  return (
    <section className="glass-panel rounded-2xl p-6 lg:p-8">
      <div className="flex items-center gap-2 mb-5">
        <Gauge className="w-5 h-5 text-cyan-600" />
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Water hydrology intelligence
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Rainfall · reservoirs · groundwater · drought outlook
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rainfall && (
          <HydrologyCard
            icon={<CloudRain className="w-4 h-4 text-sky-600" />}
            title="Rainfall anomaly analysis"
            badge={
              <span
                className={clsx(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wide",
                  SEVERITY_STYLES[rainfall.severity] ?? SEVERITY_STYLES.moderate
                )}
              >
                {rainfall.status}
              </span>
            }
          >
            <div className="flex flex-wrap gap-3 mb-2 text-xs">
              <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                <TrendIcon trend={rainfall.trend} />
                {rainfall.trend} trend
              </span>
              <span className="text-slate-500">
                {rainfall.anomaly_pct > 0
                  ? `${Math.round(rainfall.anomaly_pct)}% below baseline`
                  : "Near baseline"}
              </span>
              <span className="text-slate-500">
                ~{rainfall.forecast_rain_mm} mm forecast proxy
              </span>
            </div>
            <p>{rainfall.summary}</p>
          </HydrologyCard>
        )}

        {reservoir && (
          <HydrologyCard
            icon={<Waves className="w-4 h-4 text-blue-600" />}
            title="Reservoir change detection"
            badge={
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {reservoir.direction}
              </span>
            }
          >
            <div className="mb-2">
              <div className="flex items-end justify-between text-xs mb-1">
                <span className="text-slate-500">Est. storage level</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {reservoir.storage_level_pct}%
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={clsx(
                    "h-full rounded-full transition-all",
                    reservoir.storage_level_pct < 30
                      ? "bg-red-500"
                      : reservoir.storage_level_pct < 50
                        ? "bg-amber-500"
                        : "bg-cyan-500"
                  )}
                  style={{ width: `${reservoir.storage_level_pct}%` }}
                />
              </div>
            </div>
            <p className="mb-2">{reservoir.summary}</p>
            <p className="text-xs text-cyan-900/80 bg-cyan-50/80 rounded-lg px-2 py-1.5">
              {reservoir.alert}
            </p>
            {regionalNdwi != null && (
              <p className="text-[10px] text-slate-500 mt-2">
                Regional NDWI (satellite): {regionalNdwi.toFixed(2)}
              </p>
            )}
          </HydrologyCard>
        )}

        {groundwater && (
          <HydrologyCard
            icon={<Droplets className="w-4 h-4 text-teal-600" />}
            title="Groundwater stress indicators"
            badge={
              <span
                className={clsx(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                  STRESS_STYLES[groundwater.stress_level] ?? STRESS_STYLES.Moderate
                )}
              >
                {groundwater.stress_level} · {groundwater.stress_score}/100
              </span>
            }
          >
            <p className="mb-3">{groundwater.summary}</p>
            <p className="text-xs font-medium text-slate-700 mb-2">
              Recharge outlook: {groundwater.recharge_outlook}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {groundwater.indicators.map((ind) => (
                <div
                  key={ind.name}
                  className={clsx(
                    "rounded-lg border px-2 py-1.5 text-[10px]",
                    INDICATOR_PILL[ind.status] ?? INDICATOR_PILL.moderate
                  )}
                >
                  <p className="font-semibold opacity-80">{ind.name}</p>
                  <p className="font-medium mt-0.5">{ind.value}</p>
                </div>
              ))}
            </div>
          </HydrologyCard>
        )}

        {drought && (
          <HydrologyCard
            icon={<TrendingDown className="w-4 h-4 text-orange-600" />}
            title="Drought forecasting"
            badge={
              <span
                className={clsx(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                  OUTLOOK_BADGE[drought.outlook] ?? OUTLOOK_BADGE.Stable
                )}
              >
                {drought.outlook}
              </span>
            }
          >
            <div className="flex flex-wrap gap-2 mb-2 text-[10px] font-medium uppercase tracking-wide">
              {drought.severity && (
                <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-800">
                  {drought.severity}
                </span>
              )}
              {drought.confidence && (
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {drought.confidence} confidence
                </span>
              )}
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                ~{drought.horizon_hours}h horizon
              </span>
            </div>
            <p className="mb-2">{drought.summary}</p>
            {drought.precipitation_trend && (
              <p className="text-xs text-slate-600">
                <span className="font-semibold">Precipitation:</span>{" "}
                {drought.precipitation_trend}
              </p>
            )}
            {drought.soil_moisture_outlook && (
              <p className="text-xs text-slate-600 mt-1">
                <span className="font-semibold">Soil moisture:</span>{" "}
                {drought.soil_moisture_outlook}
              </p>
            )}
          </HydrologyCard>
        )}
      </div>
    </section>
  );
}

export default memo(WaterHydrologyPanel);
