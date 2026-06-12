import type { EnvironmentalAnalysis } from "@/types/environment";
import type { TrendMetric, TrendsResponse } from "@/types/intelligence";
import { environmentalHealthFromRisk, type HealthCategory } from "@/lib/platform-health";

export type StatusChip = {
  label: string;
  positive: boolean;
};

export type RiskCardData = {
  title: string;
  href: string;
  status: string;
  level: string;
  recommendation: string;
  tone: "good" | "moderate" | "warning" | "critical";
};

export type TrendItem = {
  label: string;
  value: string;
  direction: "up" | "down" | "stable";
  positive?: boolean;
};

export type EnvironmentalOutlookData = {
  bullets: string[];
  recommendation: string;
};

function aqiTone(aqi: number): RiskCardData["tone"] {
  if (aqi <= 50) return "good";
  if (aqi <= 100) return "moderate";
  if (aqi <= 150) return "warning";
  return "critical";
}

function stressTone(level: string): RiskCardData["tone"] {
  const l = level.toLowerCase();
  if (l.includes("low") || l.includes("minimal")) return "good";
  if (l.includes("moderate") || l.includes("medium")) return "moderate";
  if (l.includes("high") || l.includes("severe")) return "critical";
  return "warning";
}

function climateTone(category: string): RiskCardData["tone"] {
  const c = category.toLowerCase();
  if (c === "low") return "good";
  if (c === "moderate") return "moderate";
  if (c === "high") return "warning";
  return "critical";
}

export function deriveStatusChips(analysis: EnvironmentalAnalysis): StatusChip[] {
  const bto = analysis.best_time_outside;
  const wc = analysis.water_crisis;
  const cr = analysis.climate_risk;
  const air = analysis.air_pollution;

  const safeOutside =
    bto &&
    ["Excellent", "Good"].includes(bto.environmental_status);

  const lowWater =
    wc &&
    !wc.stress_level.toLowerCase().includes("high") &&
    !wc.stress_level.toLowerCase().includes("critical");

  const noClimateAlerts =
    cr &&
    !["High", "Critical"].includes(cr.category);

  const airGood = air.aqi <= 100;

  return [
    {
      label: safeOutside ? "Safe Outside Today" : "Limited Outdoor Comfort",
      positive: Boolean(safeOutside),
    },
    {
      label: lowWater ? "Low Water Stress" : wc?.stress_level ?? "Water Unknown",
      positive: Boolean(lowWater),
    },
    {
      label: noClimateAlerts ? "No Climate Alerts" : `${cr?.category ?? "Climate"} Risk`,
      positive: Boolean(noClimateAlerts),
    },
    {
      label: airGood ? "Air Quality Good" : `Air: ${air.aqi_label}`,
      positive: airGood,
    },
  ];
}

export function deriveRiskCards(analysis: EnvironmentalAnalysis): RiskCardData[] {
  const air = analysis.air_pollution;
  const wc = analysis.water_crisis;
  const cr = analysis.climate_risk;
  const weather = analysis.weather;
  const bto = analysis.best_time_outside;

  const airRec =
    air.aqi <= 50
      ? "No respiratory concerns expected."
      : air.aqi <= 100
        ? "Sensitive groups should limit prolonged outdoor exertion."
        : "Reduce outdoor activity; consider a mask if you must go out.";

  const waterRec =
    wc?.recommendations?.[0] ??
    wc?.summary ??
    "Monitor local water advisories and conservation notices.";

  const climateRec =
    cr?.summary ??
    cr?.outdoor_safety ??
    "Review regional climate risk for long-term planning.";

  const weatherRec =
    bto?.why ??
    `${weather.description}. ${Math.round(weather.temperature)}°C with ${weather.humidity}% humidity.`;

  return [
    {
      title: "Air Quality",
      href: "/app/air-quality",
      status: air.aqi <= 100 ? "GOOD" : air.aqi <= 150 ? "MODERATE" : "POOR",
      level: `AQI ${air.aqi}`,
      recommendation: airRec,
      tone: aqiTone(air.aqi),
    },
    {
      title: "Water",
      href: "/app/water-intelligence",
      status: (wc?.stress_level ?? "Unknown").toUpperCase(),
      level: wc?.drought_risk ? `Drought: ${wc.drought_risk}` : "Stable supply",
      recommendation: waterRec,
      tone: wc ? stressTone(wc.stress_level) : "moderate",
    },
    {
      title: "Climate",
      href: "/app/climate-risk",
      status: (cr?.category ?? "Unknown").toUpperCase(),
      level: cr ? `Risk ${cr.score}/100` : "—",
      recommendation: climateRec,
      tone: cr ? climateTone(cr.category) : "moderate",
    },
    {
      title: "Weather",
      href: "/app/weather",
      status: (bto?.environmental_status ?? "Moderate").toUpperCase(),
      level: `${Math.round(weather.temperature)}°C · ${weather.description}`,
      recommendation: weatherRec,
      tone:
        bto?.environmental_status === "Excellent" ||
        bto?.environmental_status === "Good"
          ? "good"
          : bto?.environmental_status === "Dangerous"
            ? "critical"
            : "moderate",
    },
  ];
}

export function deriveBestTimeReasons(analysis: EnvironmentalAnalysis): string[] {
  const bto = analysis.best_time_outside;
  if (bto?.suggestions?.length) {
    return bto.suggestions.slice(0, 4).map((s) => s.replace(/^[•\-]\s*/, ""));
  }

  const reasons: string[] = [];
  if (analysis.air_pollution.aqi <= 100) reasons.push("Better AQI");
  if (analysis.weather.temperature < 32) reasons.push("Lower temperature");
  if (analysis.weather.uv_index <= 6) reasons.push("Lower UV exposure");
  if (analysis.weather.wind_speed < 8) reasons.push("Comfortable conditions");
  return reasons.slice(0, 4);
}

