"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { Layers } from "lucide-react";
import MapSection from "@/components/dashboard/MapSection";
import { useHeatmap } from "@/hooks/useHeatmap";
import {
  ENVIRONMENTAL_GIS_LAYERS,
  gisLayerToHeatmap,
  isMockGisLayer,
  type EnvironmentalGisLayerId,
} from "@/lib/gis-layers";
import type { LocationSelection } from "@/types/environment";

export default function EnvironmentalHeroMap({
  location,
  onLocationSelect,
  loading,
  detectingLocation,
}: {
  location: LocationSelection | null;
  onLocationSelect: (loc: LocationSelection) => void;
  loading?: boolean;
  detectingLocation?: boolean;
}) {
  const [activeLayer, setActiveLayer] = useState<EnvironmentalGisLayerId>("aqi");
  const heatmap = useHeatmap();

  useEffect(() => {
    heatmap.setType(gisLayerToHeatmap(activeLayer));
    const timer = window.setTimeout(() => heatmap.setEnabled(true), 300);
    return () => {
      window.clearTimeout(timer);
      heatmap.setEnabled(false);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    heatmap.setType(gisLayerToHeatmap(activeLayer));
    heatmap.setEnabled(true);
  }, [activeLayer]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!location || !heatmap.enabled) {
      heatmap.setFocal(null);
      return;
    }
    heatmap.setFocal({ lat: location.latitude, lng: location.longitude });
  }, [location, heatmap.enabled, heatmap.setFocal]);

  const activeMeta = ENVIRONMENTAL_GIS_LAYERS.find((l) => l.id === activeLayer);

  return (
    <section className="relative rounded-2xl overflow-hidden ring-1 ring-slate-200/90 shadow-lg bg-slate-900/5">
      <div className="absolute top-3 left-3 right-3 z-[1001] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto flex flex-wrap gap-1.5">
          {ENVIRONMENTAL_GIS_LAYERS.map((layer) => (
            <button
              key={layer.id}
              type="button"
              onClick={() => setActiveLayer(layer.id)}
              className={clsx(
                "text-[11px] font-medium px-2.5 py-1.5 rounded-full border backdrop-blur-sm transition-colors",
                activeLayer === layer.id
                  ? "bg-eco-primary text-white border-eco-primary shadow-sm"
                  : "bg-white/95 text-slate-600 border-slate-200/80 hover:border-eco-primary/40"
              )}
            >
              {layer.label}
              {layer.mock && (
                <span className="ml-1 opacity-70 text-[9px]">preview</span>
              )}
            </button>
          ))}
        </div>
        <div className="pointer-events-none hidden sm:flex items-center gap-1.5 rounded-lg bg-slate-900/75 backdrop-blur-sm px-2.5 py-1.5 text-[10px] text-slate-200 border border-slate-700/50">
          <Layers className="w-3 h-3" />
          GIS layers
        </div>
      </div>

      {activeMeta?.mock && (
        <div className="absolute bottom-14 left-3 z-[1001] rounded-lg bg-amber-50/95 border border-amber-200 px-2.5 py-1.5 text-[10px] text-amber-900 max-w-[220px]">
          Preview layer — full {activeMeta.label.toLowerCase()} GIS overlay coming soon
        </div>
      )}

      <div className="h-[min(420px,58vh)] sm:h-[min(480px,62vh)] lg:h-[min(520px,68vh)]">
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

      {isMockGisLayer(activeLayer) && (
        <div
          className="absolute inset-0 pointer-events-none z-[500] opacity-[0.08]"
          style={{
            background:
              activeLayer === "rainfall"
                ? "linear-gradient(135deg, #3b82f6 0%, #06b6d4 50%, #0ea5e9 100%)"
                : "linear-gradient(135deg, #14532d 0%, #4ade80 100%)",
          }}
          aria-hidden
        />
      )}
    </section>
  );
}
