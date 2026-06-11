import { authHeaders } from "@/lib/auth";
import type {
  GeospatialAnalyzeRequest,
  GeospatialAnalyzeResponse,
} from "@/types/geospatial";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function analyzeGeospatialRegion(
  request: GeospatialAnalyzeRequest
): Promise<GeospatialAnalyzeResponse> {
  const response = await fetch(`${API_URL}/api/v1/geospatial/analyze-region`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({
      bbox: request.bbox,
      analysisType: request.analysisType ?? "water",
      polygon: request.polygon,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const detail = error.detail;
    throw new Error(
      typeof detail === "string"
        ? detail
        : `Geospatial analysis failed (${response.status})`
    );
  }

  return response.json();
}

export function resolveOverlayUrl(url: string): string {
  if (url.startsWith("http")) return url;
  return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}
