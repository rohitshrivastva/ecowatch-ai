export type HistoryPeriod = "24h" | "7d" | "30d" | "1y";

export type TrendMetric = {
  metric: string;
  current: number;
  previous: number;
  change_pct: number;
  anomaly?: string | null;
};

export type TrendsResponse = {
  location_id: number;
  period: string;
  metrics: TrendMetric[];
  series: Record<string, { t: string; v: number }[]>;
};

export type FavoriteLocation = {
  id: number;
  location_name: string;
  latitude: number;
  longitude: number;
  location_id?: number | null;
  created_at: string;
  summary?: {
    aqi?: number;
    temperature?: number;
    risk_score?: number;
    risk_level?: string;
  } | null;
};

export type HeatmapType =
  | "aqi"
  | "temperature"
  | "vegetation"
  | "environmental-risk";

export type HeatmapPoint = {
  lat: number;
  lng: number;
  intensity: number;
};

export type HeatmapResponse = {
  type: string;
  points: HeatmapPoint[];
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
};
