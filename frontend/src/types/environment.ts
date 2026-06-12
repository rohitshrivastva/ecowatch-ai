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

export interface ForecastTimelineSlot {
  label: string;
  pop_pct: number;
  kind: "best" | "good" | "moderate" | "poor" | "avoid";
}

export interface BestTimeOutside {
  time_window: string;
  environmental_status: string;
  why: string;
  suggestions: string[];
  suggested_activities: string[];
  avoid_windows: string[];
  timeline?: ForecastTimelineSlot[];
  rain_probability_pct: number | null;
  wind_speed?: number | null;
  show_umbrella: boolean;
  thunderstorm_alert: boolean;
  local_time?: string | null;
  timezone_offset_seconds?: number | null;
  timezone_label?: string | null;
}

export interface ClimateAnomaly {
  metric: string;
  severity: string;
  message: string;
}

export interface DroughtForecast {
  outlook: string;
  horizon_hours: number;
  summary: string;
  severity?: string;
  confidence?: string;
  precipitation_trend?: string;
  soil_moisture_outlook?: string;
}

export interface RainfallAnomalyAnalysis {
  status: string;
  anomaly_pct: number;
  severity: string;
  trend: string;
  vs_typical_pct: number;
  forecast_rain_mm: number;
  summary: string;
}

export interface ReservoirChangeDetection {
  direction: string;
  change_pct: number;
  storage_level_pct: number;
  severity: string;
  summary: string;
  alert: string;
}

export interface GroundwaterStressIndicator {
  name: string;
  value: string;
  status: "good" | "moderate" | "warning" | "critical";
}

export interface GroundwaterStressIndicators {
  stress_level: string;
  stress_score: number;
  recharge_outlook: string;
  summary: string;
  indicators: GroundwaterStressIndicator[];
}

export interface WaterCrisisIndicator {
  name: string;
  value: string;
  status: "good" | "moderate" | "warning" | "critical";
}

export interface WaterCrisisIntelligence {
  stress_level: string;
  drought_risk: string;
  rainfall_status: string;
  rainfall_deficit_pct?: number | null;
  summary: string;
  why: string;
  indicators: WaterCrisisIndicator[];
  recommendations: string[];
  drought_forecast?: DroughtForecast;
  environmental_risk_score?: number;
  climate_risk_level?: string;
  climate_anomalies?: ClimateAnomaly[];
  environmental_summary?: string;
  degradation_signals?: string[];
  sustainability_insights?: string[];
  global_stress_context?: string;
  rainfall_anomaly?: RainfallAnomalyAnalysis | null;
  reservoir_change?: ReservoirChangeDetection | null;
  groundwater_stress?: GroundwaterStressIndicators | null;
}

export interface ClimateRiskComponent {
  name: string;
  key: string;
  score: number;
  weight: number;
  contribution: number;
}

export interface ClimateRiskHistorical {
  current_year: number;
  last_year: number;
  five_year_avg: number;
  ten_year_avg: number;
  change_3yr: number;
}

export interface ClimateRiskIntelligence {
  score: number;
  category: string;
  trend: string;
  trend_change_3yr: number;
  summary: string;
  outdoor_safety: string;
  outdoor_safety_score: number;
  components: ClimateRiskComponent[];
  historical: ClimateRiskHistorical;
  insights: string[];
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
  best_time_outside?: BestTimeOutside | null;
  water_crisis?: WaterCrisisIntelligence | null;
  climate_risk?: ClimateRiskIntelligence | null;
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
