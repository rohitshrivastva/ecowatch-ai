"use client";

import { memo, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import clsx from "clsx";
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
  embedded?: boolean;
  showFavorites?: boolean;
  mapVariant?: "default" | "iqair";
  className?: string;
}

function MapSection({
  onLocationSelect,
  selectedLocation,
  loading,
  detectingLocation,
  heatmap,
  embedded = false,
  showFavorites = true,
  mapVariant = "default",
  className,
}: MapSectionProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 80);
    return () => window.clearTimeout(t);
  }, []);

  const map = mounted ? (
    <InteractiveMap
      onLocationSelect={onLocationSelect}
      selectedLocation={selectedLocation}
      loading={loading}
      detectingLocation={detectingLocation}
      heatmap={heatmap}
      embedded={embedded}
      mapVariant={mapVariant}
      className={className}
    />
  ) : (
    <MapSkeleton />
  );

  if (embedded) {
    return <div className={clsx("h-full", className)}>{map}</div>;
  }

  return (
    <div className="space-y-4 xl:space-y-0">
      <div className="grid xl:grid-cols-[1fr_280px] gap-6">
        {map}
        {showFavorites && (
          <div className="hidden xl:block">
            <FavoritesPanel
              currentSelection={selectedLocation}
              onSelectFavorite={onLocationSelect}
            />
          </div>
        )}
      </div>
      {showFavorites && (
        <div className="xl:hidden overflow-x-auto pb-2 -mx-1 px-1">
          <div className="min-w-[280px]">
            <FavoritesPanel
              currentSelection={selectedLocation}
              onSelectFavorite={onLocationSelect}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(MapSection);
