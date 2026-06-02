"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import EnvironmentalHero from "@/components/dashboard/EnvironmentalHero";
import MapSection from "@/components/dashboard/MapSection";
import InsightRecommendations from "@/components/dashboard/InsightRecommendations";
import AdvancedAnalytics from "@/components/dashboard/AdvancedAnalytics";
import TrendsSection from "@/components/dashboard/TrendsSection";
import { useEnvironmentalAnalysis } from "@/hooks/useEnvironmentalAnalysis";
import { useHeatmap } from "@/hooks/useHeatmap";
import type { LocationSelection } from "@/types/environment";

export default function Dashboard() {
  const [selection, setSelection] = useState<LocationSelection | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(true);
  const [trendsOpen, setTrendsOpen] = useState(false);
  const geoAbortRef = useRef(false);
  const heatmap = useHeatmap();
  const { setFocal } = heatmap;

  const { analysis, loading, error } = useEnvironmentalAnalysis(selection);

  const handleLocationSelect = useCallback((loc: LocationSelection) => {
    setSelection(loc);
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
            /* default name */
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

  useEffect(() => {
    if (!selection) {
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
  }, [selection, analysis?.risk?.score, setFocal]);

  const locationLabel = analysis
    ? analysis.location_name ||
      `${analysis.location.latitude.toFixed(4)}, ${analysis.location.longitude.toFixed(4)}`
    : selection?.name;

  const isAnalyzing = loading || detectingLocation;
  const showHeroLoading = isAnalyzing && !analysis;

  return (
    <div className="space-y-10">
      <EnvironmentalHero
        analysis={analysis}
        loading={showHeroLoading}
        locationLabel={locationLabel}
      />

      {error && (
        <div className="glass-panel p-4 border-eco-danger/50 text-eco-danger text-sm">
          {error}. Make sure the backend is running at{" "}
          {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}.
        </div>
      )}

      {analysis && (
        <p className="text-xs text-eco-muted -mt-6">
          Last updated: {new Date(analysis.timestamp).toLocaleString()}
        </p>
      )}

      <MapSection
        onLocationSelect={handleLocationSelect}
        selectedLocation={selection}
        loading={loading}
        detectingLocation={detectingLocation}
        heatmap={{
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
        }}
      />

      {analysis && (
        <>
          <InsightRecommendations analysis={analysis} loading={loading} />
          <AdvancedAnalytics analysis={analysis} />
          <section className="glass-panel overflow-hidden">
            <button
              type="button"
              onClick={() => setTrendsOpen((v) => !v)}
              className="w-full flex items-center justify-between p-5 lg:p-6 text-left hover:bg-eco-surface-hover/50 transition-colors"
            >
              <div>
                <h2 className="text-lg font-semibold text-eco-text">
                  Historical Trends
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
