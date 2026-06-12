"use client";

import { Wind } from "lucide-react";
import ModuleShell from "@/components/platform/ModuleShell";
import PlatformMap from "@/components/platform/PlatformMap";
import AirQualityPanel from "@/components/dashboard/AirQualityPanel";
import AdvancedAnalytics from "@/components/dashboard/AdvancedAnalytics";
import TrendsSection from "@/components/dashboard/TrendsSection";
import AIInsightCard from "@/components/platform/AIInsightCard";
import InsightPanel from "@/components/platform/InsightPanel";
import { useEnvironmentalAnalysis } from "@/hooks/useEnvironmentalAnalysis";
import { usePlatformLocation } from "@/hooks/usePlatformLocation";

export default function AirQualityPage() {
  const { location, setLocation, detecting } = usePlatformLocation();
  const { analysis, loading, error } = useEnvironmentalAnalysis(location);

  const recInsights =
    analysis?.recommendations
      ?.filter((r) => r.category.toLowerCase().includes("air"))
      .map((r) => r.description)
      .slice(0, 3) ?? [];

  return (
    <ModuleShell
      title="Air Quality Intelligence"
      description="AQI maps, pollutant breakdown, historical trends, and health recommendations."
      accent="border-sky-100 bg-gradient-to-br from-sky-50 via-white to-white"
      location={location}
      onLocationSelect={setLocation}
      detectingLocation={detecting}
      loading={loading}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AirQualityPanel
          analysis={analysis}
          loading={loading && !analysis}
          locationName={analysis?.location_name ?? location?.name ?? null}
        />
        <PlatformMap
          location={location}
          onLocationSelect={setLocation}
          loading={loading}
          detectingLocation={detecting}
          defaultLayer="aqi"
        />
      </div>

      {analysis && (
        <>
          <AdvancedAnalytics analysis={analysis} />
          {recInsights.length > 0 && (
            <AIInsightCard insights={recInsights} title="Health recommendations" />
          )}
          <InsightPanel
            icon={Wind}
            title="Historical trends"
            description="AQI and pollutant patterns over time"
          >
            <TrendsSection locationId={analysis.location_id} enabled />
          </InsightPanel>
        </>
      )}

      {error && (
        <div className="glass-panel p-4 text-red-800 bg-red-50 text-sm">{error}</div>
      )}
    </ModuleShell>
  );
}
