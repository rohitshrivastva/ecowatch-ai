"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import { HEATMAP_GRADIENTS, clampIntensity, getHeatOptions } from "@/lib/heatmap-config";
import type { HeatmapPoint, HeatmapType } from "@/types/intelligence";

type HeatLayer = L.Layer & {
  setLatLngs: (latlngs: [number, number, number][]) => void;
  setOptions: (options: L.HeatMapOptions) => void;
};

function toLatLngs(points: HeatmapPoint[]): [number, number, number][] {
  return points.map((p) => [p.lat, p.lng, clampIntensity(p.intensity)]);
}

function removeLayer(map: L.Map, layerRef: React.MutableRefObject<HeatLayer | null>) {
  if (layerRef.current) {
    map.removeLayer(layerRef.current);
    layerRef.current = null;
  }
}

export default function HeatmapLayer({
  points,
  visible,
  heatmapType,
  zoom,
}: {
  points: HeatmapPoint[];
  visible: boolean;
  heatmapType: HeatmapType;
  zoom: number;
}) {
  const map = useMap();
  const layerRef = useRef<HeatLayer | null>(null);
  const typeRef = useRef<HeatmapType>(heatmapType);

  useEffect(() => {
    if (!visible || points.length === 0) {
      removeLayer(map, layerRef);
      return;
    }

    const latlngs = toLatLngs(points);
    const options: L.HeatMapOptions = {
      ...getHeatOptions(zoom),
      gradient: HEATMAP_GRADIENTS[heatmapType],
    };

    const typeChanged = typeRef.current !== heatmapType;
    typeRef.current = heatmapType;

    if (layerRef.current && !typeChanged) {
      layerRef.current.setLatLngs(latlngs);
      layerRef.current.setOptions(options);
      return;
    }

    removeLayer(map, layerRef);
    const layer = L.heatLayer(latlngs, options) as HeatLayer;
    layer.addTo(map);
    layerRef.current = layer;
    map.invalidateSize();

    return () => {
      removeLayer(map, layerRef);
    };
  }, [map, points, visible, heatmapType, zoom]);

  return null;
}
