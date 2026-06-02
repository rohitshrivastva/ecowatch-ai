import type { EnvironmentalAnalysis, Recommendation } from "@/types/environment";

const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function sortRecommendations(recs: Recommendation[]): Recommendation[] {
  return [...recs].sort(
    (a, b) =>
      (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2)
  );
}

export function buildInsightSummary(analysis: EnvironmentalAnalysis): string {
  const sorted = sortRecommendations(analysis.recommendations);
  const top = sorted[0];
  if (!top) {
    return `Environmental score is ${analysis.risk.score}/100 with ${analysis.risk.level.toLowerCase()} risk for this area.`;
  }
  const action =
    top.actions[0] != null ? ` Recommended: ${top.actions[0].toLowerCase()}.` : "";
  const why = top.description.replace(/\s+/g, " ").trim();
  const clipped = why.length > 140 ? `${why.slice(0, 137)}…` : why;
  return `${clipped}${action}`;
}

export function formatRiskLevel(level: string): string {
  return level.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
