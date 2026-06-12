"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import type { LatLng, LatLngBounds } from "leaflet";
import {
  MapContainer,
  Marker,
  useMapEvents,
  useMap,
  Rectangle,
} from "react-leaflet";
import { Search, MapPin, Square } from "lucide-react";
import clsx from "clsx";
import GisMapLayers from "@/components/map/GisMapLayers";
import {
  GisBasemapSwitcher,
  GisCoordinateReadout,
  GisScaleControl,
} from "@/components/map/GisMapEnhancements";
import {
  createGisMarkerIcon,
  GIS_REGION_STYLE,
  type GisBasemapId,
} from "@/lib/gis-map";
import type { LocationSelection } from "@/types/environment";
import type { HeatmapBounds, HeatmapPoint, HeatmapType } from "@/types/intelligence";
import HeatmapLayer from "@/components/HeatmapLayer";
import HeatmapControls from "@/components/heatmap/HeatmapControls";
import HeatmapLegend from "@/components/heatmap/HeatmapLegend";
import HeatmapTooltip from "@/components/heatmap/HeatmapTooltip";
import HeatmapDebugPanel from "@/components/heatmap/HeatmapDebugPanel";

const defaultCenter: [number, number] = [28.6139, 77.209];

function MapClickHandler({
  onSelect,
}: {
  onSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapController({
  center,
  zoom = 11,
}: {
  center: [number, number];
  zoom?: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, map, zoom]);
  return null;
}

function MapBoundsWatcher({
  onBoundsChange,
}: {
  onBoundsChange: (bounds: HeatmapBounds) => void;
}) {
  const map = useMap();
  useEffect(() => {
    const emit = () => {
      const b = map.getBounds();
      onBoundsChange({
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
        zoom: map.getZoom(),
      });
    };
    map.on("moveend", emit);
    map.on("zoomend", emit);
    emit();
    return () => {
      map.off("moveend", emit);
      map.off("zoomend", emit);
    };
  }, [map, onBoundsChange]);
  return null;
}

function HeatmapCleanup({ enabled }: { enabled: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (enabled) return;
    map.eachLayer((layer) => {
      const canvas = (layer as L.Layer & { _canvas?: HTMLCanvasElement })._canvas;
      if (canvas?.classList.contains("leaflet-heatmap-layer")) {
        map.removeLayer(layer);
      }
    });
  }, [map, enabled]);
  return null;
}

function MapInvalidateOnMount() {
  const map = useMap();
  useEffect(() => {
    const refresh = () => map.invalidateSize();
    refresh();
    const raf = requestAnimationFrame(refresh);
    const timer = window.setTimeout(refresh, 150);
    const container = map.getContainer();
    const observer =
      typeof ResizeObserver !== "undefined" && container
        ? new ResizeObserver(refresh)
        : null;
    observer?.observe(container);
    window.addEventListener("resize", refresh);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      observer?.disconnect();
      window.removeEventListener("resize", refresh);
    };
  }, [map]);
  return null;
}

