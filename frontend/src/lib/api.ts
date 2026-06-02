import { authHeaders } from "@/lib/auth";
import type { EnvironmentalAnalysis, LocationSelection } from "@/types/environment";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function analyzeLocation(
  selection: LocationSelection
): Promise<EnvironmentalAnalysis> {
  const response = await fetch(`${API_URL}/api/v1/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({
      latitude: selection.latitude,
      longitude: selection.longitude,
      name: selection.name,
      boundary: selection.boundary,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const detail = error.detail;
    const message =
      typeof detail === "string"
        ? detail
        : `Analysis failed (${response.status})`;
    if (response.status === 401) {
      throw new Error("Please sign in to run analysis.");
    }
    throw new Error(message);
  }

  return response.json();
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/v1/health`, {
      headers: authHeaders(),
    });
    return response.ok;
  } catch {
    return false;
  }
}
