import type { HeatmapType } from "@/types/intelligence";

/** GIS layer ids — UI-facing; maps to heatmap backend types where available. */
export type EnvironmentalGisLayerId =
  | "aqi"
  | "rainfall"
  | "water-stress"
  | "climate-risk"
  | "vegetation";

export type EnvironmentalGisLayer = {
  id: EnvironmentalGisLayerId;
  label: string;
  /** Backend heatmap type when live data exists */
  heatmapType?: HeatmapType;
  /** Placeholder until dedicated rainfall / satellite overlays ship */
  mock?: boolean;
  description: string;
};

export const ENVIRONMENTAL_GIS_LAYERS: EnvironmentalGisLayer[] = [
  {
    id: "aqi",
    label: "AQI",
    heatmapType: "aqi",
    description: "Air quality index overlay",
  },
  {
    id: "rainfall",
    label: "Rainfall",
    heatmapType: "temperature",
    mock: true,
    description: "Precipitation patterns (preview layer)",
  },
  {
    id: "water-stress",
    label: "Water Stress",
    heatmapType: "water-stress",
    description: "Regional water availability stress",
  },
  {
    id: "climate-risk",
    label: "Climate Risk",
    heatmapType: "environmental-risk",
    description: "Composite climate risk score",
  },
  {
    id: "vegetation",
    label: "Vegetation Health",
    heatmapType: "vegetation",
    description: "NDVI vegetation health (preview)",
  },
];

export function gisLayerToHeatmap(id: EnvironmentalGisLayerId): HeatmapType {
  const layer = ENVIRONMENTAL_GIS_LAYERS.find((l) => l.id === id);
  return layer?.heatmapType ?? "aqi";
}

export function isMockGisLayer(id: EnvironmentalGisLayerId): boolean {
  return ENVIRONMENTAL_GIS_LAYERS.find((l) => l.id === id)?.mock ?? false;
}
