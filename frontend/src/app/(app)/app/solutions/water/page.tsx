"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, Droplets } from "lucide-react";
import WaterAnalysisPanel from "@/components/solutions/WaterAnalysisPanel";
import { useGeospatialAnalysis } from "@/hooks/useGeospatialAnalysis";
import type { RegionBounds } from "@/types/geospatial";

const WaterIntelligenceMap = dynamic(
  () => import("@/components/solutions/WaterIntelligenceMap"),
  { ssr: false, loading: () => (
    <div className="glass-panel rounded-2xl min-h-[480px] flex items-center justify-center text-sm text-eco-muted">
      Loading map…
    </div>
  ) }
);

export default function WaterSolutionsPage() {
  const { result, loading, error, analyze } = useGeospatialAnalysis();

  const handleAnalyze = (bounds: RegionBounds) => {
    void analyze(bounds, "water");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/app/solutions"
            className="inline-flex items-center gap-1.5 text-xs text-eco-muted hover:text-eco-text mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All solutions
          </Link>
          <div className="flex items-center gap-2">
            <Droplets className="w-6 h-6 text-cyan-600" />
            <h1 className="text-2xl font-bold text-eco-text">
              Water Crisis Intelligence
            </h1>
          </div>
          <p className="text-sm text-eco-muted mt-2 max-w-2xl">
            Geospatial engine for real-time water stress analysis. Select any
            region to process NDVI, NDWI, and water crisis overlays from
            satellite-derived imagery.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(300px,380px)_1fr] gap-6 xl:items-start">
        <WaterAnalysisPanel result={result} loading={loading} error={error} />
        <div className="h-[480px] xl:h-[560px]">
          <WaterIntelligenceMap
            onAnalyze={handleAnalyze}
            loading={loading}
            result={result}
          />
        </div>
      </div>
    </div>
  );
}
