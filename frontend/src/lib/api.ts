import type { EnvironmentalAnalysis, LocationSelection } from "@/types/environment";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function analyzeLocation(
  selection: LocationSelection
): Promise<EnvironmentalAnalysis> {
  const response = await fetch(`${API_URL}/api/v1/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      latitude: selection.latitude,
      longitude: selection.longitude,
      name: selection.name,
      boundary: selection.boundary,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Analysis failed (${response.status})`);
  }

  return response.json();
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/v1/health`);
    return response.ok;
  } catch {
    return false;
  }
}
