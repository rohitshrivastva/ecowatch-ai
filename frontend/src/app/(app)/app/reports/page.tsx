"use client";

import { FileDown, FileSpreadsheet } from "lucide-react";
import ModuleShell from "@/components/platform/ModuleShell";
import { useEnvironmentalAnalysis } from "@/hooks/useEnvironmentalAnalysis";
import { usePlatformLocation } from "@/hooks/usePlatformLocation";
import { environmentalHealthFromRisk } from "@/lib/platform-health";

const REPORTS = [
  {
    id: "health",
    title: "Environmental Health Report",
    description: "Unified health score and category for your location.",
  },
  {
    id: "water",
    title: "Water Stress Report",
    description: "Drought risk, rainfall deficit, and stress indicators.",
  },
  {
    id: "climate",
    title: "Climate Risk Report",
    description: "Composite risk score, components, and trends.",
  },
  {
    id: "aqi",
    title: "AQI Report",
    description: "Air quality index, pollutants, and health guidance.",
  },
] as const;

function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const { location, setLocation, detecting } = usePlatformLocation();
  const { analysis, loading } = useEnvironmentalAnalysis(location);

  const exportCsv = (reportId: string) => {
    if (!analysis) return;
    const health = environmentalHealthFromRisk(analysis.risk.score);
    const rows: string[][] = [["Metric", "Value"]];

    if (reportId === "health") {
      rows.push(["Health score", String(health.score)]);
      rows.push(["Category", health.category]);
      rows.push(["Location", analysis.location_name ?? "Unknown"]);
    } else if (reportId === "water" && analysis.water_crisis) {
      const wc = analysis.water_crisis;
      rows.push(["Water stress", wc.stress_level]);
      rows.push(["Drought risk", wc.drought_risk]);
      rows.push(["Rainfall deficit %", String(wc.rainfall_deficit_pct ?? "")]);
    } else if (reportId === "climate" && analysis.climate_risk) {
      const cr = analysis.climate_risk;
      rows.push(["Climate risk score", String(cr.score)]);
      rows.push(["Category", cr.category]);
      rows.push(["Trend", cr.trend]);
    } else if (reportId === "aqi") {
      rows.push(["AQI", String(analysis.air_pollution.aqi)]);
      rows.push(["Status", analysis.air_pollution.aqi_label]);
      rows.push(["PM2.5", String(analysis.air_pollution.pm25)]);
    }

    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadText(`ecowatch-${reportId}-report.csv`, csv, "text/csv");
  };

  const exportPdf = (reportId: string, title: string) => {
    if (!analysis) return;
    const health = environmentalHealthFromRisk(analysis.risk.score);
    const lines = [
      `EcoWatch — ${title}`,
      `Location: ${analysis.location_name}`,
      `Generated: ${new Date().toISOString()}`,
      "",
    ];

    if (reportId === "health") {
      lines.push(`Environmental Health Score: ${health.score}/100 (${health.category})`);
    } else if (reportId === "water" && analysis.water_crisis) {
      lines.push(`Water stress: ${analysis.water_crisis.stress_level}`);
      lines.push(`Drought risk: ${analysis.water_crisis.drought_risk}`);
    } else if (reportId === "climate" && analysis.climate_risk) {
      lines.push(`Climate risk: ${analysis.climate_risk.score}/100 (${analysis.climate_risk.category})`);
      lines.push(analysis.climate_risk.summary ?? "");
    } else if (reportId === "aqi") {
      lines.push(`AQI: ${analysis.air_pollution.aqi} (${analysis.air_pollution.aqi_label})`);
    }

    downloadText(`ecowatch-${reportId}-report.txt`, lines.join("\n"), "text/plain");
  };

  return (
    <ModuleShell
      title="Reports & Analytics"
      description="Generate environmental health, water, climate, and AQI reports. Export as CSV or text report."
      location={location}
      onLocationSelect={setLocation}
      detectingLocation={detecting}
      loading={loading}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORTS.map((report) => (
          <div key={report.id} className="glass-panel rounded-2xl p-5 border border-eco-border">
            <h3 className="text-base font-semibold text-eco-text">{report.title}</h3>
            <p className="text-sm text-eco-muted mt-1">{report.description}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                type="button"
                disabled={!analysis}
                onClick={() => exportPdf(report.id, report.title)}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-eco-border bg-white hover:bg-eco-surface disabled:opacity-50"
              >
                <FileDown className="w-3.5 h-3.5" />
                Export report
              </button>
              <button
                type="button"
                disabled={!analysis}
                onClick={() => exportCsv(report.id)}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-eco-border bg-white hover:bg-eco-surface disabled:opacity-50"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                CSV export
              </button>
            </div>
          </div>
        ))}
      </div>

      {!analysis && !loading && (
        <p className="text-sm text-eco-muted">
          Search a location above to enable report generation.
        </p>
      )}
    </ModuleShell>
  );
}
