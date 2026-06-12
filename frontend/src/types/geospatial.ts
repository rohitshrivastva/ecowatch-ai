export type GeospatialAnalysisType = "water" | "ndvi" | "ndwi" | "climate";

export type GeospatialAnalyzeRequest = {
  bbox: [number, number, number, number];
  analysisType?: GeospatialAnalysisType;
  polygon?: number[][][];
};

export type GeospatialOverlayUrls = {
  ndvi: string;
  ndwi: string;
  waterStress: string;
  climateRisk?: string;
};

export type GeospatialAnalyzeResponse = {
  overlayUrl: string;
  overlayUrls: GeospatialOverlayUrls;
  ndviScore: number;
  ndwiScore: number;
  waterRisk: string;
  waterCrisisScore: number;
  climateRiskScore?: number;
  climateRiskCategory?: string;
  climateRiskTrend?: string;
  climateRiskSummary?: string;
  climateRiskComponents?: Array<{
    name: string;
    key: string;
    score: number;
    weight: number;
    contribution: number;
  }>;
  bounds: [number, number, number, number];
  insights: string[];
  climateInsights?: string[];
  rainfallDeficitPct: number;
  temperatureAnomaly: number;
  cached?: boolean;
};

export type WaterOverlayLayer = "ndvi" | "ndwi" | "waterStress" | "climateRisk";

export type RegionBounds = {
  west: number;
  south: number;
  east: number;
  north: number;
};
