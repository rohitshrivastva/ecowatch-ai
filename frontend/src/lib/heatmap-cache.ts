import type { HeatmapResponse, HeatmapType } from "@/types/intelligence";

type CacheEntry = { data: HeatmapResponse; at: number };

const CACHE = new Map<string, CacheEntry>();
const TTL_MS = 60_000;

export function heatmapCacheKey(
  type: HeatmapType,
  north: number,
  south: number,
  east: number,
  west: number,
  zoom: number
): string {
  return `${type}:${north.toFixed(3)},${south.toFixed(3)},${east.toFixed(3)},${west.toFixed(3)}:${zoom}`;
}

export function getCachedHeatmap(key: string): HeatmapResponse | null {
  const entry = CACHE.get(key);
  if (!entry) return null;
  if (Date.now() - entry.at > TTL_MS) {
    CACHE.delete(key);
    return null;
  }
  return entry.data;
}

export function setCachedHeatmap(key: string, data: HeatmapResponse): void {
  CACHE.set(key, { data, at: Date.now() });
  if (CACHE.size > 40) {
    let oldestKey: string | null = null;
    let oldestAt = Infinity;
    CACHE.forEach((entry, key) => {
      if (entry.at < oldestAt) {
        oldestAt = entry.at;
        oldestKey = key;
      }
    });
    if (oldestKey) CACHE.delete(oldestKey);
  }
}
