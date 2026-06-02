"use client";

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import type { AirPollutionMetrics, EnvironmentalIndicators } from "@/types/environment";

interface PollutionChartProps {
  pollution: AirPollutionMetrics;
}

export function PollutionChart({ pollution }: PollutionChartProps) {
  const data = [
    { name: "PM2.5", value: pollution.pm25, fill: "#10b981" },
    { name: "PM10", value: pollution.pm10, fill: "#06b6d4" },
    { name: "NO₂", value: pollution.no2, fill: "#8b5cf6" },
    { name: "CO", value: pollution.co / 10, fill: "#f59e0b" },
    { name: "O₃", value: pollution.ozone, fill: "#ef4444" },
  ];

  return (
    <div className="glass-panel p-6">
      <h3 className="text-lg font-semibold mb-4">Pollution Breakdown</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
          <YAxis stroke="#94a3b8" fontSize={12} />
          <Tooltip
            contentStyle={{
              background: "#111827",
              border: "1px solid #1e293b",
              borderRadius: "8px",
            }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-eco-muted mt-2">* CO values scaled ÷10 for visualization</p>
    </div>
  );
}

interface TrendChartProps {
  environmental: EnvironmentalIndicators;
}

export function TrendChart({ environmental }: TrendChartProps) {
  const base = environmental.ndvi;
  const data = Array.from({ length: 12 }, (_, i) => ({
    month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
    ndvi: +(base + (Math.sin(i * 0.5) * 0.08) + (i * 0.005)).toFixed(3),
    aqi: Math.round(80 + Math.cos(i * 0.7) * 30 + i * 2),
  }));

  return (
    <div className="glass-panel p-6">
      <h3 className="text-lg font-semibold mb-4">Historical Trends</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
          <YAxis stroke="#94a3b8" fontSize={12} />
          <Tooltip
            contentStyle={{
              background: "#111827",
              border: "1px solid #1e293b",
              borderRadius: "8px",
            }}
          />
          <Line
            type="monotone"
            dataKey="ndvi"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            name="NDVI"
          />
          <Line
            type="monotone"
            dataKey="aqi"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
            name="AQI"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
