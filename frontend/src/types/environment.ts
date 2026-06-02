export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface AirPollutionMetrics {
  aqi: number;
  aqi_label: string;
  pm25: number;
  pm10: number;
  no2: number;
  co: number;
  ozone: number;
}

export interface WeatherMetrics {
  temperature: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  uv_index: number;
  description: string;
}

export interface EnvironmentalIndicators {
  ndvi: number;
  ndvi_label: string;
  urban_heat_index: number;
  green_coverage_pct: number;
  water_proximity_km: number;
}

export interface RiskScore {
  score: number;
  level: string;
  factors: Record<string, number>;
}

export interface Recommendation {
  category: string;
  priority: string;
  title: string;
  description: string;
  actions: string[];
}

export interface EnvironmentalAnalysis {
  location_id?: number | null;
  location: Coordinates;
  location_name?: string;
  air_pollution: AirPollutionMetrics;
  weather: WeatherMetrics;
  environmental: EnvironmentalIndicators;
  risk: RiskScore;
  recommendations: Recommendation[];
  timestamp: string;
}

export interface LocationSelection {
  latitude: number;
  longitude: number;
  name?: string;
  boundary?: {
    type: string;
    coordinates: number[][][];
  };
}
