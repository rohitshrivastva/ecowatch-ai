"use client";

import type { HeatmapBounds, HeatmapPoint, HeatmapType } from "@/types/intelligence";

export default function HeatmapDebugPanel({
  enabled,
  type,
  apiPointCount,
  renderPointCount,
  zoom,
  bounds,
  points,
  debugMode,
  onToggleDebug,
}: {
  enabled: boolean;
  type: HeatmapType;
  apiPointCount: number;
  renderPointCount: number;
  zoom: number;
  bounds: HeatmapBounds | null;
  points: HeatmapPoint[];
  debugMode: boolean;
  onToggleDebug: () => void;
}) {
  if (process.env.NODE_ENV !== "development") return null;

  const sample = points.slice(0, 3);

  return (
    <div className="absolute bottom-14 right-3 z-[1001] glass-panel p-2 text-[10px] text-eco-muted max-w-[220px] space-y-1">
      <button
        type="button"
        onClick={onToggleDebug}
        className="text-eco-primary hover:underline"
      >
        {debugMode ? "Hide" : "Show"} heatmap debug
      </button>
      {debugMode && enabled && (
        <>
          <p className="text-eco-text font-medium">Layer: {type}</p>
          <p>API points: {apiPointCount}</p>
          <p>Render points: {renderPointCount}</p>
          <p>Zoom: {zoom}</p>
          {bounds && (
            <p className="break-all">
              N{bounds.north.toFixed(3)} S{bounds.south.toFixed(3)}
            </p>
          )}
          {sample.map((p, i) => (
            <p key={i}>
              [{p.lat.toFixed(4)}, {p.lng.toFixed(4)}] →{" "}
              {(p.intensity * 100).toFixed(0)}%
            </p>
          ))}
        </>
      )}
    </div>
  );
}
