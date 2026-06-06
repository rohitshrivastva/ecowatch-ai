"use client";

import { memo } from "react";
import {
  Activity,
  Cloud,
  Droplets,
  Smile,
  Thermometer,
  Wind,
} from "lucide-react";
import clsx from "clsx";
import type { LucideIcon } from "lucide-react";
import type { EnvironmentalAnalysis } from "@/types/environment";
import {
  aqiTone,
  cloudCoverageFromDescription,
  cloudCoverageTone,
  humidityTone,
  locationCityName,
  mainPollutant,
  pollutionIndexTone,
  temperatureTone,
  type MetricTone,
} from "@/lib/metric-colors";
import { Skeleton } from "@/components/ui/Skeleton";

const CARD_BY_TONE: Record<
  MetricTone,
  { card: string; icon: string; badge: string }
> = {
  good: {
    card: "bg-emerald-200/90 border-emerald-300",
    icon: "text-emerald-700",
    badge: "bg-emerald-600 text-white",
  },
  moderate: {
    card: "bg-amber-200/90 border-amber-300",
    icon: "text-amber-800",
    badge: "bg-amber-600 text-white",
  },
  warning: {
    card: "bg-orange-200/90 border-orange-300",
    icon: "text-orange-800",
    badge: "bg-orange-600 text-white",
  },
  danger: {
    card: "bg-red-200/90 border-red-300",
    icon: "text-red-800",
    badge: "bg-red-600 text-white",
  },
};

const METRIC_TILE_BY_TONE: Record<MetricTone, string> = {
  good: "bg-emerald-100 border-emerald-300 text-emerald-700",
  moderate: "bg-amber-100 border-amber-300 text-amber-800",
  warning: "bg-orange-100 border-orange-300 text-orange-800",
  danger: "bg-red-100 border-red-300 text-red-800",
};

function MetricPill({
  icon: Icon,
  value,
  tone,
  label,
}: {
  icon: LucideIcon;
  value: string;
  tone: MetricTone;
  label: string;
}) {
  return (
    <div className="group relative min-w-0 flex-1">
      <div
        className={clsx(
          "flex flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2.5 min-h-[64px] cursor-default transition-shadow group-hover:shadow-md",
          METRIC_TILE_BY_TONE[tone]
        )}
        aria-label={`${label}: ${value}`}
      >
        <Icon className="w-4 h-4 shrink-0" strokeWidth={2} />
        <span className="text-xs font-bold tabular-nums leading-none truncate w-full text-center">
          {value}
        </span>
      </div>
      <span
        role="tooltip"
        className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
      >
        {label}
      </span>
    </div>
  );
}

function AirQualityPanel({
  analysis,
  loading,
  locationName,
  onForecastClick,
}: {
  analysis: EnvironmentalAnalysis | null;
  loading: boolean;
  locationName?: string | null;
  onForecastClick?: () => void;
}) {
  if (loading && !analysis) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-3/4" />
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 flex-1 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-52 w-full rounded-3xl" />
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center min-h-[280px] flex items-center justify-center">
        <p className="text-sm text-slate-500">
          Search a location to view air quality.
        </p>
      </div>
    );
  }

  const aqiToneValue = aqiTone(analysis.air_pollution.aqi);
  const cardStyle = CARD_BY_TONE[aqiToneValue];
  const pollutant = mainPollutant(analysis.air_pollution);
  const city = locationCityName(locationName ?? analysis.location_name);
  const cloudCoverage = cloudCoverageFromDescription(analysis.weather.description);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-slate-900 leading-snug">
        {city} air quality index (AQI)
      </h1>

      <div className="flex gap-1 w-full">
        <MetricPill
          icon={Activity}
          value={String(analysis.risk.score)}
          tone={pollutionIndexTone(analysis.risk.score)}
          label="Pollution index"
        />
        <MetricPill
          icon={Wind}
          value={String(analysis.air_pollution.aqi)}
          tone={aqiToneValue}
          label="AQI"
        />
        <MetricPill
          icon={Thermometer}
          value={`${Math.round(analysis.weather.temperature)}°`}
          tone={temperatureTone(analysis.weather.temperature)}
          label="Temperature"
        />
        <MetricPill
          icon={Cloud}
          value={`${cloudCoverage}%`}
          tone={cloudCoverageTone(cloudCoverage)}
          label="Cloud cover"
        />
        <MetricPill
          icon={Droplets}
          value={`${analysis.weather.humidity}%`}
          tone={humidityTone(analysis.weather.humidity)}
          label="Humidity"
        />
      </div>

      <div
        className={clsx(
          "rounded-3xl border overflow-hidden shadow-sm",
          cardStyle.card
        )}
      >
        <div className="px-6 pt-5 pb-3 flex items-start justify-between gap-4">
          <div>
            <p className="text-6xl font-light leading-none tabular-nums text-slate-900">
              {analysis.air_pollution.aqi}
            </p>
            <p className="text-sm mt-1 text-slate-700">US AQI</p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <span
              className={clsx(
                "text-sm font-semibold px-3 py-1 rounded-full",
                cardStyle.badge
              )}
            >
              {analysis.air_pollution.aqi_label}
            </span>
            <Smile className={clsx("w-8 h-8", cardStyle.icon)} strokeWidth={1.5} />
          </div>
        </div>

        <div className="px-6 pb-6 flex items-center justify-between gap-3 text-sm text-slate-700">
          <span>Main pollutant: {pollutant.name}</span>
          <span className="font-semibold tabular-nums">
            {pollutant.value.toFixed(1)} {pollutant.unit}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onForecastClick}
        className="w-full rounded-full bg-slate-800 py-3.5 text-sm font-semibold uppercase tracking-wider text-white hover:bg-slate-700 transition-colors"
      >
        7-Day Forecast
      </button>
    </div>
  );
}

export default memo(AirQualityPanel);
