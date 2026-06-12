import type { LocationSelection } from "@/types/environment";
import type { RegionBounds } from "@/types/geospatial";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const DEFAULT_LOCATION: LocationSelection = {
  latitude: 28.6139,
  longitude: 77.209,
  name: "New Delhi, India",
};

export function boundsFromLocation(
  loc: LocationSelection,
  pad = 0.06
): RegionBounds {
  return {
    west: loc.longitude - pad,
    south: loc.latitude - pad,
    east: loc.longitude + pad,
    north: loc.latitude + pad,
  };
}

export async function resolveInitialLocation(options?: {
  forceDefault?: boolean;
  signal?: AbortSignal;
}): Promise<LocationSelection> {
  if (options?.forceDefault) {
    return DEFAULT_LOCATION;
  }

  try {
    const response = await fetch(`${API_URL}/api/v1/geo/me`, {
      signal: options?.signal,
    });
    if (response.ok) {
      const data = (await response.json()) as {
        latitude: number;
        longitude: number;
        name: string;
      };
      if (
        Number.isFinite(data.latitude) &&
        Number.isFinite(data.longitude)
      ) {
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          name: data.name || "Your area",
        };
      }
    }
  } catch {
    /* fall back to default */
  }

  return DEFAULT_LOCATION;
}