export function deriveOutlook(analysis: EnvironmentalAnalysis): EnvironmentalOutlookData {
  const bullets: string[] = [];
  const air = analysis.air_pollution;
  const wc = analysis.water_crisis;
  const cr = analysis.climate_risk;

  if (air.aqi <= 100) {
    bullets.push("Air quality remains healthy");
  } else {
    bullets.push(`Air quality is ${air.aqi_label.toLowerCase()} — limit exposure`);
  }

  if (wc) {
    const stable =
      !wc.stress_level.toLowerCase().includes("high") &&
      (wc.rainfall_deficit_pct == null || wc.rainfall_deficit_pct < 20);
    bullets.push(
      stable ? "Water resources are stable" : "Water stress warrants attention"
    );
  }

  if (cr) {
    bullets.push(
      ["Low", "Moderate"].includes(cr.category)
        ? "No major climate threats detected"
        : `Climate risk is ${cr.category.toLowerCase()} — stay informed`
    );
  }

  const rec =
    analysis.best_time_outside?.environmental_status &&
    ["Excellent", "Good"].includes(analysis.best_time_outside.environmental_status)
      ? "Outdoor activities are suitable today."
      : analysis.recommendations?.[0]?.description ??
        analysis.best_time_outside?.why ??
        "Check risk cards below before planning outdoor activities.";

  if (bullets.length < 3 && analysis.recommendations?.[0]) {
    bullets.push(analysis.recommendations[0].title);
  }

  return {
    bullets: bullets.slice(0, 4),
    recommendation: rec,
  };
}

function formatTrendMetric(m: TrendMetric): TrendItem | null {
  const name = m.metric.toLowerCase();
  let label = m.metric;
  if (name.includes("aqi")) label = "AQI";
  else if (name.includes("temp")) label = "Temperature";
  else if (name.includes("rain") || name.includes("precip")) label = "Rainfall";
  else if (name.includes("risk")) label = "Risk Score";

  const pct = m.change_pct;
  const direction: TrendItem["direction"] =
    Math.abs(pct) < 2 ? "stable" : pct > 0 ? "up" : "down";

  let value: string;
  if (direction === "stable") value = "Stable";
  else if (name.includes("temp")) value = `${pct > 0 ? "↑" : "↓"} ${Math.abs(pct).toFixed(0)}%`;
  else value = `${pct > 0 ? "↑" : "↓"} ${Math.abs(Math.round(pct))}%`;

  const positive =
    (name.includes("aqi") && pct < 0) ||
    (name.includes("rain") && pct > 0) ||
    (name.includes("risk") && pct < 0);

  return { label, value, direction, positive };
}

export function deriveTrendItems(
  trends: TrendsResponse | null,
  analysis: EnvironmentalAnalysis | null
): TrendItem[] {
  if (trends?.metrics?.length) {
    const mapped = trends.metrics
      .map(formatTrendMetric)
      .filter((t): t is TrendItem => t != null);
    if (mapped.length >= 3) return mapped.slice(0, 4);
  }

  if (!analysis) {
    return [
      { label: "AQI", value: "—", direction: "stable" },
      { label: "Rainfall", value: "—", direction: "stable" },
      { label: "Temperature", value: "—", direction: "stable" },
      { label: "Water Stress", value: "—", direction: "stable" },
    ];
  }

  const items: TrendItem[] = [];
  const cr = analysis.climate_risk;
  const wc = analysis.water_crisis;

  if (cr?.historical) {
    const aqiChange = cr.historical.change_3yr;
    items.push({
      label: "AQI",
      value: Math.abs(aqiChange) < 2 ? "Stable" : `${aqiChange > 0 ? "↑" : "↓"} ${Math.abs(Math.round(aqiChange))}%`,
      direction: Math.abs(aqiChange) < 2 ? "stable" : aqiChange > 0 ? "up" : "down",
      positive: aqiChange < 0,
    });
  } else {
    items.push({ label: "AQI", value: "Stable", direction: "stable", positive: true });
  }

  const rainPct = wc?.rainfall_anomaly?.anomaly_pct ?? wc?.rainfall_deficit_pct;
  if (rainPct != null) {
    items.push({
      label: "Rainfall",
      value: Math.abs(rainPct) < 3 ? "Stable" : `${rainPct > 0 ? "↑" : "↓"} ${Math.abs(Math.round(rainPct))}%`,
      direction: Math.abs(rainPct) < 3 ? "stable" : rainPct > 0 ? "up" : "down",
      positive: rainPct > 0,
    });
  } else {
    items.push({ label: "Rainfall", value: "Stable", direction: "stable" });
  }

  if (cr?.trend_change_3yr != null) {
    items.push({
      label: "Temperature",
      value: cr.trend_change_3yr > 0 ? `↑ ${cr.trend_change_3yr.toFixed(1)}° trend` : "Stable",
      direction: cr.trend_change_3yr > 0.5 ? "up" : "stable",
    });
  } else {
    items.push({ label: "Temperature", value: "Stable", direction: "stable" });
  }

  items.push({
    label: "Water Stress",
    value: wc?.stress_level?.toLowerCase().includes("low") ? "Stable" : wc?.stress_level ?? "Stable",
    direction: "stable",
    positive: wc?.stress_level?.toLowerCase().includes("low"),
  });

  return items.slice(0, 4);
}

export function healthFromAnalysis(analysis: EnvironmentalAnalysis | null): {
  score: number;
  category: HealthCategory;
} | null {
  if (!analysis) return null;
  return environmentalHealthFromRisk(analysis.risk.score);
}
