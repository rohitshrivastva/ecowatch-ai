"use client";

import { useEffect, useState } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import clsx from "clsx";
import { Layers } from "lucide-react";
import {
  formatCoordinates,
  GIS_BASEMAPS,
  type GisBasemapId,
} from "@/lib/gis-map";

export function GisScaleControl() {
  const map = useMap();

  useEffect(() => {
    const scale = L.control.scale({
      imperial: false,
      metric: true,
      position: "bottomleft",
    });
    scale.addTo(map);
    return () => {
      scale.remove();
    };
  }, [map]);

  return null;
}

export function GisCoordinateReadout() {
  const [coords, setCoords] = useState<string | null>(null);

  useMapEvents({
    mousemove(e) {
      setCoords(formatCoordinates(e.latlng.lat, e.latlng.lng));
    },
    mouseout() {
      setCoords(null);
    },
  });

  if (!coords) return null;

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
      <span className="gis-coords-badge">{coords}</span>
    </div>
  );
}

export function GisBasemapSwitcher({
  value,
  onChange,
  compact = false,
}: {
  value: GisBasemapId;
  onChange: (id: GisBasemapId) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const options = Object.values(GIS_BASEMAPS);

  if (compact) {
    return (
      <div className="pointer-events-auto">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as GisBasemapId)}
          className="text-[10px] font-medium rounded-lg border border-slate-200 bg-white/95 px-2 py-1 text-slate-700 shadow-sm"
          aria-label="Basemap"
        >
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="pointer-events-auto relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="gis-basemap-trigger"
        aria-expanded={open}
      >
        <Layers className="w-3.5 h-3.5" />
        <span>{GIS_BASEMAPS[value].label}</span>
      </button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[999]"
            aria-label="Close basemap menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1.5 z-[1001] gis-basemap-menu">
            {options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                }}
                className={clsx(
                  "gis-basemap-option",
                  value === opt.id && "gis-basemap-option-active"
                )}
              >
                <span className="text-base leading-none">{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
