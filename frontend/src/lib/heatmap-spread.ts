import { clampIntensity } from "@/lib/heatmap-config";
import type { HeatmapPoint } from "@/types/intelligence";

const SPREAD_PATTERN: [number, number, number][] = [
  [0, 0, 1],
  [1, 0, 0.92],
  [-1, 0, 0.88],
  [0, 1, 0.85],
  [0, -1, 0.8],
  [1, 1, 0.78],
  [1, -1, 0.76],
  [-1, 1, 0.74],
  [-1, -1, 0.72],
  [2, 0, 0.65],
  [-2, 0, 0.62],
  [0, 2, 0.6],
  [0, -2, 0.58],
];

export function spreadStepForZoom(zoom: number, bounds?: {
  north: number;
  south: number;
  east: number;
  west: number;
}): number {
  if (bounds) {
    const latSpan = Math.max(0.01, bounds.north - bounds.south);
    const lonSpan = Math.max(0.01, bounds.east - bounds.west);
    const base = Math.max(latSpan, lonSpan) / 12;
    return base * (1 + Math.max(0, 14 - zoom) * 0.06);
  }
  return 0.012 * (1 + Math.max(0, 14 - zoom) * 0.05);
}

/**
 * Expand each API point with spatial neighbors for smooth GIS-style blending.
 */
export function densifyHeatmapPoints(
  points: HeatmapPoint[],
  zoom: number,
  bounds?: { north: number; south: number; east: number; west: number },
  maxTotal = 1200
): HeatmapPoint[] {
  if (points.length === 0) return [];

  const step = spreadStepForZoom(zoom, bounds);
  const out: HeatmapPoint[] = [];

  for (const p of points) {
    for (const [dlatM, dlonM, factor] of SPREAD_PATTERN) {
      if (out.length >= maxTotal) return out;
      out.push({
        lat: p.lat + dlatM * step,
        lng: p.lng + dlonM * step,
        intensity: clampIntensity(p.intensity * factor),
        value: p.value,
      });
    }
  }
  return out;
}

/**
 * Extra dense spread around the user's selected pin.
 */
export function generateFocalSpread(
  lat: number,
  lng: number,
  baseIntensity: number,
  zoom: number,
  value?: number | null
): HeatmapPoint[] {
  const step = spreadStepForZoom(zoom) * 1.1;
  const intensity = clampIntensity(baseIntensity);
  const cluster: HeatmapPoint[] = [];

  for (let ring = 0; ring < 3; ring++) {
    const ringStep = step * (ring + 1);
    const ringFactor = Math.max(0.4, 1 - ring * 0.2);
    for (const [dlatM, dlonM, factor] of SPREAD_PATTERN) {
      if (ring > 0 && dlatM === 0 && dlonM === 0) continue;
      cluster.push({
        lat: lat + dlatM * ringStep,
        lng: lng + dlonM * ringStep,
        intensity: clampIntensity(intensity * factor * ringFactor),
        value: value ?? undefined,
      });
    }
  }
  return cluster;
}

export function mergeHeatmapPoints(
  ...groups: HeatmapPoint[][]
): HeatmapPoint[] {
  const seen = new Set<string>();
  const merged: HeatmapPoint[] = [];
  for (const group of groups) {
    for (const p of group) {
      const key = `${p.lat.toFixed(5)}:${p.lng.toFixed(5)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(p);
    }
  }
  return merged;
}
