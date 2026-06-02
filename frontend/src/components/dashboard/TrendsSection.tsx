"use client";

import { memo } from "react";
import dynamic from "next/dynamic";
import { ChartSkeleton } from "@/components/ui/Skeleton";

const HistoricalTrendsPanel = dynamic(
  () => import("@/components/HistoricalTrendsPanel"),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

function TrendsSection({
  locationId,
  enabled,
}: {
  locationId?: number | null;
  enabled: boolean;
}) {
  if (!enabled || locationId == null) return null;
  return <HistoricalTrendsPanel locationId={locationId} />;
}

export default memo(TrendsSection);
