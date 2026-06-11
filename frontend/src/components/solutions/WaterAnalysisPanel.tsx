"use client";

import clsx from "clsx";
import {
  Droplets,
  Leaf,
  Waves,
  AlertTriangle,
  Sparkles,
  Thermometer,
  CloudRain,
} from "lucide-react";
import type { GeospatialAnalyzeResponse } from "@/types/geospatial";

const RISK_STYLES: Record<string, string> = {
  Low: "bg-cyan-100 text-cyan-800 border-cyan-200",
  Moderate: "bg-amber-100 text-amber-900 border-amber-200",
  High: "bg-orange-100 text-orange-900 border-orange-200",
  Critical: "bg-red-100 text-red-900 border-red-200",
};

export default function WaterAnalysisPanel({
  result,
  loading,
  error,
}: {
  result: GeospatialAnalyzeResponse | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-2xl animate-pulse">
        <p className="text-sm text-eco-primary">Processing satellite imagery…</p>
        <p className="text-xs text-eco-muted mt-2">
          Calculating NDVI, NDWI, and water crisis score
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-6 rounded-2xl border-eco-danger/40 text-eco-danger text-sm">
        {error}
      </div>
    );
  }

  if (!result) {
    return (
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-3">
          <Waves className="w-5 h-5 text-cyan-600" />
          <h2 className="text-lg font-semibold text-eco-text">
            Water Crisis Intelligence
          </h2>
        </div>
        <p className="text-sm text-eco-muted leading-relaxed">
          Select a region on the map — search, click, or draw a bounding box —
          then run analysis to generate NDVI, NDWI, and water stress overlays.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-eco-muted">
          <li>· Detect drought and vegetation stress</li>
          <li>· Monitor surface water and reservoir signals</li>
          <li>· View AI-generated water crisis insights</li>
        </ul>
      </div>
    );
  }

  const riskStyle = RISK_STYLES[result.waterRisk] ?? RISK_STYLES.Moderate;

  return (
    <div className="space-y-4">
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Waves className="w-5 h-5 text-cyan-600" />
            <h2 className="text-lg font-semibold text-eco-text">
              Region Analysis
            </h2>
          </div>
          <span
            className={clsx(
              "text-xs font-semibold px-3 py-1 rounded-full border",
              riskStyle
            )}
          >
            {result.waterRisk} risk
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            icon={<Leaf className="w-4 h-4 text-emerald-600" />}
            label="NDVI"
            value={result.ndviScore.toFixed(2)}
            hint="Vegetation health"
          />
          <MetricCard
            icon={<Droplets className="w-4 h-4 text-blue-600" />}
            label="NDWI"
            value={result.ndwiScore.toFixed(2)}
            hint="Surface water"
          />
          <MetricCard
            icon={<AlertTriangle className="w-4 h-4 text-orange-600" />}
            label="Crisis score"
            value={`${result.waterCrisisScore}/100`}
            hint="Composite water risk"
          />
          <MetricCard
            icon={<CloudRain className="w-4 h-4 text-sky-600" />}
            label="Rain deficit"
            value={`${Math.round(result.rainfallDeficitPct)}%`}
            hint="vs typical forecast"
          />
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-eco-muted">
          <Thermometer className="w-3.5 h-3.5" />
          Temperature anomaly: {result.temperatureAnomaly > 0 ? "+" : ""}
          {result.temperatureAnomaly.toFixed(1)}°C
          {result.cached && (
            <span className="ml-auto text-eco-primary">Cached result</span>
          )}
        </div>
      </div>

      {result.insights.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl border-violet-200/80">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-violet-600" />
            <h3 className="text-sm font-semibold text-violet-900">
              AI Environmental Insights
            </h3>
          </div>
          <ul className="space-y-2">
            {result.insights.map((insight) => (
              <li key={insight} className="text-sm text-slate-700 leading-relaxed">
                · {insight}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-eco-border bg-white/70 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-xs text-eco-muted">
        {icon}
        {label}
      </div>
      <p className="text-lg font-semibold text-eco-text tabular-nums mt-0.5">
        {value}
      </p>
      <p className="text-[10px] text-eco-muted">{hint}</p>
    </div>
  );
}
