"use client";

import { useMemo, useState } from "react";
import { useMapEvents } from "react-leaflet";
import type { HeatmapPoint, HeatmapType } from "@/types/intelligence";

function nearestPoint(
  points: HeatmapPoint[],
  lat: number,
  lng: number
): HeatmapPoint | null {
  if (points.length === 0) return null;
  let best = points[0];
  let bestDist = Infinity;
  for (const p of points) {
    const d = (p.lat - lat) ** 2 + (p.lng - lng) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }
  return bestDist < 0.25 ? best : null;
}

function formatValue(type: HeatmapType, point: HeatmapPoint): string {
  const v = point.value ?? point.intensity;
  if (type === "aqi") return `AQI ${Math.round(v)}`;
  if (type === "temperature") return `${v.toFixed(1)}°C`;
  if (type === "vegetation") return `NDVI ${v.toFixed(2)}`;
  if (type === "water-stress") return `Water stress ${v.toFixed(0)}`;
  return `Risk ${v.toFixed(0)}`;
}

export default function HeatmapTooltip({
  points,
  heatmapType,
  enabled,
}: {
  points: HeatmapPoint[];
  heatmapType: HeatmapType;
  enabled: boolean;
}) {
  const [hover, setHover] = useState<{
    lat: number;
    lng: number;
    point: HeatmapPoint;
  } | null>(null);

  useMapEvents(
    useMemo(
      () => ({
        mousemove(e) {
          if (!enabled) {
            setHover(null);
            return;
          }
          const p = nearestPoint(points, e.latlng.lat, e.latlng.lng);
          if (p) {
            setHover({ lat: e.latlng.lat, lng: e.latlng.lng, point: p });
          } else {
            setHover(null);
          }
        },
        mouseout() {
          setHover(null);
        },
      }),
      [enabled, points]
    )
  );

  if (!enabled || !hover) return null;

  return (
    <div className="absolute top-3 left-3 z-[1001] glass-panel px-3 py-2 text-xs pointer-events-none">
      <p className="text-eco-text font-medium">{formatValue(heatmapType, hover.point)}</p>
      <p className="text-eco-muted">
        Intensity {(hover.point.intensity * 100).toFixed(0)}%
      </p>
    </div>
  );
}
