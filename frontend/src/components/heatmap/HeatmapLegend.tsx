"use client";

import { HEATMAP_GRADIENTS, HEATMAP_LEGENDS } from "@/lib/heatmap-config";
import type { HeatmapType } from "@/types/intelligence";

function gradientCss(type: HeatmapType): string {
  const stops = HEATMAP_GRADIENTS[type];
  const entries = Object.entries(stops)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([pct, color]) => `${color} ${Number(pct) * 100}%`);
  return `linear-gradient(to right, ${entries.join(", ")})`;
}

export default function HeatmapLegend({
  type,
  lastUpdated,
}: {
  type: HeatmapType;
  lastUpdated?: string | null;
}) {
  const legend = HEATMAP_LEGENDS[type];

  return (
    <div className="glass-panel px-3 py-2 text-xs text-eco-muted space-y-2 min-w-[180px]">
      <p className="font-medium text-eco-text">{legend.title}</p>
      <div className="flex items-center gap-2">
        <span className="text-[10px] w-12 shrink-0">{legend.low}</span>
        <div
          className="h-2 flex-1 rounded-full"
          style={{ background: gradientCss(type) }}
        />
        <span className="text-[10px] w-12 shrink-0 text-right">{legend.high}</span>
      </div>
      {lastUpdated && (
        <p className="text-[10px] text-eco-muted border-t border-eco-border pt-1">
          Updated {new Date(lastUpdated).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
