import L from "leaflet";
import type { PathOptions } from "leaflet";

export type GisBasemapId = "topo" | "satellite" | "hybrid" | "terrain" | "streets";

export type GisTileLayerConfig = {
  id: string;
  url: string;
  attribution: string;
  opacity?: number;
  maxZoom?: number;
};

export type GisBasemapConfig = {
  id: GisBasemapId;
  label: string;
  icon: string;
  layers: GisTileLayerConfig[];
};

export const GIS_BASEMAPS: Record<GisBasemapId, GisBasemapConfig> = {
  topo: {
    id: "topo",
    label: "Topo",
    icon: "⛰",
    layers: [
      {
        id: "opentopo",
        url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        attribution:
          '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> (&copy; OSM)',
        maxZoom: 17,
      },
    ],
  },
  satellite: {
    id: "satellite",
    label: "Satellite",
    icon: "🛰",
    layers: [
      {
        id: "esri-imagery",
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: "&copy; Esri, Maxar, Earthstar Geographics",
        maxZoom: 19,
      },
    ],
  },
  hybrid: {
    id: "hybrid",
    label: "Hybrid",
    icon: "🌍",
    layers: [
      {
        id: "esri-imagery",
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: "&copy; Esri, Maxar",
        maxZoom: 19,
      },
      {
        id: "esri-labels",
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        attribution: "&copy; Esri",
        opacity: 0.85,
        maxZoom: 19,
      },
    ],
  },
  terrain: {
    id: "terrain",
    label: "Terrain",
    icon: "🏔",
    layers: [
      {
        id: "carto-voyager",
        url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OSM',
        maxZoom: 20,
      },
      {
        id: "esri-hillshade",
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}",
        attribution: "&copy; Esri",
        opacity: 0.35,
        maxZoom: 16,
      },
    ],
  },
  streets: {
    id: "streets",
    label: "Streets",
    icon: "🗺",
    layers: [
      {
        id: "carto-voyager",
        url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OSM',
        maxZoom: 20,
      },
    ],
  },
};

export const GIS_REGION_STYLE: PathOptions = {
  color: "#0891b2",
  weight: 2.5,
  opacity: 0.9,
  dashArray: "10 6",
  lineCap: "round",
  lineJoin: "round",
  fillColor: "#06b6d4",
  fillOpacity: 0.14,
};

export const GIS_REGION_DRAW_STYLE: PathOptions = {
  ...GIS_REGION_STYLE,
  color: "#d97706",
  fillColor: "#f59e0b",
  fillOpacity: 0.18,
  weight: 2,
  dashArray: "4 8",
};

export const GIS_ANALYSIS_BOUNDS_STYLE: PathOptions = {
  color: "#7c3aed",
  weight: 2,
  opacity: 0.75,
  dashArray: "6 4",
  fillColor: "#8b5cf6",
  fillOpacity: 0.06,
};

export function createGisMarkerIcon(
  variant: "primary" | "corner" | "eco" = "primary"
): L.DivIcon {
  const color =
    variant === "corner"
      ? "#d97706"
      : variant === "eco"
        ? "#10b981"
        : "#0891b2";
  return L.divIcon({
    className: "gis-marker-wrapper",
    html: `<div class="gis-marker-pin" style="--pin-color:${color}"><span class="gis-marker-pulse"></span><span class="gis-marker-core"></span></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 32],
  });
}

export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? "N" : "S";
  const lngDir = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
}
