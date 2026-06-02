"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchHeatmap } from "@/lib/intelligence-api";
import { clampIntensity } from "@/lib/heatmap-config";
import {
  densifyHeatmapPoints,
  generateFocalSpread,
  mergeHeatmapPoints,
} from "@/lib/heatmap-spread";
import type { HeatmapBounds, HeatmapPoint, HeatmapType } from "@/types/intelligence";

const DEBOUNCE_MS = 400;

export type HeatmapFocal = {
  lat: number;
  lng: number;
  intensity?: number;
};

function sanitizePoints(points: HeatmapPoint[]): HeatmapPoint[] {
  return points
    .filter(
      (p) =>
        Number.isFinite(p.lat) &&
        Number.isFinite(p.lng) &&
        Number.isFinite(p.intensity)
    )
    .map((p) => ({
      ...p,
      intensity: clampIntensity(p.intensity),
    }));
}

function prepareRenderPoints(
  apiPoints: HeatmapPoint[],
  bounds: HeatmapBounds,
  focal: HeatmapFocal | null
): HeatmapPoint[] {
  const boundsBox = {
    north: bounds.north,
    south: bounds.south,
    east: bounds.east,
    west: bounds.west,
  };

  const dense = densifyHeatmapPoints(apiPoints, bounds.zoom, boundsBox);

  if (focal) {
    const nearest = apiPoints.reduce<HeatmapPoint | null>((best, p) => {
      if (!best) return p;
      const d = (p.lat - focal.lat) ** 2 + (p.lng - focal.lng) ** 2;
      const bd = (best.lat - focal.lat) ** 2 + (best.lng - focal.lng) ** 2;
      return d < bd ? p : best;
    }, null);

    const base =
      focal.intensity ??
      nearest?.intensity ??
      0.65;

    const focalSpread = generateFocalSpread(
      focal.lat,
      focal.lng,
      base,
      bounds.zoom,
      nearest?.value
    );
    return mergeHeatmapPoints(focalSpread, dense).slice(0, 1500);
  }

  return dense.slice(0, 1500);
}

export function useHeatmap() {
  const [enabled, setEnabled] = useState(false);
  const [type, setType] = useState<HeatmapType>("environmental-risk");
  const [points, setPoints] = useState<HeatmapPoint[]>([]);
  const [renderPoints, setRenderPoints] = useState<HeatmapPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [viewportZoom, setViewportZoom] = useState(10);
  const [lastBounds, setLastBounds] = useState<HeatmapBounds | null>(null);
  const [focal, setFocal] = useState<HeatmapFocal | null>(null);
  const [debugMode, setDebugMode] = useState(
    () =>
      typeof window !== "undefined" &&
      process.env.NODE_ENV === "development"
  );

  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingBoundsRef = useRef<HeatmapBounds | null>(null);

  const fetchForBounds = useCallback(
    async (bounds: HeatmapBounds) => {
      if (!enabled) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const id = ++requestIdRef.current;

      setLoading(true);
      setError(null);
      setViewportZoom(bounds.zoom);
      setLastBounds(bounds);

      try {
        const data = await fetchHeatmap(
          type,
          bounds,
          bounds.zoom,
          controller.signal,
          focal?.lat,
          focal?.lng
        );
        if (id !== requestIdRef.current) return;

        const sanitized = sanitizePoints(data.points);
        setPoints(sanitized);
        const prepared = prepareRenderPoints(sanitized, bounds, focal);
        setRenderPoints(prepared);
        setLastUpdated(data.updated_at ?? new Date().toISOString());

        if (process.env.NODE_ENV === "development" && prepared.length === 0) {
          console.debug("[heatmap] empty render set", type, bounds);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        if (id !== requestIdRef.current) return;
        setPoints([]);
        setRenderPoints([]);
        setError(err instanceof Error ? err.message : "Failed to load heatmap");
      } finally {
        if (id === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [enabled, type, focal]
  );

  const onBoundsChange = useCallback(
    (bounds: HeatmapBounds) => {
      pendingBoundsRef.current = bounds;
      if (!enabled) return;

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const b = pendingBoundsRef.current;
        if (b) void fetchForBounds(b);
      }, DEBOUNCE_MS);
    },
    [enabled, fetchForBounds]
  );

  useEffect(() => {
    if (!enabled) {
      abortRef.current?.abort();
      setPoints([]);
      setRenderPoints([]);
      setLoading(false);
      setError(null);
      return;
    }
    const b = pendingBoundsRef.current;
    if (b) void fetchForBounds(b);
  }, [enabled, type, focal, fetchForBounds]);

  useEffect(() => {
    if (lastBounds && points.length > 0) {
      setRenderPoints(prepareRenderPoints(points, lastBounds, focal));
    }
  }, [focal, lastBounds, points]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  return {
    enabled,
    setEnabled,
    type,
    setType,
    points,
    renderPoints,
    loading,
    error,
    lastUpdated,
    viewportZoom,
    lastBounds,
    focal,
    setFocal,
    debugMode,
    setDebugMode,
    onBoundsChange,
  };
}
