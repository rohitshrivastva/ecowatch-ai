"use client";

import { useEffect } from "react";
import clsx from "clsx";
import MapSection from "@/components/dashboard/MapSection";
import { useHeatmap } from "@/hooks/useHeatmap";
import type { LocationSelection } from "@/types/environment";
import type { HeatmapType } from "@/types/intelligence";

const LAYER_OPTIONS: { id: HeatmapType; label: string }[] = [
  { id: "aqi", label: "AQI" },
  { id: "water-stress", label: "Water stress" },
  { id: "environmental-risk", label: "Climate risk" },
  { id: "temperature", label: "Weather" },
];

export default function PlatformMap({
  location,
  onLocationSelect,
  loading,
  detectingLocation,
  defaultLayer = "aqi",
  className,
}: {
  location: LocationSelection | null;
  onLocationSelect: (loc: LocationSelection) => void;
  loading?: boolean;
  detectingLocation?: boolean;
  defaultLayer?: HeatmapType;
  className?: string;
}) {
  const heatmap = useHeatmap();

  useEffect(() => {
    heatmap.setType(defaultLayer);
    heatmap.setEnabled(true);
  }, [defaultLayer]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!location || !heatmap.enabled) {
      heatmap.setFocal(null);
      return;
    }
    heatmap.setFocal({ lat: location.latitude, lng: location.longitude });
  }, [location, heatmap.enabled, heatmap.setFocal]);

  return (
    <div className={clsx("space-y-3", className)}>
      <div className="flex flex-wrap gap-2">
        {LAYER_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => {
              heatmap.setType(opt.id);
              heatmap.setEnabled(true);
            }}
            className={clsx(
              "text-xs font-medium px-3 py-1.5 rounded-full border transition-colors",
              heatmap.type === opt.id && heatmap.enabled
                ? "bg-eco-primary text-white border-eco-primary"
                : "bg-white text-eco-muted border-eco-border hover:border-eco-primary/40"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="h-[320px] sm:h-[400px] lg:h-[440px] rounded-2xl overflow-hidden ring-1 ring-slate-200/80">
        <MapSection
          onLocationSelect={onLocationSelect}
          selectedLocation={location}
          loading={loading ?? false}
          detectingLocation={detectingLocation ?? false}
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
          embedded
          mapVariant="iqair"
          showFavorites={false}
          className="h-full"
        />
      </div>
    </div>
  );
}
