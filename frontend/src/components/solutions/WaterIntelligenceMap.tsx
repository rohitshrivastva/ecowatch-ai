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
import { Search, Square, ScanSearch, MapPin } from "lucide-react";
import clsx from "clsx";
import { resolveOverlayUrl } from "@/lib/geospatial-api";
import WaterOverlayControls from "@/components/solutions/WaterOverlayControls";
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

function MapInvalidateOnMount() {
  const map = useMap();
  useEffect(() => {
    const refresh = () => map.invalidateSize();
    refresh();
    const timer = window.setTimeout(refresh, 150);
    return () => window.clearTimeout(timer);
  }, [map]);
  return null;
}

interface WaterIntelligenceMapProps {
  onAnalyze: (bounds: RegionBounds) => void;
  loading: boolean;
  result: GeospatialAnalyzeResponse | null;
}

export default function WaterIntelligenceMap({
  onAnalyze,
  loading,
  result,
}: WaterIntelligenceMapProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [mapCenter, setMapCenter] = useState<[number, number]>(defaultCenter);
  const [drawMode, setDrawMode] = useState(false);
  const [drawStart, setDrawStart] = useState<L.LatLng | null>(null);
  const [regionBounds, setRegionBounds] = useState<LatLngBounds | null>(null);
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(null);
  const [layers, setLayers] = useState<Record<WaterOverlayLayer, boolean>>({
    ndvi: true,
    ndwi: false,
    waterStress: true,
  });
  const [opacity, setOpacity] = useState(0.65);
  const searchTimeout = useRef<NodeJS.Timeout>();

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
          const { lat, lon } = results[0];
          const latitude = parseFloat(lat);
          const longitude = parseFloat(lon);
          setMapCenter([latitude, longitude]);
          setMarkerPos([latitude, longitude]);
          const pad = 0.08;
          setRegionBounds(
            L.latLngBounds(
              [latitude - pad, longitude - pad],
              [latitude + pad, longitude + pad]
            )
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
  }, [drawStart]);

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (drawMode) {
        handleDrawPoint(lat, lng);
        return;
      }
      setMarkerPos([lat, lng]);
      setMapCenter([lat, lng]);
      const pad = 0.06;
      setRegionBounds(
        L.latLngBounds(
          [lat - pad, lng - pad],
          [lat + pad, lng + pad]
        )
      );
    },
    [drawMode, handleDrawPoint]
  );

  const runAnalysis = () => {
    if (!regionBounds) return;
    onAnalyze({
      west: regionBounds.getWest(),
      south: regionBounds.getSouth(),
      east: regionBounds.getEast(),
      north: regionBounds.getNorth(),
    });
  };

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
    <div className="glass-panel overflow-hidden rounded-2xl flex flex-col h-full min-h-[420px]">
      <div className="p-4 border-b border-eco-border flex flex-wrap gap-3 items-center">
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
        <button
          type="button"
          onClick={runAnalysis}
          disabled={!regionBounds || loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-eco-primary text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ScanSearch className="w-4 h-4" />
          {loading ? "Analyzing…" : "Analyze region"}
        </button>
      </div>

      <div className="relative flex-1 min-h-[360px]">
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
          <MapInvalidateOnMount />
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
        </MapContainer>

        {result && (
          <div className="absolute top-3 right-3 z-[1000] w-56 max-w-[calc(100%-1.5rem)]">
            <WaterOverlayControls
              layers={layers}
              opacity={opacity}
              onToggleLayer={toggleLayer}
              onOpacityChange={setOpacity}
            />
          </div>
        )}

        <div className="absolute bottom-3 left-3 z-[1000] glass-panel px-3 py-2 text-xs text-eco-muted pointer-events-none">
          <div className="flex items-center gap-2">
            <MapPin className="w-3 h-3 text-cyan-600" />
            Click, search, or draw a region · then Analyze
          </div>
        </div>
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
