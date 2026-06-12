"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import type { LatLngBounds } from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Rectangle,
  ImageOverlay,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { Search, Square, MapPin, Maximize2, Minimize2 } from "lucide-react";
import clsx from "clsx";
import { resolveOverlayUrl } from "@/lib/geospatial-api";
import WaterOverlayControls from "@/components/solutions/WaterOverlayControls";
import type { LocationSelection } from "@/types/environment";
import type {
  GeospatialAnalyzeResponse,
  RegionBounds,
  WaterOverlayLayer,
} from "@/types/geospatial";

const defaultCenter: [number, number] = [28.6139, 77.209];

function MapController({
  center,
  zoom = 10,
}: {
  center: [number, number];
  zoom?: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1 });
  }, [center, map, zoom]);
  return null;
}

function MapInvalidateOnMount({ minimized }: { minimized?: boolean }) {
  const map = useMap();
  useEffect(() => {
    const refresh = () => map.invalidateSize();
    refresh();
    const timer = window.setTimeout(refresh, 150);
    const timer2 = window.setTimeout(refresh, 550);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(timer2);
    };
  }, [map, minimized]);
  return null;
}

interface WaterIntelligenceMapProps {
  onRegionSelect?: (selection: LocationSelection, bounds: RegionBounds) => void;
  loading: boolean;
  result: GeospatialAnalyzeResponse | null;
  minimized?: boolean;
  onToggleExpand?: () => void;
  defaultLayers?: Partial<Record<WaterOverlayLayer, boolean>>;
  initialLocation?: LocationSelection | null;
}

