"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import LocationSearchBar from "@/components/dashboard/LocationSearchBar";
import AirQualityPanel from "@/components/dashboard/AirQualityPanel";
import BestTimeOutside from "@/components/dashboard/BestTimeOutside";
import WaterCrisisPanel from "@/components/dashboard/WaterCrisisPanel";
import MapSection from "@/components/dashboard/MapSection";
import InsightRecommendations from "@/components/dashboard/InsightRecommendations";
import AdvancedAnalytics from "@/components/dashboard/AdvancedAnalytics";
import TrendsSection from "@/components/dashboard/TrendsSection";
import { useEnvironmentalAnalysis } from "@/hooks/useEnvironmentalAnalysis";
import { useHeatmap } from "@/hooks/useHeatmap";
import { resolveInitialLocation } from "@/lib/geo";
import type { LocationSelection } from "@/types/environment";

interface DashboardProps {
  forceDefaultLocation?: boolean;
}

export default function Dashboard({
  forceDefaultLocation = false,
}: DashboardProps) {
  const [selection, setSelection] = useState<LocationSelection | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(true);
  const [trendsOpen, setTrendsOpen] = useState(false);
  const geoAbortRef = useRef(false);
  const trendsRef = useRef<HTMLElement>(null);
  const heatmap = useHeatmap();
  const { setFocal } = heatmap;

  const { analysis, loading, error } = useEnvironmentalAnalysis(selection);

  const handleLocationSelect = useCallback((loc: LocationSelection) => {
    setSelection(loc);
  }, []);

  useEffect(() => {
    geoAbortRef.current = false;
    setDetectingLocation(true);

    const controller = new AbortController();
    const failSafeTimer = window.setTimeout(() => controller.abort(), 10000);

    void (async () => {
      const location = await resolveInitialLocation({
        forceDefault: forceDefaultLocation,
        signal: controller.signal,
      });
      if (geoAbortRef.current) return;
      handleLocationSelect(location);
      setDetectingLocation(false);
    })();

    return () => {
      geoAbortRef.current = true;
      controller.abort();
      window.clearTimeout(failSafeTimer);
    };
  }, [handleLocationSelect, forceDefaultLocation]);

  useEffect(() => {
    if (!selection || !heatmap.enabled) {
      heatmap.setFocal(null);
      return;
    }
    const intensity =
      analysis?.risk?.score != null ? analysis.risk.score / 100 : undefined;
    heatmap.setFocal({
      lat: selection.latitude,
      lng: selection.longitude,
      intensity,
    });
  }, [
    selection,
    analysis?.risk?.score,
    heatmap.enabled,
    setFocal,
    heatmap.setFocal,
  ]);

  const isAnalyzing = loading || detectingLocation;
  const showPanelLoading = isAnalyzing && !analysis;

  const heatmapProps = {
    enabled: heatmap.enabled,
    type: heatmap.type,
    points: heatmap.points,
    renderPoints: heatmap.renderPoints,
    loading: heatmap.loading,
    error: heatmap.error,
    lastUpdated: heatmap.lastUpdated,
    viewportZoom: heatmap.viewportZoom,
    lastBounds: heatmap.lastBounds,
    debugMode: heatmap.debugMode,
    onToggleDebug: () => heatmap.setDebugMode((d) => !d),
    onToggle: heatmap.setEnabled,
    onTypeChange: heatmap.setType,
    onBoundsChange: heatmap.onBoundsChange,
  };

  const openForecast = () => {
    setTrendsOpen(true);
    window.setTimeout(() => {
      trendsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const locationLabel =
    analysis?.location_name ?? selection?.name ?? null;

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(300px,380px)_1fr] gap-6 lg:gap-8 lg:items-start">
        <div className="flex flex-col gap-4">
          <LocationSearchBar
            onLocationSelect={handleLocationSelect}
            loading={loading}
            detectingLocation={detectingLocation}
          />
          <AirQualityPanel
            analysis={analysis}
            loading={showPanelLoading}
            locationName={locationLabel}
            onForecastClick={openForecast}
          />
        </div>

        <div className="h-[320px] sm:h-[380px] lg:h-[460px]">
          <MapSection
            onLocationSelect={handleLocationSelect}
            selectedLocation={selection}
            loading={loading}
            detectingLocation={detectingLocation}
            heatmap={heatmapProps}
            embedded
            mapVariant="iqair"
            showFavorites={false}
            className="h-full"
          />
        </div>
      </div>

      {error && (
        <div className="glass-panel p-4 border-eco-danger/50 text-eco-danger text-sm">
          {error}. Make sure the backend is running at{" "}
          {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}.
        </div>
      )}

      {analysis?.best_time_outside && (
        <BestTimeOutside data={analysis.best_time_outside} />
      )}

      {analysis?.water_crisis && (
        <WaterCrisisPanel data={analysis.water_crisis} />
      )}

      {analysis && (
        <>
          <InsightRecommendations analysis={analysis} loading={loading} />
          <AdvancedAnalytics analysis={analysis} />
          <section
            ref={trendsRef}
            className="glass-panel overflow-hidden scroll-mt-24"
          >
            <button
              type="button"
              onClick={() => setTrendsOpen((v) => !v)}
              className="w-full flex items-center justify-between p-5 lg:p-6 text-left hover:bg-eco-surface-hover/50 transition-colors"
            >
              <div>
                <h2 className="text-lg font-semibold text-eco-text">
                  7-Day Forecast & Historical Trends
                </h2>
                <p className="text-sm text-eco-muted mt-0.5">
                  AQI, temperature, humidity & risk over time
                </p>
              </div>
              <span className="text-xs text-eco-primary">
                {trendsOpen ? "Hide" : "Expand"}
              </span>
            </button>
            {trendsOpen && (
              <div className="px-5 lg:px-6 pb-6 border-t border-eco-border">
                <TrendsSection
                  locationId={analysis.location_id}
                  enabled={trendsOpen}
                />
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
