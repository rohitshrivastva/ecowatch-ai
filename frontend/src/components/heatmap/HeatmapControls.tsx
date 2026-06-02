"use client";

import { Layers, Loader2 } from "lucide-react";
import { HEATMAP_LAYER_OPTIONS } from "@/lib/heatmap-config";
import type { HeatmapType } from "@/types/intelligence";

export default function HeatmapControls({
  enabled,
  type,
  loading,
  onToggle,
  onTypeChange,
}: {
  enabled: boolean;
  type: HeatmapType;
  loading: boolean;
  onToggle: (enabled: boolean) => void;
  onTypeChange: (type: HeatmapType) => void;
}) {
  return (
    <div className="glass-panel p-3 space-y-3 min-w-[200px] shadow-lg">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-eco-text">
          <Layers className="w-4 h-4 text-eco-accent" />
          Environmental layers
        </div>
        {loading && <Loader2 className="w-4 h-4 text-eco-primary animate-spin" />}
      </div>

      <button
        type="button"
        onClick={() => onToggle(!enabled)}
        className={`w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
          enabled
            ? "bg-eco-accent/90 text-white"
            : "bg-eco-surface-hover text-eco-muted hover:text-eco-text"
        }`}
      >
        {enabled ? "Heatmap on" : "Enable heatmap"}
      </button>

      {enabled && (
        <div className="grid grid-cols-2 gap-1.5">
          {HEATMAP_LAYER_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onTypeChange(opt.id)}
              className={`px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                type === opt.id
                  ? "bg-eco-primary text-eco-bg"
                  : "bg-eco-bg border border-eco-border text-eco-muted hover:text-eco-text"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
