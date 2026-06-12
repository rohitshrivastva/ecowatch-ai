"use client";

import { TileLayer } from "react-leaflet";
import { GIS_BASEMAPS, type GisBasemapId } from "@/lib/gis-map";

export default function GisMapLayers({ basemap }: { basemap: GisBasemapId }) {
  const config = GIS_BASEMAPS[basemap];

  return (
    <>
      {config.layers.map((layer, index) => (
        <TileLayer
          key={`${basemap}-${layer.id}`}
          url={layer.url}
          attribution={layer.attribution}
          opacity={layer.opacity ?? 1}
          maxZoom={layer.maxZoom ?? 19}
          zIndex={index}
        />
      ))}
    </>
  );
}
