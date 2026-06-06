"use client";

import { memo } from "react";
import {
  Clock,
  CloudRain,
  Umbrella,
  AlertTriangle,
  Footprints,
  Ban,
  Wind,
} from "lucide-react";
import clsx from "clsx";
import { useLocalRegionTime } from "@/hooks/useLocalRegionTime";
import type {
  BestTimeOutside as BestTimeOutsideData,
  ForecastTimelineSlot,
} from "@/types/environment";

const HERO_BY_STATUS: Record<
  string,
  { card: string; badge: string; text: string }
> = {
  Excellent: {
    card: "bg-emerald-100/90 border-emerald-200",
    badge: "bg-emerald-600 text-white",
    text: "text-emerald-800",
  },
  Good: {
    card: "bg-emerald-100/90 border-emerald-200",
    badge: "bg-emerald-600 text-white",
    text: "text-emerald-800",
  },
  Moderate: {
    card: "bg-amber-100/90 border-amber-200",
    badge: "bg-amber-600 text-white",
    text: "text-amber-900",
  },
  Poor: {
    card: "bg-orange-100/90 border-orange-200",
    badge: "bg-orange-600 text-white",
    text: "text-orange-900",
  },
  Dangerous: {
    card: "bg-red-100/90 border-red-200",
    badge: "bg-red-600 text-white",
    text: "text-red-900",
  },
};

const TIMELINE_BAR: Record<ForecastTimelineSlot["kind"], string> = {
  best: "bg-emerald-500 ring-2 ring-emerald-600 ring-offset-1",
  good: "bg-emerald-300",
  moderate: "bg-amber-400",
  poor: "bg-orange-400",
  avoid: "bg-red-400",
};

function parseAvoidEntry(entry: string) {
  const parts = entry.split(" · ");
  return {
    time: parts[0]?.trim() ?? entry,
    condition: parts.slice(1).join(" · ").trim() || null,
  };
}

function ForecastTimeline({ slots }: { slots: ForecastTimelineSlot[] }) {
  if (slots.length === 0) return null;

  return (
    <div className="mt-5">
      <p className="text-sm font-medium text-slate-600 mb-2">Today&apos;s forecast</p>
      <div className="flex gap-1 items-end h-10">
        {slots.map((slot, i) => (
          <div key={`${slot.label}-${i}`} className="flex-1 min-w-0 flex flex-col items-center gap-1">
            <div
              className={clsx(
                "w-full rounded-sm transition-all",
                slot.kind === "best" ? "h-10" : "h-7",
                TIMELINE_BAR[slot.kind] ?? TIMELINE_BAR.good
              )}
              title={`${slot.label}: ${slot.pop_pct}% rain`}
            />
            <span className="text-[10px] text-slate-500 tabular-nums truncate w-full text-center">
              {slot.label.replace(" ", "\u00a0")}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-2 text-[10px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-emerald-500" /> Best
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-red-400" /> Avoid
        </span>
      </div>
    </div>
  );
}

function BestTimeOutsideCard({ data }: { data: BestTimeOutsideData }) {
  const hero =
    HERO_BY_STATUS[data.environmental_status] ?? HERO_BY_STATUS.Moderate;
  const liveLocalTime = useLocalRegionTime(data.timezone_offset_seconds);
  const displayLocalTime = liveLocalTime ?? data.local_time;
  const timeline = data.timeline ?? [];
  const avoidEntries = data.avoid_windows.map(parseAvoidEntry);

  return (
    <section className="glass-panel p-6 lg:p-8 rounded-2xl">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-slate-900">Best Time Outside</h2>
        </div>
        {displayLocalTime && (
          <p className="text-sm text-slate-600 tabular-nums">
            <span className="font-semibold text-slate-900">{displayLocalTime}</span>
            {data.timezone_label && (
              <span className="text-slate-500"> · {data.timezone_label}</span>
            )}
          </p>
        )}
      </div>

      <div
        className={clsx(
          "rounded-3xl border px-6 py-5 shadow-sm",
          hero.card
        )}
      >
        <p className="text-3xl lg:text-4xl font-light tabular-nums text-slate-900 leading-tight">
          {data.time_window}
        </p>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span
            className={clsx(
              "text-xs font-semibold px-3 py-1 rounded-full",
              hero.badge
            )}
          >
            {data.environmental_status}
          </span>
          {data.rain_probability_pct != null && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-white/70 text-slate-700 border border-white/80">
              <CloudRain className="w-3.5 h-3.5" />
              Rain {Math.round(data.rain_probability_pct)}%
            </span>
          )}
          {data.wind_speed != null && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-white/70 text-slate-700 border border-white/80">
              <Wind className="w-3.5 h-3.5" />
              Wind {data.wind_speed} m/s
            </span>
          )}
          {data.show_umbrella && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-white/70 text-slate-700 border border-white/80">
              <Umbrella className="w-3.5 h-3.5" />
              Bring umbrella
            </span>
          )}
          {data.thunderstorm_alert && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-red-600/10 text-red-700 border border-red-200">
              <AlertTriangle className="w-3.5 h-3.5" />
              Storm alert
            </span>
          )}
        </div>

        <p className={clsx("text-sm mt-4 leading-relaxed", hero.text)}>
          {data.why}
        </p>

        {timeline.length > 0 && <ForecastTimeline slots={timeline} />}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mt-5">
        {data.suggested_activities.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
              <Footprints className="w-4 h-4 text-emerald-600" />
              Go for
            </p>
            <ul className="space-y-1">
              {data.suggested_activities.slice(0, 3).map((activity) => (
                <li key={activity} className="text-sm text-slate-700">
                  {activity}
                </li>
              ))}
            </ul>
          </div>
        )}

        {avoidEntries.length > 0 && (
          <div className="rounded-xl border border-orange-200 bg-orange-50/60 p-4">
            <p className="text-sm font-medium text-orange-900 mb-2 flex items-center gap-1.5">
              <Ban className="w-4 h-4" />
              Avoid
            </p>
            <ul className="space-y-2">
              {avoidEntries.map(({ time, condition }) => (
                <li key={time + (condition ?? "")}>
                  <p className="text-sm font-medium text-orange-900 tabular-nums">
                    {time}
                  </p>
                  {condition && (
                    <p className="text-xs text-orange-700/90 capitalize">
                      {condition}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {data.suggestions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <ul className="flex flex-wrap gap-x-6 gap-y-1">
            {data.suggestions.slice(0, 2).map((tip) => (
              <li key={tip} className="text-sm text-slate-600">
                · {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export default memo(BestTimeOutsideCard);
