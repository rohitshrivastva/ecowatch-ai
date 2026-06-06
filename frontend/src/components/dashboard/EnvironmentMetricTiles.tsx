"use client";

import { memo } from "react";
import {
  Activity,
  Wind,
  Thermometer,
  Cloud,
  Droplets,
} from "lucide-react";
import clsx from "clsx";
import type { LucideIcon } from "lucide-react";
import type { EnvironmentalAnalysis } from "@/types/environment";
import {
  aqiTone,
  cloudCoverageFromDescription,
  cloudCoverageTone,
  humidityTone,
  pollutionIndexTone,
  temperatureTone,
  toneBgClasses,
  toneClasses,
  type MetricTone,
} from "@/lib/metric-colors";
import { Skeleton } from "@/components/ui/Skeleton";

interface MetricTileProps {
  icon: LucideIcon;
  value: string;
  tone: MetricTone;
}

function MetricTile({ icon: Icon, value, tone }: MetricTileProps) {
  return (
    <div
      className={clsx(
        "flex items-center gap-3 rounded-xl border px-4 py-3",
        toneBgClasses[tone]
      )}
    >
      <Icon className={clsx("w-6 h-6 shrink-0", toneClasses[tone])} />
      <span className={clsx("text-2xl font-bold tabular-nums", toneClasses[tone])}>
        {value}
      </span>
    </div>
  );
}

function EnvironmentMetricTiles({
  analysis,
  loading,
}: {
  analysis: EnvironmentalAnalysis | null;
  loading: boolean;
}) {
  if (loading && !analysis) {
    return (
      <div className="glass-panel p-4 h-full min-h-[320px] lg:min-h-[480px] flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="glass-panel p-6 h-full min-h-[320px] lg:min-h-[480px] flex items-center justify-center text-center">
        <p className="text-sm text-eco-muted">
          Search or click the map to view environmental metrics.
        </p>
      </div>
    );
  }

  const cloudCoverage = cloudCoverageFromDescription(analysis.weather.description);

  const tiles: { id: string; tile: MetricTileProps }[] = [
    {
      id: "pollution",
      tile: {
        icon: Activity,
        value: String(analysis.risk.score),
        tone: pollutionIndexTone(analysis.risk.score),
      },
    },
    {
      id: "aqi",
      tile: {
        icon: Wind,
        value: String(analysis.air_pollution.aqi),
        tone: aqiTone(analysis.air_pollution.aqi),
      },
    },
    {
      id: "temp",
      tile: {
        icon: Thermometer,
        value: `${Math.round(analysis.weather.temperature)}°`,
        tone: temperatureTone(analysis.weather.temperature),
      },
    },
    {
      id: "clouds",
      tile: {
        icon: Cloud,
        value: `${cloudCoverage}%`,
        tone: cloudCoverageTone(cloudCoverage),
      },
    },
    {
      id: "humidity",
      tile: {
        icon: Droplets,
        value: `${analysis.weather.humidity}%`,
        tone: humidityTone(analysis.weather.humidity),
      },
    },
  ];

  return (
    <div className="glass-panel p-4 h-full min-h-[320px] lg:min-h-[480px] flex flex-col justify-center gap-3">
      {tiles.map(({ id, tile }) => (
        <MetricTile key={id} {...tile} />
      ))}
    </div>
  );
}

export default memo(EnvironmentMetricTiles);
