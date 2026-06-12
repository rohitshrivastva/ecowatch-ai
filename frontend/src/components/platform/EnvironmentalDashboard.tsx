"use client";

import {
  Wind,
  Droplets,
  Shield,
  CloudSun,
  MapPin,
} from "lucide-react";
import ScoreCard from "@/components/platform/ScoreCard";
import ModuleOverviewCard from "@/components/platform/ModuleOverviewCard";
import PlatformMap from "@/components/platform/PlatformMap";
import EnvironmentalSummary from "@/components/platform/EnvironmentalSummary";
import LocationSearchBar from "@/components/dashboard/LocationSearchBar";
import { useEnvironmentalAnalysis } from "@/hooks/useEnvironmentalAnalysis";
import { usePlatformLocation } from "@/hooks/usePlatformLocation";
import { environmentalHealthFromRisk } from "@/lib/platform-health";

export default function EnvironmentalDashboard({
  forceDefaultLocation = false,
}: {
  forceDefaultLocation?: boolean;
}) {
  const { location, setLocation, detecting, hydrated } = usePlatformLocation(
    forceDefaultLocation
  );
  const { analysis, loading, error } = useEnvironmentalAnalysis(location);

  const health = analysis
    ? environmentalHealthFromRisk(analysis.risk.score)
    : null;

  const wc = analysis?.water_crisis;
  const cr = analysis?.climate_risk;
  const air = analysis?.air_pollution;
  const weather = analysis?.weather;
  const pending = !hydrated || (loading && !analysis);

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-eco-text">
          How environmentally healthy is your location?
        </h1>
        <p className="text-sm text-eco-muted mt-2 max-w-2xl">
          Unified intelligence across air quality, water, climate risk, and
          weather — powered by AI.
        </p>
      </div>

      <div className="max-w-xl">
        <LocationSearchBar
          onLocationSelect={setLocation}
          loading={loading}
          detectingLocation={detecting}
        />
        {hydrated && location?.name && !detecting && (
          <p className="flex items-center gap-1.5 text-xs text-eco-muted mt-2 pl-1">
            <MapPin className="w-3.5 h-3.5 text-eco-primary shrink-0" />
            <span>
              Showing data for{" "}
              <span className="font-medium text-eco-text">{location.name}</span>
            </span>
          </p>
        )}
      </div>

      <ScoreCard
        score={health?.score ?? 0}
        category={health?.category ?? "Moderate"}
        loading={detecting || pending}
        subtitle={
          analysis?.location_name
            ? `Based on conditions near ${analysis.location_name}`
            : undefined
        }
      />

      {analysis?.water_crisis?.environmental_summary && (
        <EnvironmentalSummary text={analysis.water_crisis.environmental_summary} />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <ModuleOverviewCard
          title="Air Quality"
          icon={Wind}
          accent="text-sky-700 bg-sky-50 border-sky-200"
          href="/app/air-quality"
          actionLabel="View Air Quality"
          metrics={
            air
              ? [
                  { label: "AQI", value: String(air.aqi) },
                  { label: "Status", value: air.aqi_label },
                  { label: "PM2.5", value: `${air.pm25.toFixed(1)} µg/m³` },
                ]
              : [{ label: "Status", value: pending ? "Loading…" : "—" }]
          }
        />
        <ModuleOverviewCard
          title="Water Intelligence"
          icon={Droplets}
          accent="text-cyan-700 bg-cyan-50 border-cyan-200"
          href="/app/water-intelligence"
          actionLabel="View Water Intelligence"
          metrics={
            wc
              ? [
                  { label: "Water stress", value: wc.stress_level },
                  { label: "Drought risk", value: wc.drought_risk },
                  {
                    label: "Rainfall",
                    value:
                      wc.rainfall_deficit_pct != null && wc.rainfall_deficit_pct > 0
                        ? `${Math.round(wc.rainfall_deficit_pct)}% deficit`
                        : "Near typical",
                  },
                ]
              : [{ label: "Status", value: pending ? "Loading…" : "—" }]
          }
        />
        <ModuleOverviewCard
          title="Climate Risk"
          icon={Shield}
          accent="text-violet-700 bg-violet-50 border-violet-200"
          href="/app/climate-risk"
          actionLabel="View Climate Risk"
          metrics={
            cr
              ? [
                  { label: "Risk score", value: `${cr.score}/100` },
                  { label: "Level", value: cr.category },
                  { label: "Trend", value: cr.trend },
                ]
              : [{ label: "Status", value: pending ? "Loading…" : "—" }]
          }
        />
        <ModuleOverviewCard
          title="Weather"
          icon={CloudSun}
          accent="text-amber-700 bg-amber-50 border-amber-200"
          href="/app/weather"
          actionLabel="View Weather"
          metrics={
            weather
              ? [
                  { label: "Temperature", value: `${Math.round(weather.temperature)}°C` },
                  { label: "Humidity", value: `${weather.humidity}%` },
                  { label: "Wind", value: `${weather.wind_speed.toFixed(1)} m/s` },
                  {
                    label: "Rain",
                    value:
                      analysis?.best_time_outside?.rain_probability_pct != null
                        ? `${analysis.best_time_outside.rain_probability_pct}% chance`
                        : weather.description,
                  },
                ]
              : [{ label: "Status", value: pending ? "Loading…" : "—" }]
          }
        />
      </div>

      <section className="glass-panel rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-eco-text mb-1">
          Environmental map
        </h2>
        <p className="text-sm text-eco-muted mb-4">
          Explore AQI, water stress, climate risk, and weather layers. Search
          above or click the map to change location.
        </p>
        <PlatformMap
          location={location}
          onLocationSelect={setLocation}
          loading={loading}
          detectingLocation={detecting}
        />
      </section>

      {error && (
        <div className="glass-panel p-4 border-red-200 bg-red-50 text-red-800 text-sm">
          {error}. Ensure the backend is running.
        </div>
      )}
    </div>
  );
}
