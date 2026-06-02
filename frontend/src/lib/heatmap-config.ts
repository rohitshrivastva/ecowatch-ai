import type { HeatmapType } from "@/types/intelligence";

export type HeatGradient = Record<number, string>;

export const HEATMAP_GRADIENTS: Record<HeatmapType, HeatGradient> = {
  aqi: {
    0.0: "#10b981",
    0.35: "#84cc16",
    0.55: "#f59e0b",
    0.75: "#f97316",
    1.0: "#ef4444",
  },
  temperature: {
    0.0: "#3b82f6",
    0.4: "#06b6d4",
    0.65: "#f59e0b",
    1.0: "#ef4444",
  },
  vegetation: {
    0.0: "#78350f",
    0.35: "#a3a334",
    0.65: "#4ade80",
    1.0: "#14532d",
  },
  "environmental-risk": {
    0.0: "#10b981",
    0.3: "#84cc16",
    0.5: "#f59e0b",
    0.7: "#f97316",
    0.85: "#ef4444",
    1.0: "#a855f7",
  },
};

export const HEATMAP_LEGENDS: Record<
  HeatmapType,
  { low: string; high: string; title: string }
> = {
  aqi: { low: "Healthy", high: "Hazardous", title: "Air Quality" },
  temperature: { low: "Cool", high: "Hot", title: "Temperature" },
  vegetation: { low: "Sparse", high: "Dense", title: "Vegetation (NDVI)" },
  "environmental-risk": {
    low: "Low risk",
    high: "Critical",
    title: "Environmental Risk",
  },
};

export const HEATMAP_LAYER_OPTIONS: {
  id: HeatmapType;
  label: string;
}[] = [
  { id: "aqi", label: "AQI" },
  { id: "temperature", label: "Temperature" },
  { id: "vegetation", label: "Vegetation" },
  { id: "environmental-risk", label: "Risk" },
];

export function getHeatOptions(zoom: number) {
  const scale = Math.max(0.85, Math.min(1.35, zoom / 11));
  return {
    radius: Math.round(35 * scale),
    blur: Math.round(30 * scale),
    maxZoom: 17,
    minOpacity: 0.45,
  };
}

export function clampIntensity(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}
