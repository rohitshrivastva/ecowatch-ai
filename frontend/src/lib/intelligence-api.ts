import { authHeaders } from "@/lib/auth";
import type {
  FavoriteLocation,
  HeatmapResponse,
  HeatmapType,
  HistoryPeriod,
  TrendsResponse,
} from "@/types/intelligence";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchTrends(
  locationId: number,
  period: HistoryPeriod = "7d"
): Promise<TrendsResponse> {
  const response = await fetch(
    `${API_URL}/api/v1/history/trends?location_id=${locationId}&period=${period}`
  );
  if (!response.ok) {
    throw new Error("Failed to load historical trends");
  }
  return response.json();
}

export async function fetchHeatmap(
  type: HeatmapType,
  bounds: { north: number; south: number; east: number; west: number },
  zoom = 10
): Promise<HeatmapResponse> {
  const params = new URLSearchParams({
    north: String(bounds.north),
    south: String(bounds.south),
    east: String(bounds.east),
    west: String(bounds.west),
    zoom: String(zoom),
  });
  const response = await fetch(`${API_URL}/api/v1/heatmap/${type}?${params}`);
  if (!response.ok) {
    throw new Error("Failed to load heatmap data");
  }
  return response.json();
}

export async function listFavorites(): Promise<FavoriteLocation[]> {
  const response = await fetch(`${API_URL}/api/v1/favorites`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Sign in to save and view favorite locations");
    }
    throw new Error("Failed to load favorites");
  }
  return response.json();
}

export async function createFavorite(payload: {
  location_name: string;
  latitude: number;
  longitude: number;
}): Promise<FavoriteLocation> {
  const response = await fetch(`${API_URL}/api/v1/favorites`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to save location");
  }
  return response.json();
}

export async function deleteFavorite(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/api/v1/favorites/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to remove favorite");
  }
}
