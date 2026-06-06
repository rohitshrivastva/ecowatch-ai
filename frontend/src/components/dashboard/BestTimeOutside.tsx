"use client";

import { memo } from "react";
import {
  Clock,
  CloudRain,
  Umbrella,
  AlertTriangle,
  Footprints,
} from "lucide-react";
import clsx from "clsx";
import type { BestTimeOutside as BestTimeOutsideData } from "@/types/environment";

const statusStyles: Record<string, { border: string; text: string; bg: string }> = {
  Excellent: {
    border: "border-eco-primary/40",
    text: "text-eco-primary",
    bg: "bg-eco-primary/10",
  },
  Good: {
    border: "border-eco-primary/40",
    text: "text-eco-primary",
    bg: "bg-eco-primary/10",
  },
  Moderate: {
    border: "border-eco-warning/40",
    text: "text-eco-warning",
    bg: "bg-eco-warning/10",
  },
  Poor: {
    border: "border-orange-400/40",
    text: "text-orange-400",
    bg: "bg-orange-400/10",
  },
  Dangerous: {
    border: "border-eco-danger/40",
    text: "text-eco-danger",
    bg: "bg-eco-danger/10",
  },
};

function BestTimeOutsideCard({ data }: { data: BestTimeOutsideData }) {
  const style =
    statusStyles[data.environmental_status] ?? statusStyles.Moderate;

  return (
    <section className="glass-panel p-6 lg:p-8">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="w-5 h-5 text-eco-primary" />
        <h2 className="text-lg font-semibold text-eco-text">Best Time Outside</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <p className="text-xs font-medium text-eco-muted uppercase tracking-wider mb-1">
            Recommended window
          </p>
          <p className="text-2xl lg:text-3xl font-bold text-eco-text tabular-nums">
            {data.time_window}
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            <span
              className={clsx(
                "text-xs font-semibold px-2.5 py-1 rounded-full border",
                style.border,
                style.text,
                style.bg
              )}
            >
              {data.environmental_status}
            </span>
            {data.rain_probability_pct != null && (
              <span className="inline-flex items-center gap-1.5 text-xs text-eco-muted">
                <CloudRain className="w-3.5 h-3.5" />
                Rain {Math.round(data.rain_probability_pct)}%
              </span>
            )}
            {data.show_umbrella && (
              <span className="inline-flex items-center gap-1.5 text-xs text-eco-muted">
                <Umbrella className="w-3.5 h-3.5" />
                Umbrella suggested
              </span>
            )}
            {data.thunderstorm_alert && (
              <span className="inline-flex items-center gap-1.5 text-xs text-eco-danger">
                <AlertTriangle className="w-3.5 h-3.5" />
                Storm alert
              </span>
            )}
          </div>
        </div>

        {data.suggested_activities.length > 0 && (
          <div className="lg:min-w-[200px]">
            <p className="text-xs font-medium text-eco-muted uppercase tracking-wider mb-2 flex items-center gap-1">
              <Footprints className="w-3.5 h-3.5" />
              Suggested activities
            </p>
            <ul className="space-y-1.5">
              {data.suggested_activities.slice(0, 4).map((activity) => (
                <li key={activity} className="text-sm text-eco-text">
                  {activity}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-eco-border space-y-4">
        <div>
          <p className="text-xs font-medium text-eco-muted uppercase tracking-wider mb-1">
            Why
          </p>
          <p className="text-sm text-eco-text leading-relaxed">{data.why}</p>
        </div>

        {data.suggestions.length > 0 && (
          <div>
            <p className="text-xs font-medium text-eco-muted uppercase tracking-wider mb-2">
              Suggestions
            </p>
            <ul className="space-y-1.5">
              {data.suggestions.map((tip) => (
                <li
                  key={tip}
                  className="text-sm text-eco-muted flex items-start gap-2 before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-eco-accent before:mt-2 before:shrink-0"
                >
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.avoid_windows.length > 0 && (
          <div>
            <p className="text-xs font-medium text-eco-muted uppercase tracking-wider mb-2">
              Avoid
            </p>
            <ul className="space-y-1">
              {data.avoid_windows.map((window) => (
                <li key={window} className="text-sm text-eco-warning">
                  {window}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

export default memo(BestTimeOutsideCard);
