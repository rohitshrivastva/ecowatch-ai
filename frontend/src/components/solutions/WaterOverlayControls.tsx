"use client";

import clsx from "clsx";
import type { WaterOverlayLayer } from "@/types/geospatial";

const LAYER_META: Record<
  WaterOverlayLayer,
  { label: string; gradient: string; low: string; high: string }
> = {
  ndvi: {
    label: "NDVI — Vegetation",
    gradient:
      "linear-gradient(to right, #8B4513, #D2B48C, #FFFF00, #32CD32, #006400)",
    low: "Severe stress",
    high: "Healthy",
  },
  ndwi: {
    label: "NDWI — Surface Water",
    gradient:
      "linear-gradient(to right, #DC2626, #F97316, #FACC15, #7DD3FC, #2563EB)",
    low: "Water loss",
    high: "Water present",
  },
  waterStress: {
    label: "Water Stress",
    gradient:
      "linear-gradient(to right, #06B6D4, #22D3EE, #FBBF24, #F97316, #B91C1C)",
    low: "Low stress",
    high: "Critical",
  },
  climateRisk: {
    label: "Climate Risk",
    gradient:
      "linear-gradient(to right, #22C55E, #A3E635, #FACC15, #F97316, #7F1D1D)",
    low: "Safe",
    high: "Critical",
  },
};

export default function WaterOverlayControls({
  layers,
  opacity,
  onToggleLayer,
  onOpacityChange,
  compact = false,
}: {
  layers: Record<WaterOverlayLayer, boolean>;
  opacity: number;
  onToggleLayer: (layer: WaterOverlayLayer) => void;
  onOpacityChange: (value: number) => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-1.5 bg-white/95 backdrop-blur-sm rounded-lg px-2 py-1.5 shadow-sm border border-slate-200/80">
        {(Object.keys(LAYER_META) as WaterOverlayLayer[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onToggleLayer(key)}
            className={clsx(
              "text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors",
              layers[key]
                ? key === "ndwi"
                  ? "bg-blue-600 text-white border-blue-600"
                  : key === "ndvi"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : key === "climateRisk"
                      ? "bg-violet-700 text-white border-violet-700"
                      : "bg-orange-600 text-white border-orange-600"
                : "bg-white text-slate-500 border-slate-200"
            )}
          >
            {LAYER_META[key].label.split(" — ")[0]}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="glass-panel p-4 rounded-xl space-y-3">
      <p className="text-xs font-semibold text-eco-text uppercase tracking-wide">
        Overlay layers
      </p>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(LAYER_META) as WaterOverlayLayer[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onToggleLayer(key)}
            className={clsx(
              "text-xs font-medium px-3 py-1.5 rounded-full border transition-colors",
              layers[key]
                ? "bg-eco-primary text-white border-eco-primary"
                : "bg-white text-eco-muted border-eco-border hover:border-eco-primary/40"
            )}
          >
            {LAYER_META[key].label.split(" — ")[0]}
          </button>
        ))}
      </div>

      <div>
        <label className="text-xs text-eco-muted flex justify-between mb-1">
          <span>Opacity</span>
          <span>{Math.round(opacity * 100)}%</span>
        </label>
        <input
          type="range"
          min={0.2}
          max={1}
          step={0.05}
          value={opacity}
          onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
          className="w-full accent-eco-primary"
        />
      </div>

      <div className="space-y-2 pt-1 border-t border-eco-border">
        {(Object.keys(LAYER_META) as WaterOverlayLayer[]).map((key) =>
          layers[key] ? (
            <div key={key}>
              <p className="text-[10px] font-medium text-eco-muted mb-1">
                {LAYER_META[key].label}
              </p>
              <div
                className="h-2 rounded-full"
                style={{ background: LAYER_META[key].gradient }}
              />
              <div className="flex justify-between text-[9px] text-eco-muted mt-0.5">
                <span>{LAYER_META[key].low}</span>
                <span>{LAYER_META[key].high}</span>
              </div>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}
