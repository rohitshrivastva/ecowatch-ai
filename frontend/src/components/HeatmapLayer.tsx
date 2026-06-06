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

function mapHasSize(map: L.Map): boolean {
  const size = map.getSize();
  return size.x > 0 && size.y > 0;
}

export default function HeatmapLayer({
  points,
  visible,
  heatmapType,
  zoom,
  vivid = false,
}: {
  points: HeatmapPoint[];
  visible: boolean;
  heatmapType: HeatmapType;
  zoom: number;
  vivid?: boolean;
}) {
  const map = useMap();
  const layerRef = useRef<HeatLayer | null>(null);
  const typeRef = useRef<HeatmapType>(heatmapType);

  useEffect(() => {
    if (!visible || points.length === 0) {
      removeLayer(map, layerRef);
      return;
    }

    let cancelled = false;
    let retryTimer: number | null = null;

    const syncLayer = () => {
      if (cancelled) return;

      if (!mapHasSize(map)) {
        map.invalidateSize();
        retryTimer = window.setTimeout(syncLayer, 50);
        return;
      }

      const latlngs = toLatLngs(points);
      const options: L.HeatMapOptions = {
        ...getHeatOptions(zoom, vivid),
        gradient: HEATMAP_GRADIENTS[heatmapType],
      };

      const typeChanged = typeRef.current !== heatmapType;
      typeRef.current = heatmapType;

      try {
        if (layerRef.current && !typeChanged) {
          layerRef.current.setLatLngs(latlngs);
          layerRef.current.setOptions(options);
          return;
        }

        removeLayer(map, layerRef);
        const layer = L.heatLayer(latlngs, options) as HeatLayer;
        layer.addTo(map);
        layerRef.current = layer;
      } catch {
        removeLayer(map, layerRef);
        if (!cancelled) {
          retryTimer = window.setTimeout(syncLayer, 100);
        }
      }
    };

    map.invalidateSize();
    syncLayer();
    map.on("resize", syncLayer);

    return () => {
      cancelled = true;
      if (retryTimer) window.clearTimeout(retryTimer);
      map.off("resize", syncLayer);
      removeLayer(map, layerRef);
    };
  }, [map, points, visible, heatmapType, zoom, vivid]);

  return null;
}
