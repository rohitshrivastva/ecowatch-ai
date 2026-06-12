"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import type L from "leaflet";
import {
  createHeatLayer,
  type SafeHeatLayer,
} from "@/lib/leaflet-heat-safe";
import { HEATMAP_GRADIENTS, clampIntensity, getHeatOptions } from "@/lib/heatmap-config";
import type { HeatmapPoint, HeatmapType } from "@/types/intelligence";

function toLatLngs(points: HeatmapPoint[]): [number, number, number][] {
  return points.map((p) => [p.lat, p.lng, clampIntensity(p.intensity)]);
}

function removeLayer(map: L.Map, layerRef: React.MutableRefObject<SafeHeatLayer | null>) {
  if (layerRef.current) {
    map.removeLayer(layerRef.current);
    layerRef.current = null;
  }
}

function mapHasSize(map: L.Map): boolean {
  const size = map.getSize();
  if (size.x <= 0 || size.y <= 0) return false;
  const container = map.getContainer();
  return container.clientWidth > 0 && container.clientHeight > 0;
}

function disableHeatCanvasPointerEvents(layer: SafeHeatLayer) {
  const canvas = layer._canvas;
  if (canvas) canvas.style.pointerEvents = "none";
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
  const layerRef = useRef<SafeHeatLayer | null>(null);
  const typeRef = useRef<HeatmapType>(heatmapType);
  const retryCountRef = useRef(0);

  useEffect(() => {
    if (!visible || points.length === 0) {
      removeLayer(map, layerRef);
      return;
    }

    let cancelled = false;
    let retryTimer: number | null = null;
    const MAX_RETRIES = 60;

    const clearRetry = () => {
      if (retryTimer != null) {
        window.clearTimeout(retryTimer);
        retryTimer = null;
      }
    };

    const scheduleSync = (delayMs = 0) => {
      clearRetry();
      retryTimer = window.setTimeout(() => {
        if (cancelled) return;
        requestAnimationFrame(syncLayer);
      }, delayMs);
    };

    const syncLayer = () => {
      if (cancelled) return;

      if (!mapHasSize(map)) {
        removeLayer(map, layerRef);
        if (retryCountRef.current >= MAX_RETRIES) return;
        retryCountRef.current += 1;
        scheduleSync(100);
        return;
      }

      retryCountRef.current = 0;

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
          disableHeatCanvasPointerEvents(layerRef.current);
          return;
        }

        removeLayer(map, layerRef);
        const layer = createHeatLayer(latlngs, options);
        layer.addTo(map);
        disableHeatCanvasPointerEvents(layer);
        layerRef.current = layer;
      } catch {
        removeLayer(map, layerRef);
        if (!cancelled && retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current += 1;
          scheduleSync(150);
        }
      }
    };

    const onResize = () => {
      if (!mapHasSize(map)) {
        removeLayer(map, layerRef);
        scheduleSync(100);
        return;
      }
      if (!layerRef.current) {
        scheduleSync(0);
      }
    };

    map.whenReady(() => {
      requestAnimationFrame(() => scheduleSync(0));
    });
    map.on("resize", onResize);

    return () => {
      cancelled = true;
      clearRetry();
      map.off("resize", onResize);
      removeLayer(map, layerRef);
    };
  }, [map, points, visible, heatmapType, zoom, vivid]);

  return null;
}
