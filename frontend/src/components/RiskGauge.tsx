"use client";

import clsx from "clsx";
import type { RiskScore } from "@/types/environment";

interface RiskGaugeProps {
  risk: RiskScore;
}

export default function RiskGauge({ risk }: RiskGaugeProps) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (risk.score / 100) * circumference;

  const levelColor =
    risk.score <= 30
      ? "text-eco-primary"
      : risk.score <= 60
      ? "text-eco-warning"
      : "text-eco-danger";

  const strokeColor =
    risk.score <= 30
      ? "#10b981"
      : risk.score <= 60
      ? "#f59e0b"
      : "#ef4444";

  return (
    <div className="glass-panel p-6 flex flex-col items-center">
      <h3 className="text-sm font-medium text-eco-muted mb-4">
        Environmental Risk Score
      </h3>
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={strokeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={clsx("text-3xl font-bold", levelColor)}>
            {risk.score}
          </span>
          <span className="text-xs text-eco-muted">/ 100</span>
        </div>
      </div>
      <p className={clsx("mt-3 text-lg font-semibold", levelColor)}>
        {risk.level}
      </p>
      <div className="mt-4 w-full space-y-2">
        {Object.entries(risk.factors).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between text-xs">
            <span className="text-eco-muted capitalize">
              {key.replace(/_/g, " ")}
            </span>
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 bg-eco-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-eco-primary transition-all duration-700"
                  style={{ width: `${Math.min(value, 100)}%` }}
                />
              </div>
              <span className="text-eco-text w-8 text-right">{value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
