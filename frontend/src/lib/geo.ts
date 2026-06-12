import type { LocationSelection } from "@/types/environment";
import type { RegionBounds } from "@/types/geospatial";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const DEFAULT_LOCATION: LocationSelection = {
  latitude: 28.6139,
  longitude: 77.209,
  name: "New Delhi, India",
};

function isLocalDevHost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

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

function getBrowserPosition(signal?: AbortSignal): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    const onAbort = () => reject(new DOMException("Aborted", "AbortError"));
    signal?.addEventListener("abort", onAbort, { once: true });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        signal?.removeEventListener("abort", onAbort);
        resolve(position);
      },
      (error) => {
        signal?.removeEventListener("abort", onAbort);
        reject(error);
      },
      {
        enableHighAccuracy: false,
        timeout: 12_000,
        maximumAge: 5 * 60_000,
      }
    );
  });
}

async function reverseGeocodeName(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<string> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "json");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));
    url.searchParams.set("zoom", "10");

    const response = await fetch(url.toString(), {
      signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      return `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
    }

    const data = (await response.json()) as {
      display_name?: string;
      address?: {
        city?: string;
        town?: string;
        village?: string;
        state?: string;
        country?: string;
      };
    };

    if (data.display_name) return data.display_name;

    const a = data.address;
    if (a) {
      const city = a.city ?? a.town ?? a.village;
      const parts = [city, a.state, a.country].filter(Boolean);
      if (parts.length) return parts.join(", ");
    }

    return `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
  } catch {
    return `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
  }
}

async function resolveBrowserLocation(
  signal?: AbortSignal
): Promise<LocationSelection | null> {
  try {
    const position = await getBrowserPosition(signal);
    const { latitude, longitude } = position.coords;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }
    const name = await reverseGeocodeName(latitude, longitude, signal);
    return { latitude, longitude, name };
  } catch {
    return null;
  }
}

async function resolveIpLocation(
  signal?: AbortSignal
): Promise<LocationSelection | null> {
  try {
    const response = await fetch(`${API_URL}/api/v1/geo/me`, { signal });
    if (!response.ok) return null;

    const data = (await response.json()) as {
      latitude: number;
      longitude: number;
      name: string;
      source?: string;
    };

    if (
      !Number.isFinite(data.latitude) ||
      !Number.isFinite(data.longitude) ||
      data.source === "default"
    ) {
      return null;
    }

    return {
      latitude: data.latitude,
      longitude: data.longitude,
      name: data.name || "Your area",
    };
  } catch {
    return null;
  }
}

export async function resolveInitialLocation(options?: {
  forceDefault?: boolean;
  signal?: AbortSignal;
}): Promise<LocationSelection> {
  if (options?.forceDefault) {
    return DEFAULT_LOCATION;
  }

  // Localhost: IP geolocation cannot work — use browser GPS/Wi‑Fi location.
  if (isLocalDevHost()) {
    const browser = await resolveBrowserLocation(options?.signal);
    if (browser) return browser;
    return DEFAULT_LOCATION;
  }

  const ipLocation = await resolveIpLocation(options?.signal);
  if (ipLocation) return ipLocation;

  const browser = await resolveBrowserLocation(options?.signal);
  if (browser) return browser;

  return DEFAULT_LOCATION;
}
