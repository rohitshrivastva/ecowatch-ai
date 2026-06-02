"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Rectangle } from "react-leaflet";
import { Search, MapPin, Square } from "lucide-react";
import type { LocationSelection } from "@/types/environment";

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

interface InteractiveMapProps {
  onLocationSelect: (selection: LocationSelection) => void;
  selectedLocation?: LocationSelection | null;
  loading?: boolean;
}

export default function InteractiveMap({
  onLocationSelect,
  selectedLocation,
  loading,
}: InteractiveMapProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [drawMode, setDrawMode] = useState(false);
  const [drawStart, setDrawStart] = useState<L.LatLng | null>(null);
  const [drawBounds, setDrawBounds] = useState<L.LatLngBounds | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(defaultCenter);
  const searchTimeout = useRef<NodeJS.Timeout>();

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
        {loading && (
          <span className="text-sm text-eco-primary animate-pulse">
            Analyzing...
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

        <div className="absolute bottom-4 left-4 glass-panel px-3 py-2 text-xs text-eco-muted flex items-center gap-2 z-[1000]">
          <MapPin className="w-3 h-3 text-eco-primary" />
          Click map to select • Search or draw an area
        </div>
      </div>
    </div>
  );
}