export interface HeatmapMapProps {
  enabled: boolean;
  type: HeatmapType;
  points: HeatmapPoint[];
  renderPoints: HeatmapPoint[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  viewportZoom: number;
  lastBounds: HeatmapBounds | null;
  debugMode: boolean;
  onToggleDebug: () => void;
  onToggle: (enabled: boolean) => void;
  onTypeChange: (type: HeatmapType) => void;
  onBoundsChange: (bounds: HeatmapBounds) => void;
}

interface InteractiveMapProps {
  onLocationSelect: (selection: LocationSelection) => void;
  selectedLocation?: LocationSelection | null;
  loading?: boolean;
  detectingLocation?: boolean;
  heatmap: HeatmapMapProps;
  /** Map-only layout without top search toolbar (search lives in dashboard). */
  embedded?: boolean;
  /** IQAir-style dark map with minimal chrome. */
  mapVariant?: "default" | "iqair";
  className?: string;
}

export default function InteractiveMap({
  onLocationSelect,
  selectedLocation,
  loading,
  detectingLocation,
  heatmap,
  embedded = false,
  mapVariant = "default",
  className,
}: InteractiveMapProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [drawMode, setDrawMode] = useState(false);
  const [drawStart, setDrawStart] = useState<LatLng | null>(null);
  const [drawBounds, setDrawBounds] = useState<LatLngBounds | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(defaultCenter);
  const isIqair = mapVariant === "iqair";
  const [basemap, setBasemap] = useState<GisBasemapId>(isIqair ? "hybrid" : "terrain");
  const searchTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (selectedLocation) {
      setMapCenter([selectedLocation.latitude, selectedLocation.longitude]);
    }
  }, [selectedLocation]);

  const handleSelect = useCallback(
    (lat: number, lng: number, name?: string) => {
      setMapCenter([lat, lng]);
      onLocationSelect({ latitude: lat, longitude: lng, name });
    },
    [onLocationSelect]
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(async () => {
      if (query.length < 2) return;
      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
        );
        const results = await resp.json();
        if (results.length > 0) {
          const { lat, lon, display_name } = results[0];
          handleSelect(parseFloat(lat), parseFloat(lon), display_name);
        }
      } catch {
        /* geocoding unavailable */
      }
    }, 500);
  };

  const handleDrawClick = (lat: number, lng: number) => {
    if (!drawMode) return;
    const point = L.latLng(lat, lng);
    if (!drawStart) {
      setDrawStart(point);
    } else {
      const bounds = L.latLngBounds(drawStart, point);
      setDrawBounds(bounds);
      const center = bounds.getCenter();
      const boundary = {
        type: "Polygon",
        coordinates: [[
          [bounds.getWest(), bounds.getSouth()],
          [bounds.getEast(), bounds.getSouth()],
          [bounds.getEast(), bounds.getNorth()],
          [bounds.getWest(), bounds.getNorth()],
          [bounds.getWest(), bounds.getSouth()],
        ]],
      };
      handleSelect(center.lat, center.lng);
      onLocationSelect({
        latitude: center.lat,
        longitude: center.lng,
        boundary,
      });
      setDrawStart(null);
      setDrawMode(false);
    }
  };

  const markerIcon = createGisMarkerIcon(isIqair ? "eco" : "primary");

  return (
    <div
      className={clsx(
        embedded &&
          (isIqair
            ? "h-full rounded-2xl overflow-hidden shadow-lg ring-1 ring-slate-200/80 iqair-map"
            : "h-[320px] lg:h-[480px] glass-panel overflow-hidden"),
        !embedded && "glass-panel overflow-hidden",
        className
      )}
    >
      {!embedded && (
        <div className="p-4 border-b border-eco-border flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-eco-muted" />
            <input
              type="text"
              placeholder="Search city or location..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-eco-border rounded-lg text-sm text-eco-text placeholder:text-eco-muted focus:outline-none focus:border-eco-primary/50 shadow-sm"
            />
          </div>
          <button
            onClick={() => {
              setDrawMode(!drawMode);
              setDrawStart(null);
              setDrawBounds(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              drawMode
                ? "bg-eco-primary text-white"
                : "bg-eco-surface-hover text-eco-muted hover:text-eco-text"
            }`}
          >
            <Square className="w-4 h-4" />
            {drawMode ? "Click corners to draw" : "Draw Area"}
          </button>
          {(detectingLocation || loading) && (
            <span className="text-sm text-eco-primary animate-pulse">
              {detectingLocation ? "Finding your area..." : "Analyzing..."}
            </span>
          )}
        </div>
      )}

      <div
        className={clsx(
          "relative w-full",
          embedded
            ? isIqair
              ? "h-full gis-map-vignette"
              : "h-[320px] lg:h-[480px]"
            : "h-[320px] sm:h-[400px] lg:h-[480px]",
          isIqair && "gis-map-vignette"
        )}
      >
        <MapContainer
          center={defaultCenter}
          zoom={5}
          className={clsx("h-full w-full z-0", isIqair && "gis-map")}
          zoomControl={isIqair}
        >
          <GisMapLayers basemap={basemap} />
          <MapController center={mapCenter} zoom={selectedLocation ? 10 : 5} />
          <MapInvalidateOnMount />
          <GisScaleControl />
          {isIqair && <GisCoordinateReadout />}
          <HeatmapCleanup enabled={heatmap.enabled} />
          <MapBoundsWatcher onBoundsChange={heatmap.onBoundsChange} />
          {heatmap.enabled && heatmap.renderPoints.length > 0 && (
            <HeatmapLayer
              points={heatmap.renderPoints}
              visible={heatmap.enabled}
              heatmapType={heatmap.type}
              zoom={heatmap.viewportZoom}
              vivid={isIqair}
            />
          )}
          <HeatmapTooltip
            points={heatmap.renderPoints}
            heatmapType={heatmap.type}
            enabled={heatmap.enabled}
          />
          <MapClickHandler
            onSelect={(lat, lng) =>
              drawMode ? handleDrawClick(lat, lng) : handleSelect(lat, lng)
            }
          />
          {selectedLocation && (
            <Marker
              position={[selectedLocation.latitude, selectedLocation.longitude]}
              icon={markerIcon}
            />
          )}
          {drawBounds && (
            <Rectangle bounds={drawBounds} pathOptions={GIS_REGION_STYLE} />
          )}
        </MapContainer>

        {isIqair && (
          <div className="absolute top-3 left-3 z-[1000]">
            <GisBasemapSwitcher value={basemap} onChange={setBasemap} />
          </div>
        )}

        {heatmap.loading && heatmap.enabled && (
          <div className="absolute inset-0 z-[999] bg-white/50 flex items-center justify-center pointer-events-none">
            <span className="text-sm text-eco-primary animate-pulse">
              Loading heatmap…
            </span>
          </div>
        )}

        <div
          className={clsx(
            "absolute z-[1000] flex flex-wrap gap-2 pointer-events-none",
            isIqair
              ? "hidden"
              : "left-3 right-3 top-3 sm:items-start"
          )}
        >
          {embedded && !isIqair && (
            <div className="pointer-events-auto">
              <button
                type="button"
                onClick={() => {
                  setDrawMode(!drawMode);
                  setDrawStart(null);
                  setDrawBounds(null);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors shadow-sm ${
                  drawMode
                    ? "bg-eco-primary text-white"
                    : "bg-white border border-eco-border text-eco-muted hover:text-eco-text"
                }`}
              >
                <Square className="w-3.5 h-3.5" />
                {drawMode ? "Draw corners" : "Draw area"}
              </button>
            </div>
          )}
          {!isIqair && (
            <div className="pointer-events-auto w-full sm:w-auto sm:ml-auto flex flex-col gap-2 sm:items-end">
              <HeatmapControls
                enabled={heatmap.enabled}
                type={heatmap.type}
                loading={heatmap.loading}
                onToggle={heatmap.onToggle}
                onTypeChange={heatmap.onTypeChange}
              />
              {heatmap.enabled && (
                <div className="hidden sm:block">
                  <HeatmapLegend
                    type={heatmap.type}
                    lastUpdated={heatmap.lastUpdated}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {isIqair && (
          <>
            <div className="absolute top-3 right-3 z-[1000] rounded-lg bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-slate-100 shadow-md pointer-events-none border border-slate-700/50">
              EcoWatch GIS
            </div>
            <div className="absolute bottom-3 right-14 z-[1000] pointer-events-auto">
              <button
                type="button"
                onClick={() => {
                  if (!heatmap.enabled) heatmap.onTypeChange("aqi");
                  heatmap.onToggle(!heatmap.enabled);
                }}
                className={clsx(
                  "rounded-lg px-3 py-2 text-xs font-medium shadow-md border transition-colors",
                  heatmap.enabled
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-slate-700 border-slate-200 hover:border-emerald-400"
                )}
              >
                {heatmap.enabled ? "Hide AQI layer" : "Show AQI layer"}
              </button>
            </div>
            {heatmap.enabled && (
              <div className="absolute bottom-14 left-3 z-[1000] rounded-lg bg-white/95 backdrop-blur-sm px-3 py-2 shadow-md pointer-events-none">
                <p className="text-[10px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Air quality
                </p>
                <div className="flex h-2 w-36 rounded-full overflow-hidden">
                  <span className="flex-1 bg-emerald-500" />
                  <span className="flex-1 bg-lime-400" />
                  <span className="flex-1 bg-amber-400" />
                  <span className="flex-1 bg-orange-500" />
                  <span className="flex-1 bg-red-500" />
                </div>
                <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                  <span>Good</span>
                  <span>Hazardous</span>
                </div>
              </div>
            )}
          </>
        )}

        {heatmap.error && heatmap.enabled && (
          <div className="absolute top-3 left-3 z-[1000] glass-panel px-3 py-2 text-xs text-eco-danger max-w-[220px]">
            {heatmap.error}
          </div>
        )}

        {!isIqair && (
          <HeatmapDebugPanel
            enabled={heatmap.enabled}
            type={heatmap.type}
            apiPointCount={heatmap.points.length}
            renderPointCount={heatmap.renderPoints.length}
            zoom={heatmap.viewportZoom}
            bounds={heatmap.lastBounds}
            points={heatmap.renderPoints}
            debugMode={heatmap.debugMode}
            onToggleDebug={heatmap.onToggleDebug}
          />
        )}

        {!isIqair && (
          <div className="absolute bottom-4 left-4 glass-panel px-3 py-2 text-xs text-eco-muted z-[1000]">
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3 text-eco-primary" />
              Click map to select • Search or draw an area
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
