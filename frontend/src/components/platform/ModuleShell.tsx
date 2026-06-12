"use client";

import clsx from "clsx";
import LocationSearchBar from "@/components/dashboard/LocationSearchBar";
import type { LocationSelection } from "@/types/environment";

export default function ModuleShell({
  title,
  description,
  accent,
  location,
  onLocationSelect,
  detectingLocation,
  loading,
  children,
}: {
  title: string;
  description: string;
  accent?: string;
  location: LocationSelection | null;
  onLocationSelect: (loc: LocationSelection) => void;
  detectingLocation?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6 pb-8">
      <header
        className={clsx(
          "rounded-2xl border px-5 py-6 lg:px-8",
          accent ?? "border-eco-border bg-gradient-to-br from-white to-eco-surface"
        )}
      >
        <h1 className="text-xl lg:text-2xl font-bold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">{description}</p>
        <div className="mt-4 max-w-lg">
          <LocationSearchBar
            onLocationSelect={onLocationSelect}
            loading={loading}
            detectingLocation={detectingLocation}
          />
        </div>
        {location?.name && (
          <p className="text-xs text-slate-500 mt-2">
            Viewing: <span className="font-medium text-slate-700">{location.name}</span>
          </p>
        )}
      </header>
      {children}
    </div>
  );
}
