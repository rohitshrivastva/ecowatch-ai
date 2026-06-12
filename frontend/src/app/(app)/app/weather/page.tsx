"use client";

import {
  CloudSun,
  Droplets,
  Thermometer,
  Wind,
  Sun,
} from "lucide-react";
import ModuleShell from "@/components/platform/ModuleShell";
import PlatformMap from "@/components/platform/PlatformMap";
import BestTimeOutside from "@/components/dashboard/BestTimeOutside";
import AIInsightCard from "@/components/platform/AIInsightCard";
import InsightPanel from "@/components/platform/InsightPanel";
import { useEnvironmentalAnalysis } from "@/hooks/useEnvironmentalAnalysis";
import { usePlatformLocation } from "@/hooks/usePlatformLocation";

function WeatherMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Thermometer;
  label: string;
  value: string;
}) {
  return (
    <div className="glass-panel rounded-xl p-4 border border-amber-100">
      <Icon className="w-5 h-5 text-amber-600 mb-2" />
      <p className="text-xs text-eco-muted">{label}</p>
      <p className="text-lg font-semibold text-eco-text mt-0.5">{value}</p>
    </div>
  );
}

export default function WeatherPage() {
  const { location, setLocation, detecting } = usePlatformLocation();
  const { analysis, loading, error } = useEnvironmentalAnalysis(location);

  const weather = analysis?.weather;
  const rec =
    analysis?.best_time_outside?.why ??
    analysis?.best_time_outside?.environmental_status ??
    analysis?.recommendations?.[0]?.description;

  return (
    <ModuleShell
      title="Weather Intelligence"
      description="Current conditions, forecast context, rainfall, wind, humidity, and outdoor recommendations."
      accent="border-amber-100 bg-gradient-to-br from-amber-50 via-white to-orange-50/50"
      location={location}
      onLocationSelect={setLocation}
      detectingLocation={detecting}
      loading={loading}
    >
      {weather && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <WeatherMetric
            icon={Thermometer}
            label="Temperature"
            value={`${Math.round(weather.temperature)}°C`}
          />
          <WeatherMetric
            icon={Droplets}
            label="Humidity"
            value={`${weather.humidity}%`}
          />
          <WeatherMetric
            icon={Wind}
            label="Wind speed"
            value={`${weather.wind_speed.toFixed(1)} m/s`}
          />
          <WeatherMetric
            icon={Sun}
            label="Conditions"
            value={weather.description}
          />
        </div>
      )}

      {analysis?.best_time_outside && (
        <BestTimeOutside data={analysis.best_time_outside} />
      )}

      {rec && (
        <AIInsightCard
          insights={[rec]}
          title="Environmental recommendation"
        />
      )}

      <InsightPanel
        icon={CloudSun}
        title="Weather map"
        description="Temperature and regional weather patterns"
      >
        <PlatformMap
          location={location}
          onLocationSelect={setLocation}
          loading={loading}
          detectingLocation={detecting}
          defaultLayer="temperature"
        />
      </InsightPanel>

      {error && (
        <div className="glass-panel p-4 text-red-800 bg-red-50 text-sm">{error}</div>
      )}
    </ModuleShell>
  );
}
