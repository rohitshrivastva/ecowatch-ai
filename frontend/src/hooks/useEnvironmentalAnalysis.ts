"use client";

import { useQuery } from "@tanstack/react-query";
import { analyzeLocation } from "@/lib/api";
import type { LocationSelection } from "@/types/environment";

function locationKey(loc: LocationSelection | null): string | null {
  if (!loc) return null;
  const b = loc.boundary ? JSON.stringify(loc.boundary.coordinates) : "";
  return `${loc.latitude.toFixed(5)},${loc.longitude.toFixed(5)}:${b}`;
}

export function useEnvironmentalAnalysis(selection: LocationSelection | null) {
  const key = locationKey(selection);

  const query = useQuery({
    queryKey: ["analysis", key],
    queryFn: () => analyzeLocation(selection!),
    enabled: !!selection && !!key,
    staleTime: 5 * 60_000,
  });

  return {
    analysis: query.data ?? null,
    loading: query.isFetching,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}
