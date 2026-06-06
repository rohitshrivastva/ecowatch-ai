export type MetricTone = "good" | "moderate" | "warning" | "danger";

export const toneClasses: Record<MetricTone, string> = {
  good: "text-emerald-600",
  moderate: "text-amber-600",
  warning: "text-orange-600",
  danger: "text-red-600",
};

export const toneBgClasses: Record<MetricTone, string> = {
  good: "bg-emerald-50 border-emerald-200",
  moderate: "bg-amber-50 border-amber-200",
  warning: "bg-orange-50 border-orange-200",
  danger: "bg-red-50 border-red-200",
};

export const aqiCardThemes: Record<
  MetricTone,
  { card: string; text: string; subtext: string }
> = {
  good: {
    card: "bg-[#cfe8cf] border-[#b8ddb8]",
    text: "text-slate-900",
    subtext: "text-slate-700",
  },
  moderate: {
    card: "bg-[#f5e6a8] border-[#eadf88]",
    text: "text-slate-900",
    subtext: "text-slate-700",
  },
  warning: {
    card: "bg-[#ffd4b8] border-[#ffc4a0]",
    text: "text-slate-900",
    subtext: "text-slate-700",
  },
  danger: {
    card: "bg-[#f5c2c2] border-[#eab0b0]",
    text: "text-slate-900",
    subtext: "text-slate-700",
  },
};

export function mainPollutant(pollution: {
  pm25: number;
  pm10: number;
  no2: number;
  ozone: number;
}): { name: string; value: number; unit: string } {
  const candidates = [
    { name: "PM2.5", value: pollution.pm25, unit: "µg/m³" },
    { name: "PM10", value: pollution.pm10, unit: "µg/m³" },
    { name: "NO₂", value: pollution.no2, unit: "µg/m³" },
    { name: "O₃", value: pollution.ozone, unit: "µg/m³" },
  ];
  return candidates.reduce((a, b) => (b.value > a.value ? b : a));
}

export function locationCityName(name?: string | null): string {
  if (!name) return "Your location";
  return name.split(",")[0]?.trim() || name;
}

export function pollutionIndexTone(score: number): MetricTone {
  if (score <= 30) return "good";
  if (score <= 55) return "moderate";
  if (score <= 75) return "warning";
  return "danger";
}

export function aqiTone(aqi: number): MetricTone {
  if (aqi <= 50) return "good";
  if (aqi <= 100) return "moderate";
  if (aqi <= 150) return "warning";
  return "danger";
}

export function temperatureTone(temp: number): MetricTone {
  if (temp >= 18 && temp <= 28) return "good";
  if (temp >= 12 && temp <= 32) return "moderate";
  if (temp >= 5 && temp <= 38) return "warning";
  return "danger";
}

export function humidityTone(humidity: number): MetricTone {
  if (humidity >= 35 && humidity <= 60) return "good";
  if (humidity >= 25 && humidity <= 70) return "moderate";
  if (humidity >= 15 && humidity <= 80) return "warning";
  return "danger";
}

export function cloudCoverageTone(coverage: number): MetricTone {
  if (coverage <= 30) return "good";
  if (coverage <= 55) return "moderate";
  if (coverage <= 75) return "warning";
  return "danger";
}

export function cloudCoverageFromDescription(description: string): number {
  const d = description.toLowerCase();
  if (d.includes("clear")) return 12;
  if (d.includes("few cloud")) return 22;
  if (d.includes("scattered")) return 38;
  if (d.includes("broken") || d.includes("partly")) return 52;
  if (d.includes("overcast") || d.includes("cloudy")) return 72;
  if (d.includes("rain") || d.includes("drizzle") || d.includes("storm")) return 88;
  return 45;
}
