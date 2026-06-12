export type HealthCategory =
  | "Excellent"
  | "Good"
  | "Moderate"
  | "Poor"
  | "Critical";

export function environmentalHealthFromRisk(riskScore: number): {
  score: number;
  category: HealthCategory;
} {
  const score = Math.max(0, Math.min(100, 100 - riskScore));
  let category: HealthCategory;
  if (score >= 80) category = "Excellent";
  else if (score >= 65) category = "Good";
  else if (score >= 45) category = "Moderate";
  else if (score >= 25) category = "Poor";
  else category = "Critical";
  return { score, category };
}

export const HEALTH_STYLES: Record<HealthCategory, string> = {
  Excellent: "text-emerald-700 bg-emerald-50 border-emerald-200",
  Good: "text-cyan-800 bg-cyan-50 border-cyan-200",
  Moderate: "text-amber-800 bg-amber-50 border-amber-200",
  Poor: "text-orange-800 bg-orange-50 border-orange-200",
  Critical: "text-red-800 bg-red-50 border-red-200",
};

export const HEALTH_RING: Record<HealthCategory, string> = {
  Excellent: "#10b981",
  Good: "#06b6d4",
  Moderate: "#f59e0b",
  Poor: "#f97316",
  Critical: "#ef4444",
};
