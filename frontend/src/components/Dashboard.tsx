"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
  Loader2,
} from "lucide-react";
import MetricCard from "@/components/MetricCard";
import RiskGauge from "@/components/RiskGauge";
import AIRecommendations from "@/components/AIRecommendations";
import { PollutionChart, TrendChart } from "@/components/Charts";
import { analyzeLocation } from "@/lib/api";
import type { EnvironmentalAnalysis, LocationSelection } from "@/types/environment";

const InteractiveMap = dynamic(() => import("@/components/InteractiveMap"), {
  ssr: false,
  loading: () => (
    <div className="glass-panel h-[500px] flex items-center justify-center text-eco-muted">
      Loading map...
    </div>
  ),
});

function aqiStatus(aqi: number): "good" | "moderate" | "warning" | "danger" {
  if (aqi <= 50) return "good";
  if (aqi <= 100) return "moderate";
  if (aqi <= 150) return "warning";
  return "danger";
}

export default function Dashboard() {
  const [analysis, setAnalysis] = useState<EnvironmentalAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selection, setSelection] = useState<LocationSelection | null>(null);
  const geoAbortRef = useRef(false);

  const handleLocationSelect = useCallback(async (loc: LocationSelection) => {
    setSelection(loc);
    setLoading(true);
    setError(null);

    try {
      const result = await analyzeLocation(loc);
      setAnalysis(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      setError(message);
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    geoAbortRef.current = false;

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setDetectingLocation(false);
      return;
    }

    const failSafeTimer = window.setTimeout(() => {
      if (!geoAbortRef.current) setDetectingLocation(false);
    }, 20000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (geoAbortRef.current) return;

        const { latitude, longitude } = position.coords;
        setDetectingLocation(false);

        void (async () => {
          let name = "Your location";
          try {
            const controller = new AbortController();
            const nominatimTimer = window.setTimeout(() => controller.abort(), 5000);
            const geoResp = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
              {
                headers: { "Accept-Language": "en" },
                signal: controller.signal,
              }
            );
            window.clearTimeout(nominatimTimer);
            if (geoResp.ok) {
              const geoData = await geoResp.json();
              if (typeof geoData.display_name === "string") {
                name = geoData.display_name;
              }
            }
          } catch {
            /* use default name */
          }

          if (geoAbortRef.current) return;
          await handleLocationSelect({ latitude, longitude, name });
        })();
      },
      () => {
        if (!geoAbortRef.current) setDetectingLocation(false);
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
    );

    return () => {
      geoAbortRef.current = true;
      window.clearTimeout(failSafeTimer);
    };
  }, [handleLocationSelect]);

  return (
    <div className="space-y-6">
      <InteractiveMap
        onLocationSelect={handleLocationSelect}
        selectedLocation={selection}
        loading={loading}
        detectingLocation={detectingLocation}
      />

      {error && (
        <div className="glass-panel p-4 border-eco-danger/50 text-eco-danger text-sm">
          {error}. Make sure the backend is running at{" "}
          {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}.
        </div>
      )}

      {detectingLocation && !analysis && (
        <div className="glass-panel p-12 text-center">
          <Loader2 className="w-12 h-12 text-eco-primary mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-semibold text-eco-text mb-2">
            Detecting your location
          </h3>
          <p className="text-eco-muted text-sm max-w-md mx-auto">
            Allow location access in your browser to load environmental data for
            where you are now.
          </p>
        </div>
      )}

      {!analysis && !loading && !detectingLocation && !error && (
        <div className="glass-panel p-12 text-center">
          <Leaf className="w-12 h-12 text-eco-primary mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-eco-text mb-2">
            Select a Location
          </h3>
          <p className="text-eco-muted text-sm max-w-md mx-auto">
            Click anywhere on the map, search for a city, or draw an area to
            analyze environmental conditions and receive AI-powered recommendations.
          </p>
        </div>
      )}

      {analysis && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">
                {analysis.location_name ||
                  `${analysis.location.latitude.toFixed(4)}, ${analysis.location.longitude.toFixed(4)}`}
              </h2>
              <p className="text-sm text-eco-muted">
                Last updated: {new Date(analysis.timestamp).toLocaleString()}
              </p>
            </div>
          </div>

          <section>
            <h3 className="text-sm font-medium text-eco-muted uppercase tracking-wider mb-3">
              Air Pollution
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <MetricCard
                title="AQI"
                value={analysis.air_pollution.aqi}
                icon={Wind}
                status={aqiStatus(analysis.air_pollution.aqi)}
                subtitle={analysis.air_pollution.aqi_label}
                delay={0}
              />
              <MetricCard title="PM2.5" value={analysis.air_pollution.pm25} unit="µg/m³" icon={Wind} delay={50} />
              <MetricCard title="PM10" value={analysis.air_pollution.pm10} unit="µg/m³" icon={Wind} delay={100} />
              <MetricCard title="NO₂" value={analysis.air_pollution.no2} unit="µg/m³" icon={Wind} delay={150} />
              <MetricCard title="CO" value={analysis.air_pollution.co} unit="µg/m³" icon={Wind} delay={200} />
              <MetricCard title="Ozone" value={analysis.air_pollution.ozone} unit="µg/m³" icon={Wind} delay={250} />
            </div>
          </section>

          <section>
            <h3 className="text-sm font-medium text-eco-muted uppercase tracking-wider mb-3">
              Weather Conditions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <MetricCard
                title="Temperature"
                value={analysis.weather.temperature}
                unit="°C"
                icon={Thermometer}
                subtitle={`Feels like ${analysis.weather.feels_like}°C`}
                delay={0}
              />
              <MetricCard title="Humidity" value={analysis.weather.humidity} unit="%" icon={Droplets} delay={50} />
              <MetricCard title="Wind Speed" value={analysis.weather.wind_speed} unit="m/s" icon={Wind} delay={100} />
              <MetricCard title="UV Index" value={analysis.weather.uv_index} icon={Sun} delay={150} />
              <MetricCard title="Conditions" value={analysis.weather.description} icon={Sun} delay={200} />
            </div>
          </section>

          <section>
            <h3 className="text-sm font-medium text-eco-muted uppercase tracking-wider mb-3">
              Environmental Indicators
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                title="NDVI"
                value={analysis.environmental.ndvi}
                icon={Leaf}
                subtitle={analysis.environmental.ndvi_label}
                status={analysis.environmental.ndvi >= 0.4 ? "good" : "warning"}
                delay={0}
              />
              <MetricCard
                title="Urban Heat Index"
                value={analysis.environmental.urban_heat_index}
                icon={Flame}
                status={analysis.environmental.urban_heat_index > 1.2 ? "danger" : "good"}
                delay={50}
              />
              <MetricCard
                title="Green Coverage"
                value={analysis.environmental.green_coverage_pct}
                unit="%"
                icon={TreePine}
                delay={100}
              />
              <MetricCard
                title="Water Proximity"
                value={analysis.environmental.water_proximity_km}
                unit="km"
                icon={Waves}
                delay={150}
              />
            </div>
          </section>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <RiskGauge risk={analysis.risk} />
            </div>
            <div className="lg:col-span-2 grid gap-6">
              <PollutionChart pollution={analysis.air_pollution} />
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <TrendChart environmental={analysis.environmental} />
            <AIRecommendations recommendations={analysis.recommendations} />
          </div>
        </>
      )}
    </div>
  );
}
