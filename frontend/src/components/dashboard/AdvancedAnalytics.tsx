"use client";

import { memo, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Wind,
  Droplets,
  Thermometer,
  Sun,
  Leaf,
  TreePine,
  Waves,
  Flame,
  ChevronDown,
} from "lucide-react";
import clsx from "clsx";
import MetricCard from "@/components/MetricCard";
import RiskGauge from "@/components/RiskGauge";
import { ChartSkeleton } from "@/components/ui/Skeleton";
import type { EnvironmentalAnalysis } from "@/types/environment";

const PollutionChart = dynamic(
  () => import("@/components/Charts").then((m) => ({ default: m.PollutionChart })),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

function aqiStatus(aqi: number): "good" | "moderate" | "warning" | "danger" {
  if (aqi <= 50) return "good";
  if (aqi <= 100) return "moderate";
  if (aqi <= 150) return "warning";
  return "danger";
}

const STORAGE_KEY = "ecowatch-advanced-open";

function AdvancedAnalytics({ analysis }: { analysis: EnvironmentalAnalysis }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      setOpen(sessionStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = () => {
    setOpen((v) => {
      const next = !v;
      try {
        sessionStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <section className="glass-panel overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between gap-4 p-5 lg:p-6 text-left hover:bg-eco-surface-hover/50 transition-colors"
        aria-expanded={open}
      >
        <div>
          <h2 className="text-lg font-semibold text-eco-text">Advanced Analytics</h2>
          <p className="text-sm text-eco-muted mt-0.5">
            Pollutants, weather details, vegetation & satellite indicators
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs px-2.5 py-1 rounded-full bg-eco-surface-hover text-eco-muted">
            15 metrics
          </span>
          <ChevronDown
            className={clsx(
              "w-5 h-5 text-eco-muted transition-transform",
              open && "rotate-180"
            )}
          />
        </div>
      </button>

      {open && (
        <div className="px-5 lg:px-6 pb-6 space-y-8 border-t border-eco-border animate-fade-in-up">
          <div className="pt-6">
            <h3 className="text-xs font-medium text-eco-muted uppercase tracking-wider mb-3">
              Air Pollution
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <MetricCard
                title="AQI"
                value={analysis.air_pollution.aqi}
                icon={Wind}
                status={aqiStatus(analysis.air_pollution.aqi)}
                subtitle={analysis.air_pollution.aqi_label}
              />
              <MetricCard title="PM2.5" value={analysis.air_pollution.pm25} unit="µg/m³" icon={Wind} />
              <MetricCard title="PM10" value={analysis.air_pollution.pm10} unit="µg/m³" icon={Wind} />
              <MetricCard title="NO₂" value={analysis.air_pollution.no2} unit="µg/m³" icon={Wind} />
              <MetricCard title="CO" value={analysis.air_pollution.co} unit="µg/m³" icon={Wind} />
              <MetricCard title="Ozone" value={analysis.air_pollution.ozone} unit="µg/m³" icon={Wind} />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-medium text-eco-muted uppercase tracking-wider mb-3">
              Weather Conditions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <MetricCard
                title="Temperature"
                value={analysis.weather.temperature}
                unit="°C"
                icon={Thermometer}
                subtitle={`Feels like ${analysis.weather.feels_like}°C`}
              />
              <MetricCard title="Humidity" value={analysis.weather.humidity} unit="%" icon={Droplets} />
              <MetricCard title="Wind Speed" value={analysis.weather.wind_speed} unit="m/s" icon={Wind} />
              <MetricCard title="UV Index" value={analysis.weather.uv_index} icon={Sun} />
              <MetricCard title="Conditions" value={analysis.weather.description} icon={Sun} />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-medium text-eco-muted uppercase tracking-wider mb-3">
              Environmental Indicators
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                title="NDVI"
                value={analysis.environmental.ndvi}
                icon={Leaf}
                subtitle={analysis.environmental.ndvi_label}
                status={analysis.environmental.ndvi >= 0.4 ? "good" : "warning"}
              />
              <MetricCard
                title="Urban Heat Index"
                value={analysis.environmental.urban_heat_index}
                icon={Flame}
                status={analysis.environmental.urban_heat_index > 1.2 ? "danger" : "good"}
              />
              <MetricCard
                title="Green Coverage"
                value={analysis.environmental.green_coverage_pct}
                unit="%"
                icon={TreePine}
              />
              <MetricCard
                title="Water Proximity"
                value={analysis.environmental.water_proximity_km}
                unit="km"
                icon={Waves}
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <RiskGauge risk={analysis.risk} />
            </div>
            <div className="lg:col-span-2">
              <PollutionChart pollution={analysis.air_pollution} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default memo(AdvancedAnalytics);
