"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
  Rectangle,
} from "react-leaflet";
import { Layers, Search, MapPin, Square } from "lucide-react";
import type { LocationSelection } from "@/types/environment";
import type { HeatmapPoint, HeatmapType } from "@/types/intelligence";
import HeatmapLayer from "@/components/HeatmapLayer";

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

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 12, { duration: 1.5 });
  }, [center, map]);
  return null;
}

function MapBoundsWatcher({
  onBoundsChange,
}: {
  onBoundsChange: (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
    zoom: number;
  }) => void;
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

const HEATMAP_OPTIONS: { id: HeatmapType; label: string }[] = [
  { id: "aqi", label: "AQI" },
  { id: "temperature", label: "Temperature" },
  { id: "vegetation", label: "Vegetation" },
  { id: "environmental-risk", label: "Risk" },
];

interface InteractiveMapProps {
  onLocationSelect: (selection: LocationSelection) => void;
  selectedLocation?: LocationSelection | null;
  loading?: boolean;
  detectingLocation?: boolean;
  heatmapEnabled?: boolean;
  heatmapType?: HeatmapType;
  heatmapPoints?: HeatmapPoint[];
  onHeatmapToggle?: (enabled: boolean) => void;
  onHeatmapTypeChange?: (type: HeatmapType) => void;
  onBoundsChange?: (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
    zoom: number;
  }) => void;
}

export default function InteractiveMap({
  onLocationSelect,
  selectedLocation,
  loading,
  detectingLocation,
  heatmapEnabled = false,
  heatmapType = "environmental-risk",
  heatmapPoints = [],
  onHeatmapToggle,
  onHeatmapTypeChange,
  onBoundsChange,
}: InteractiveMapProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [drawMode, setDrawMode] = useState(false);
  const [drawStart, setDrawStart] = useState<L.LatLng | null>(null);
  const [drawBounds, setDrawBounds] = useState<L.LatLngBounds | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(defaultCenter);
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

  const markerIcon = L.divIcon({
    className: "custom-marker",
    html: `<div style="width:24px;height:24px;background:#10b981;border:3px solid white;border-radius:50%;box-shadow:0 0 12px rgba(16,185,129,0.6)"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  return (
    <div className="glass-panel overflow-hidden">
      <div className="p-4 border-b border-eco-border flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-eco-muted" />
          <input
            type="text"
            placeholder="Search city or location..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-eco-bg border border-eco-border rounded-lg text-sm text-eco-text placeholder:text-eco-muted focus:outline-none focus:border-eco-primary/50"
          />
        </div>
        {onHeatmapToggle && (
          <button
            type="button"
            onClick={() => onHeatmapToggle(!heatmapEnabled)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              heatmapEnabled
                ? "bg-eco-accent/80 text-white"
                : "bg-eco-surface-hover text-eco-muted hover:text-eco-text"
            }`}
          >
            <Layers className="w-4 h-4" />
            Heatmap
          </button>
        )}
        {heatmapEnabled && onHeatmapTypeChange && (
          <select
            value={heatmapType}
            onChange={(e) => onHeatmapTypeChange(e.target.value as HeatmapType)}
            className="px-3 py-2.5 rounded-lg bg-eco-bg border border-eco-border text-sm text-eco-text"
          >
            {HEATMAP_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        )}
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
            {detectingLocation ? "Detecting location..." : "Analyzing..."}
          </span>
        )}
      </div>

      <div className="relative h-[400px] lg:h-[500px]">
        <MapContainer
          center={defaultCenter}
          zoom={5}
          className="h-full w-full"
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <MapController center={mapCenter} />
          {onBoundsChange && <MapBoundsWatcher onBoundsChange={onBoundsChange} />}
          <HeatmapLayer points={heatmapPoints} visible={heatmapEnabled} />
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
            <Rectangle
              bounds={drawBounds}
              pathOptions={{ color: "#10b981", weight: 2, fillOpacity: 0.1 }}
            />
          )}
        </MapContainer>

        <div className="absolute bottom-4 left-4 glass-panel px-3 py-2 text-xs text-eco-muted z-[1000] space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-3 h-3 text-eco-primary" />
            Click map to select • Search or draw an area
          </div>
          {heatmapEnabled && (
            <div className="flex items-center gap-2 pt-1 border-t border-eco-border">
              <span className="text-[10px]">Low</span>
              <div className="h-2 flex-1 rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500" />
              <span className="text-[10px]">High</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
