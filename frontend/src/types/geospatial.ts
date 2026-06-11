export type GeospatialAnalysisType = "water" | "ndvi" | "ndwi";

export type GeospatialAnalyzeRequest = {
  bbox: [number, number, number, number];
  analysisType?: GeospatialAnalysisType;
  polygon?: number[][][];
};

export type GeospatialOverlayUrls = {
  ndvi: string;
  ndwi: string;
  waterStress: string;
};

export type GeospatialAnalyzeResponse = {
  overlayUrl: string;
  overlayUrls: GeospatialOverlayUrls;
  ndviScore: number;
  ndwiScore: number;
  waterRisk: string;
  waterCrisisScore: number;
  bounds: [number, number, number, number];
  insights: string[];
  rainfallDeficitPct: number;
  temperatureAnomaly: number;
  cached?: boolean;
};

export type WaterOverlayLayer = "ndvi" | "ndwi" | "waterStress";

export type RegionBounds = {
  west: number;
  south: number;
  east: number;
  north: number;
};
