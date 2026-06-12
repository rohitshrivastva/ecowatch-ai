"use client";

import { useQuery } from "@tanstack/react-query";
import { analyzeLocation } from "@/lib/api";
import type { EnvironmentalAnalysis, LocationSelection } from "@/types/environment";

function locationKey(loc: LocationSelection | null): string | null {
  if (!loc) return null;
  const b = loc.boundary ? JSON.stringify(loc.boundary.coordinates) : "";
  return `${loc.latitude.toFixed(5)},${loc.longitude.toFixed(5)}:${b}`;
}

function coordsMatch(
  analysis: EnvironmentalAnalysis,
  loc: LocationSelection
): boolean {
  return (
    Math.abs(analysis.location.latitude - loc.latitude) < 0.02 &&
    Math.abs(analysis.location.longitude - loc.longitude) < 0.02
  );
}

export function useEnvironmentalAnalysis(selection: LocationSelection | null) {
  const key = locationKey(selection);

  const query = useQuery({
    queryKey: ["analysis", key],
    queryFn: ({ signal }) => analyzeLocation(selection!, signal),
    enabled: !!selection && !!key,
    staleTime: 5 * 60_000,
  });

  const analysis =
    query.data && selection && coordsMatch(query.data, selection)
      ? query.data
      : null;

  const loading =
    !!selection && (query.isPending || query.isFetching || !analysis);

  return {
    analysis,
    loading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}
