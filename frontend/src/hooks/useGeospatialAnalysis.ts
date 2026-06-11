"use client";

import { useCallback, useState } from "react";
import { analyzeGeospatialRegion } from "@/lib/geospatial-api";
import type {
  GeospatialAnalysisType,
  GeospatialAnalyzeResponse,
  RegionBounds,
} from "@/types/geospatial";

export function useGeospatialAnalysis() {
  const [result, setResult] = useState<GeospatialAnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(
    async (bounds: RegionBounds, analysisType: GeospatialAnalysisType = "water") => {
      setLoading(true);
      setError(null);
      try {
        const data = await analyzeGeospatialRegion({
          bbox: [bounds.west, bounds.south, bounds.east, bounds.north],
          analysisType,
        });
        setResult(data);
        return data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to analyze region";
        setError(message);
        setResult(null);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, analyze, reset };
}
