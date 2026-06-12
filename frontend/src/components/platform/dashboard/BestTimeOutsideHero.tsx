"use client";

import { Check, Clock } from "lucide-react";
import clsx from "clsx";
import type { BestTimeOutside } from "@/types/environment";

export default function BestTimeOutsideHero({
  data,
  reasons,
  loading,
}: {
  data: BestTimeOutside | null | undefined;
  reasons: string[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 animate-pulse h-44" />
    );
  }

  if (!data) {
    return (
      <section className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/30 p-6 text-sm text-eco-muted">
        Select a location to see the best time to go outside.
      </section>
    );
  }

  const isGood = ["Excellent", "Good"].includes(data.environmental_status);

  return (
    <section
      className={clsx(
        "rounded-2xl border p-6 lg:p-7 shadow-sm",
        isGood
          ? "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50/40"
          : "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50/30"
      )}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Best Time Outside</h2>
            <p className="text-xs text-slate-600">{data.environmental_status} conditions</p>
          </div>
        </div>
        <span
          className={clsx(
            "text-xs font-semibold px-2.5 py-1 rounded-full",
            isGood ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"
          )}
        >
          {data.environmental_status}
        </span>
      </div>

      <p className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight tabular-nums mb-4">
        {data.time_window}
      </p>

      <ul className="grid sm:grid-cols-2 gap-2">
        {(reasons.length ? reasons : [data.why]).slice(0, 4).map((reason) => (
          <li
            key={reason}
            className="flex items-start gap-2 text-sm text-slate-700"
          >
            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{reason}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
