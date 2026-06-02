"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingDown, TrendingUp } from "lucide-react";
import { fetchTrends } from "@/lib/intelligence-api";
import type { HistoryPeriod, TrendMetric, TrendsResponse } from "@/types/intelligence";

const PERIODS: { id: HistoryPeriod; label: string }[] = [
  { id: "24h", label: "24h" },
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "1y", label: "1 year" },
];

const METRIC_LABELS: Record<string, string> = {
  aqi: "AQI",
  temperature: "Temperature",
  humidity: "Humidity",
  ndvi: "Vegetation (NDVI)",
  risk_score: "Environmental score",
};

function formatSeries(
  series: TrendsResponse["series"],
  key: string
): { label: string; value: number }[] {
  const points = series[key] || [];
  return points.map((p) => ({
    label: new Date(p.t).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: points.length > 48 ? undefined : "numeric",
    }),
    value: p.v,
  }));
}

function TrendCard({ metric }: { metric: TrendMetric }) {
  const up = metric.change_pct > 0;
  const label = METRIC_LABELS[metric.metric] || metric.metric;
  const isGoodDown =
    metric.metric === "aqi" ||
    metric.metric === "risk_score" ||
    metric.metric === "temperature";

  return (
    <div className="metric-card">
      <p className="text-xs text-eco-muted uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1">{metric.current}</p>
      <div className="flex items-center gap-1 mt-2 text-sm">
        {up ? (
          <TrendingUp className="w-4 h-4 text-eco-warning" />
        ) : (
          <TrendingDown className="w-4 h-4 text-eco-primary" />
        )}
        <span
          className={
            up
              ? isGoodDown
                ? "text-eco-warning"
                : "text-eco-primary"
              : isGoodDown
                ? "text-eco-primary"
                : "text-eco-warning"
          }
        >
          {metric.change_pct > 0 ? "+" : ""}
          {metric.change_pct}%
        </span>
      </div>
      {metric.anomaly && (
        <p className="text-xs text-eco-muted mt-2">{metric.anomaly}</p>
      )}
    </div>
  );
}

export default function HistoricalTrendsPanel({
  locationId,
}: {
  locationId: number | null | undefined;
}) {
  const [period, setPeriod] = useState<HistoryPeriod>("7d");
  const [data, setData] = useState<TrendsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!locationId) return;
    setLoading(true);
    setError(null);
    fetchTrends(locationId, period)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [locationId, period]);

  if (!locationId) {
    return (
      <div className="glass-panel p-6 text-sm text-eco-muted">
        Run an analysis to view historical environmental trends for this location.
      </div>
    );
  }

  const aqiSeries = data ? formatSeries(data.series, "aqi") : [];
  const tempSeries = data ? formatSeries(data.series, "temperature") : [];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">Historical Environmental Trends</h3>
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                period === p.id
                  ? "bg-eco-primary text-eco-bg"
                  : "bg-eco-surface-hover text-eco-muted hover:text-eco-text"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="glass-panel p-8 text-center text-eco-muted text-sm animate-pulse">
          Loading trend analytics…
        </div>
      )}

      {error && (
        <div className="glass-panel p-4 text-sm text-eco-danger border-eco-danger/40">
          {error}
        </div>
      )}

      {data && !loading && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {data.metrics.map((m) => (
              <TrendCard key={m.metric} metric={m} />
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="glass-panel p-6">
              <h4 className="text-sm font-medium text-eco-muted mb-4">AQI trend</h4>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={aqiSeries}>
                  <defs>
                    <linearGradient id="aqiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      background: "#111827",
                      border: "1px solid #1e293b",
                      borderRadius: 8,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#ef4444"
                    fill="url(#aqiGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-panel p-6">
              <h4 className="text-sm font-medium text-eco-muted mb-4">
                Temperature trend
              </h4>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={tempSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      background: "#111827",
                      border: "1px solid #1e293b",
                      borderRadius: 8,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
