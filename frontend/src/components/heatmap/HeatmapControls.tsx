"use client";

import { memo } from "react";
import { Layers, Loader2 } from "lucide-react";
import clsx from "clsx";
import { HEATMAP_LAYER_OPTIONS } from "@/lib/heatmap-config";
import type { HeatmapType } from "@/types/intelligence";

function HeatmapControls({
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
    <div className="glass-panel p-3 shadow-lg w-full max-w-[min(100vw-2rem,420px)] sm:max-w-none sm:min-w-[280px]">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-eco-text">
          <Layers className="w-4 h-4 text-eco-accent shrink-0" />
          <span className="truncate">Map layers</span>
        </div>
        {loading && <Loader2 className="w-4 h-4 text-eco-primary animate-spin shrink-0" />}
      </div>

      <button
        type="button"
        onClick={() => onToggle(!enabled)}
        className={clsx(
          "w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-colors min-h-[44px]",
          enabled
            ? "bg-eco-accent/90 text-white"
            : "bg-eco-surface-hover text-eco-muted hover:text-eco-text"
        )}
      >
        {enabled ? "Heatmap on" : "Enable heatmap"}
      </button>

      {enabled && (
        <div
          className="flex flex-wrap gap-1 mt-2"
          role="radiogroup"
          aria-label="Heatmap layer"
        >
          {HEATMAP_LAYER_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={type === opt.id}
              onClick={() => onTypeChange(opt.id)}
              className={clsx(
                "flex-1 min-w-[calc(50%-4px)] sm:min-w-0 sm:flex-none px-2 py-2.5 rounded-md text-[11px] sm:text-xs font-medium transition-colors min-h-[44px]",
                type === opt.id
                  ? "bg-eco-primary text-white"
                  : "bg-eco-surface border border-eco-border text-eco-muted hover:text-eco-text"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(HeatmapControls);
