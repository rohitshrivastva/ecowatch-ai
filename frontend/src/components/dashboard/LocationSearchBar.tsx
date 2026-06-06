"use client";

import { memo, useRef, useState } from "react";
import { Search } from "lucide-react";
import type { LocationSelection } from "@/types/environment";

interface LocationSearchBarProps {
  onLocationSelect: (loc: LocationSelection) => void;
  loading?: boolean;
  detectingLocation?: boolean;
}

function LocationSearchBar({
  onLocationSelect,
  loading,
  detectingLocation,
}: LocationSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

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
          onLocationSelect({
            latitude: parseFloat(lat),
            longitude: parseFloat(lon),
            name: display_name,
          });
        }
      } catch {
        /* geocoding unavailable */
      }
    }, 500);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Your country, city or location..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-full text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
          aria-label="Search location"
        />
      </div>
      {(detectingLocation || loading) && (
        <p className="text-xs text-emerald-600 pl-4 animate-pulse">
          {detectingLocation ? "Finding your area…" : "Updating air quality…"}
        </p>
      )}
    </div>
  );
}

export default memo(LocationSearchBar);
