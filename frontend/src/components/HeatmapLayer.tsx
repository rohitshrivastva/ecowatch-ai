"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import type { HeatmapPoint } from "@/types/intelligence";

const GRADIENT = {
  0.0: "#10b981",
  0.35: "#84cc16",
  0.55: "#f59e0b",
  0.75: "#f97316",
  1.0: "#ef4444",
};

export default function HeatmapLayer({
  points,
  visible,
}: {
  points: HeatmapPoint[];
  visible: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (!visible || points.length === 0) {
      return undefined;
    }

    const latlngs: [number, number, number][] = points.map((p) => [
      p.lat,
      p.lng,
      p.intensity,
    ]);

    const layer = L.heatLayer(latlngs, {
      radius: 28,
      blur: 22,
      maxZoom: 14,
      minOpacity: 0.35,
      gradient: GRADIENT,
    });
    layer.addTo(map);

    return () => {
      map.removeLayer(layer);
    };
  }, [map, points, visible]);

  return null;
}
