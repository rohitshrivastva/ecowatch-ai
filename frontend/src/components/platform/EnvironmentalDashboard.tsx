"use client";

import { MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import LocationSearchBar from "@/components/dashboard/LocationSearchBar";
import EnvironmentalHeroMap from "@/components/platform/dashboard/EnvironmentalHeroMap";
import HealthOverviewPanel from "@/components/platform/dashboard/HealthOverviewPanel";
import BestTimeOutsideHero from "@/components/platform/dashboard/BestTimeOutsideHero";
import EnvironmentalRiskGrid from "@/components/platform/dashboard/EnvironmentalRiskGrid";
import EnvironmentalTrendsPanel from "@/components/platform/dashboard/EnvironmentalTrendsPanel";
import EnvironmentalOutlook from "@/components/platform/dashboard/EnvironmentalOutlook";
import { useEnvironmentalAnalysis } from "@/hooks/useEnvironmentalAnalysis";
import { usePlatformLocation } from "@/hooks/usePlatformLocation";
import {
  deriveBestTimeReasons,
  deriveOutlook,
  deriveRiskCards,
  deriveStatusChips,
  deriveTrendItems,
  healthFromAnalysis,
} from "@/lib/dashboard-intelligence";
import { fetchTrends } from "@/lib/intelligence-api";

export default function EnvironmentalDashboard({
  forceDefaultLocation = false,
}: {
  forceDefaultLocation?: boolean;
}) {
  const { location, setLocation, detecting, hydrated } = usePlatformLocation(
    forceDefaultLocation
  );
  const { analysis, loading, error } = useEnvironmentalAnalysis(location);

  const pending = !hydrated || (loading && !analysis);
  const health = healthFromAnalysis(analysis);

  const trendsQuery = useQuery({
    queryKey: ["dashboard-trends", analysis?.location_id],
    queryFn: () => fetchTrends(analysis!.location_id!, "30d"),
    enabled: !!analysis?.location_id,
    staleTime: 5 * 60_000,
  });

  const chips = analysis ? deriveStatusChips(analysis) : [];
  const riskCards = analysis ? deriveRiskCards(analysis) : [];
  const outlook = analysis ? deriveOutlook(analysis) : null;
  const reasons = analysis ? deriveBestTimeReasons(analysis) : [];
  const trendItems = deriveTrendItems(trendsQuery.data ?? null, analysis);

  return (
    <div className="space-y-6 lg:space-y-7 pb-10">
      {/* §1 Search + hero map */}
      <div className="space-y-3">
        <div className="max-w-xl">
          <LocationSearchBar
            onLocationSelect={setLocation}
            loading={loading}
            detectingLocation={detecting}
          />
          {hydrated && location?.name && !detecting && (
            <p className="flex items-center gap-1.5 text-xs text-eco-muted mt-2 pl-1">
              <MapPin className="w-3.5 h-3.5 text-eco-primary shrink-0" />
              <span>
                Intelligence for{" "}
                <span className="font-medium text-eco-text">{location.name}</span>
              </span>
            </p>
          )}
        </div>
        <EnvironmentalHeroMap
          location={location}
          onLocationSelect={setLocation}
          loading={loading}
          detectingLocation={detecting}
        />
      </div>

      {/* §2 Health overview */}
      <HealthOverviewPanel
        score={health?.score ?? 0}
        category={health?.category ?? "Moderate"}
        chips={chips}
        loading={pending}
        locationName={analysis?.location_name ?? location?.name ?? undefined}
      />

      {/* §3 Best time outside — flagship */}
      <BestTimeOutsideHero
        data={analysis?.best_time_outside}
        reasons={reasons}
        loading={pending}
      />

      {/* §4 Environmental risks */}
      <div>
        <h2 className="text-base font-semibold text-eco-text mb-3">
          Environmental Risks
        </h2>
        <EnvironmentalRiskGrid cards={riskCards} loading={pending} />
      </div>

      {/* §5 Trends */}
      <EnvironmentalTrendsPanel
        items={trendItems}
        loading={pending || trendsQuery.isLoading}
      />

      {/* §6 AI outlook */}
      <EnvironmentalOutlook outlook={outlook} loading={pending} />

      {error && (
        <div className="glass-panel p-4 border-red-200 bg-red-50 text-red-800 text-sm">
          {error}. Ensure the backend is running.
        </div>
      )}
    </div>
  );
}
