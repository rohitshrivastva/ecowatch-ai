"use client";

import { memo, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import FavoritesPanel from "@/components/FavoritesPanel";
import { MapSkeleton } from "@/components/ui/Skeleton";
import type { LocationSelection } from "@/types/environment";
import type { HeatmapMapProps } from "@/components/InteractiveMap";

const InteractiveMap = dynamic(() => import("@/components/InteractiveMap"), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

interface MapSectionProps {
  onLocationSelect: (loc: LocationSelection) => void;
  selectedLocation: LocationSelection | null;
  loading: boolean;
  detectingLocation: boolean;
  heatmap: HeatmapMapProps;
}

function MapSection({
  onLocationSelect,
  selectedLocation,
  loading,
  detectingLocation,
  heatmap,
}: MapSectionProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 80);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="space-y-4 xl:space-y-0">
      <div className="grid xl:grid-cols-[1fr_280px] gap-6">
        {mounted ? (
          <InteractiveMap
            onLocationSelect={onLocationSelect}
            selectedLocation={selectedLocation}
            loading={loading}
            detectingLocation={detectingLocation}
            heatmap={heatmap}
          />
        ) : (
          <MapSkeleton />
        )}
        <div className="hidden xl:block">
          <FavoritesPanel
            currentSelection={selectedLocation}
            onSelectFavorite={onLocationSelect}
          />
        </div>
      </div>
      <div className="xl:hidden overflow-x-auto pb-2 -mx-1 px-1">
        <div className="min-w-[280px]">
          <FavoritesPanel
            currentSelection={selectedLocation}
            onSelectFavorite={onLocationSelect}
          />
        </div>
      </div>
    </div>
  );
}

export default memo(MapSection);
