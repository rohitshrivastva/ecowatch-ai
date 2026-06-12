"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Shield,
  MapPin,
  Loader2,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import clsx from "clsx";
import ClimateRiskPanel from "@/components/solutions/ClimateRiskPanel";
import AIInsightCard from "@/components/platform/AIInsightCard";
import { useEnvironmentalAnalysis } from "@/hooks/useEnvironmentalAnalysis";
import { useGeospatialAnalysis } from "@/hooks/useGeospatialAnalysis";
import { useInitialLocation } from "@/hooks/useInitialLocation";
import { boundsFromLocation } from "@/lib/geo";
import type { LocationSelection } from "@/types/environment";
import type { RegionBounds } from "@/types/geospatial";

const WaterIntelligenceMap = dynamic(
  () => import("@/components/solutions/WaterIntelligenceMap"),
  {
    ssr: false,
    loading: () => (
      <div className="glass-panel rounded-2xl h-full min-h-[360px] flex items-center justify-center text-sm text-eco-muted">
        Loading map…
      </div>
    ),
  }
);

export default function ClimateRiskModule() {
  const { selection, setSelection, detecting: detectingLocation } =
    useInitialLocation();
  const [mapExpanded, setMapExpanded] = useState(true);
  const resultsRef = useRef<HTMLDivElement>(null);
  const hadResultsRef = useRef(false);
  const autoAnalyzedRef = useRef(false);

  const { analysis, loading: analysisLoading, error: analysisError } =
    useEnvironmentalAnalysis(selection);
  const { result, loading: geoLoading, error: geoError, analyze, reset } =
    useGeospatialAnalysis();

  const hasResults = Boolean(analysis?.climate_risk || result);

  useEffect(() => {
    if (hasResults && !hadResultsRef.current && resultsRef.current) {
      hadResultsRef.current = true;
      window.setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 400);
    }
    if (!hasResults) hadResultsRef.current = false;
  }, [hasResults]);

  useEffect(() => {
    if (result && !geoLoading) {
      setMapExpanded(false);
    }
  }, [result, geoLoading]);

  useEffect(() => {
    if (!selection || autoAnalyzedRef.current) return;
    autoAnalyzedRef.current = true;
    void analyze(boundsFromLocation(selection), "climate");
  }, [selection, analyze]);

  const handleRegionSelect = (loc: LocationSelection, bounds: RegionBounds) => {
    autoAnalyzedRef.current = true;
    setSelection(loc);
    setMapExpanded(true);
    reset();
    void analyze(bounds, "climate");
  };

  const locationLabel =
    selection?.name ??
    (selection
      ? `${selection.latitude.toFixed(2)}°, ${selection.longitude.toFixed(2)}°`
      : null);

  const climateInsights = [
    analysis?.climate_risk?.summary,
    ...(analysis?.climate_risk?.insights ?? []),
    ...(result?.climateInsights ?? []),
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-5 lg:space-y-6 pb-8">
      <header className="relative overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50/80 px-5 py-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-violet-600 text-white shadow-sm">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-slate-900">
                  Climate Risk Intelligence
                </h1>
                <p className="text-xs text-slate-600 mt-0.5">
                  Composite risk score · regional overlays · trend analysis
                </p>
              </div>
            </div>
            {!hasResults && (
              <p className="text-sm text-slate-600 mt-4 max-w-xl">
                Select any region to compute a Climate Risk Score (0–100) with
                component breakdown and map overlay.
              </p>
            )}
          </div>
          {locationLabel && (
            <div className="flex items-center gap-2 rounded-xl bg-white/90 border border-violet-100 px-4 py-2.5 text-sm text-slate-800 shadow-sm max-w-md">
              <MapPin className="w-4 h-4 text-violet-600 shrink-0" />
              <span className="truncate">{locationLabel}</span>
              {(analysisLoading || geoLoading) && (
                <Loader2 className="w-4 h-4 text-violet-600 animate-spin shrink-0" />
              )}
            </div>
          )}
        </div>
      </header>

      <div
        className={clsx(
          "transition-[height] duration-500 ease-in-out",
          mapExpanded
            ? "h-[min(420px,55vh)] sm:h-[min(480px,60vh)]"
            : "h-[148px] sm:h-[160px]"
        )}
      >
        <WaterIntelligenceMap
          onRegionSelect={handleRegionSelect}
          loading={geoLoading}
          result={result}
          minimized={!mapExpanded}
          onToggleExpand={() => setMapExpanded((v) => !v)}
          defaultLayers={{
            climateRisk: true,
            waterStress: false,
            ndvi: false,
            ndwi: false,
          }}
          initialLocation={selection}
        />
      </div>

      {detectingLocation && (
        <div className="glass-panel rounded-2xl px-6 py-8 flex flex-col items-center justify-center text-center gap-3">
          <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
          <p className="text-sm font-medium text-slate-800">
            Detecting your location…
          </p>
        </div>
      )}

      {!detectingLocation && !hasResults && selection && (analysisLoading || geoLoading) && (
        <div className="glass-panel rounded-2xl px-6 py-8 flex flex-col items-center justify-center text-center gap-3">
          <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
          <p className="text-sm font-medium text-slate-800">
            Computing climate risk…
          </p>
        </div>
      )}

      {!detectingLocation && !hasResults && !selection && (
        <div className="glass-panel rounded-2xl border border-dashed border-violet-200/60 bg-violet-50/20 px-6 py-10 text-center">
          <MapPin className="w-8 h-8 text-violet-500 mx-auto mb-3 opacity-80" />
          <p className="text-sm font-medium text-slate-700">
            Select a region on the map to begin
          </p>
        </div>
      )}

      {(analysisError || geoError) && (
        <div className="space-y-3">
          {analysisError && (
            <div className="glass-panel p-4 rounded-xl border-red-200 bg-red-50 text-red-800 text-sm">
              {analysisError}
            </div>
          )}
          {geoError && (
            <div className="glass-panel p-4 rounded-xl border-red-200 bg-red-50 text-red-800 text-sm">
              {geoError}
            </div>
          )}
        </div>
      )}

      {hasResults && (
        <div ref={resultsRef} className="space-y-6 scroll-mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/80">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-600" />
              <h2 className="text-lg font-semibold text-slate-900">
                Climate risk analysis
              </h2>
            </div>
            {!mapExpanded && (
              <button
                type="button"
                onClick={() => setMapExpanded(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-700 hover:text-violet-900 px-3 py-1.5 rounded-lg border border-violet-200 bg-violet-50"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                Expand map
              </button>
            )}
          </div>

          {result?.climateRiskScore != null && (
            <div className="rounded-xl border border-violet-200 bg-violet-50/50 px-4 py-3 text-sm text-violet-900">
              <span className="font-semibold">Regional map score: </span>
              {result.climateRiskScore}/100 ({result.climateRiskCategory}) · Trend:{" "}
              {result.climateRiskTrend}
            </div>
          )}

          {analysis?.climate_risk && (
            <ClimateRiskPanel data={analysis.climate_risk} showTitle />
          )}

          {climateInsights.length > 0 && (
            <AIInsightCard insights={climateInsights} title="AI climate summary" />
          )}
        </div>
      )}
    </div>
  );
}