function toRegionBounds(bounds: LatLngBounds): RegionBounds {
  return {
    west: bounds.getWest(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    north: bounds.getNorth(),
  };
}

export default function WaterIntelligenceMap({
  onRegionSelect,
  loading,
  result,
  minimized = false,
  onToggleExpand,
  defaultLayers,
  initialLocation,
}: WaterIntelligenceMapProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [mapCenter, setMapCenter] = useState<[number, number]>(defaultCenter);
  const [drawMode, setDrawMode] = useState(false);
  const [drawStart, setDrawStart] = useState<L.LatLng | null>(null);
  const [regionBounds, setRegionBounds] = useState<LatLngBounds | null>(null);
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(null);
  const [layers, setLayers] = useState<Record<WaterOverlayLayer, boolean>>({
    ndvi: defaultLayers?.ndvi ?? true,
    ndwi: defaultLayers?.ndwi ?? true,
    waterStress: defaultLayers?.waterStress ?? true,
    climateRisk: defaultLayers?.climateRisk ?? false,
  });
  const [opacity, setOpacity] = useState(0.65);
  const searchTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!initialLocation) return;
    const { latitude, longitude } = initialLocation;
    const pad = 0.06;
    const bounds = L.latLngBounds(
      [latitude - pad, longitude - pad],
      [latitude + pad, longitude + pad]
    );
    setMapCenter([latitude, longitude]);
    setMarkerPos([latitude, longitude]);
    setRegionBounds(bounds);
  }, [
    initialLocation?.latitude,
    initialLocation?.longitude,
    initialLocation?.name,
  ]);

  const notifyRegion = useCallback(
    (selection: LocationSelection, bounds: LatLngBounds) => {
      onRegionSelect?.(selection, toRegionBounds(bounds));
    },
    [onRegionSelect]
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
          const latitude = parseFloat(lat);
          const longitude = parseFloat(lon);
          setMapCenter([latitude, longitude]);
          setMarkerPos([latitude, longitude]);
          const pad = 0.08;
          const bounds = L.latLngBounds(
            [latitude - pad, longitude - pad],
            [latitude + pad, longitude + pad]
          );
          setRegionBounds(bounds);
          notifyRegion(
            {
              latitude,
              longitude,
              name: display_name,
            },
            bounds
          );
        }
      } catch {
        /* geocoding unavailable */
      }
    }, 500);
  };

  const handleDrawPoint = useCallback((lat: number, lng: number) => {
    const point = L.latLng(lat, lng);
    if (!drawStart) {
      setDrawStart(point);
      return;
    }
    const bounds = L.latLngBounds(drawStart, point);
    setRegionBounds(bounds);
    const center = bounds.getCenter();
    setMarkerPos([center.lat, center.lng]);
    setMapCenter([center.lat, center.lng]);
    setDrawStart(null);
    setDrawMode(false);
    notifyRegion(
      {
        latitude: center.lat,
        longitude: center.lng,
        boundary: {
          type: "Polygon",
          coordinates: [[
            [bounds.getWest(), bounds.getSouth()],
            [bounds.getEast(), bounds.getSouth()],
            [bounds.getEast(), bounds.getNorth()],
            [bounds.getWest(), bounds.getNorth()],
            [bounds.getWest(), bounds.getSouth()],
          ]],
        },
      },
      bounds
    );
  }, [drawStart, notifyRegion]);

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (drawMode) {
        handleDrawPoint(lat, lng);
        return;
      }
      setMarkerPos([lat, lng]);
      setMapCenter([lat, lng]);
      const pad = 0.06;
      const bounds = L.latLngBounds(
        [lat - pad, lng - pad],
        [lat + pad, lng + pad]
      );
      setRegionBounds(bounds);
      notifyRegion({ latitude: lat, longitude: lng }, bounds);
    },
    [drawMode, handleDrawPoint, notifyRegion]
  );

  const toggleLayer = (layer: WaterOverlayLayer) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  const overlayBounds: [[number, number], [number, number]] | null = result
    ? [
        [result.bounds[1], result.bounds[0]],
        [result.bounds[3], result.bounds[2]],
      ]
    : null;

  const markerIcon = L.divIcon({
    className: "custom-marker",
    html: `<div style="width:20px;height:20px;background:#0891b2;border:2px solid white;border-radius:50%;box-shadow:0 0 10px rgba(8,145,178,0.5)"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  return (
    <div className="glass-panel overflow-hidden rounded-2xl flex flex-col h-full min-h-0 shadow-sm ring-1 ring-cyan-100/80">
      <div
        className={clsx(
          "border-b border-eco-border flex flex-wrap gap-2 items-center bg-white/80",
          minimized ? "p-2" : "p-4"
        )}
      >
        {!minimized && (
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-eco-muted" />
            <input
              type="text"
              placeholder="Search location…"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-eco-border rounded-lg text-sm"
            />
          </div>
        )}
        {minimized && (
          <span className="text-xs font-medium text-slate-600 px-2 truncate flex-1 min-w-0">
            Region preview
          </span>
        )}
        {!minimized && (
          <button
            type="button"
            onClick={() => {
              setDrawMode(!drawMode);
              setDrawStart(null);
            }}
            className={clsx(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors",
              drawMode
                ? "bg-cyan-600 text-white border-cyan-600"
                : "bg-white text-eco-muted border-eco-border hover:text-eco-text"
            )}
          >
            <Square className="w-4 h-4" />
            {drawMode ? "Click corners" : "Draw region"}
          </button>
        )}
        {loading && !minimized && (
          <span className="text-xs font-medium text-cyan-700 px-2">
            Analyzing region…
          </span>
        )}
        {onToggleExpand && (
          <button
            type="button"
            onClick={onToggleExpand}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shrink-0"
            title={minimized ? "Expand map" : "Minimize map"}
          >
            {minimized ? (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                Expand
              </>
            ) : (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                Minimize
              </>
            )}
          </button>
        )}
      </div>

      <div className={clsx("relative flex-1", minimized ? "min-h-0" : "min-h-[280px]")}>
        <MapContainer
          center={defaultCenter}
          zoom={5}
          className="h-full w-full z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <MapController center={mapCenter} zoom={regionBounds ? 11 : 5} />
          <MapInvalidateOnMount minimized={minimized} />
          <MapClickHandler onSelect={handleMapClick} />

          {markerPos && <Marker position={markerPos} icon={markerIcon} />}
          {regionBounds && (
            <Rectangle
              bounds={regionBounds}
              pathOptions={{ color: "#0891b2", weight: 2, fillOpacity: 0.08 }}
            />
          )}
          {drawStart && (
            <Marker
              position={[drawStart.lat, drawStart.lng]}
              icon={markerIcon}
            />
          )}

          {result && overlayBounds && layers.waterStress && (
            <ImageOverlay
              url={resolveOverlayUrl(result.overlayUrls.waterStress)}
              bounds={overlayBounds}
              opacity={opacity}
              zIndex={200}
            />
          )}
          {result && overlayBounds && layers.ndvi && (
            <ImageOverlay
              url={resolveOverlayUrl(result.overlayUrls.ndvi)}
              bounds={overlayBounds}
              opacity={opacity * 0.85}
              zIndex={150}
            />
          )}
          {result && overlayBounds && layers.ndwi && (
            <ImageOverlay
              url={resolveOverlayUrl(result.overlayUrls.ndwi)}
              bounds={overlayBounds}
              opacity={opacity * 0.85}
              zIndex={175}
            />
          )}
          {result &&
            overlayBounds &&
            layers.climateRisk &&
            result.overlayUrls.climateRisk && (
              <ImageOverlay
                url={resolveOverlayUrl(result.overlayUrls.climateRisk)}
                bounds={overlayBounds}
                opacity={opacity * 0.9}
                zIndex={190}
              />
            )}
        </MapContainer>

        {result && (
          <div
            className={clsx(
              "absolute z-[1000]",
              minimized
                ? "bottom-1 right-1 left-1"
                : "top-3 right-3 w-56 max-w-[calc(100%-1.5rem)]"
            )}
          >
            <WaterOverlayControls
              layers={layers}
              opacity={opacity}
              onToggleLayer={toggleLayer}
              onOpacityChange={setOpacity}
              compact={minimized}
            />
          </div>
        )}

        {!minimized && (
          <div className="absolute bottom-3 left-3 z-[1000] glass-panel px-3 py-2 text-xs text-eco-muted pointer-events-none">
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3 text-cyan-600" />
              Click, search, or draw a region · analysis runs automatically
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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
