import Link from "next/link";
import { ArrowRight } from "lucide-react";
import clsx from "clsx";
import type { RiskCardData } from "@/lib/dashboard-intelligence";

const TONE_STYLES: Record<
  RiskCardData["tone"],
  { border: string; badge: string; text: string }
> = {
  good: {
    border: "border-emerald-200/80 hover:border-emerald-300",
    badge: "bg-emerald-100 text-emerald-800",
    text: "text-emerald-700",
  },
  moderate: {
    border: "border-amber-200/80 hover:border-amber-300",
    badge: "bg-amber-100 text-amber-900",
    text: "text-amber-800",
  },
  warning: {
    border: "border-orange-200/80 hover:border-orange-300",
    badge: "bg-orange-100 text-orange-900",
    text: "text-orange-800",
  },
  critical: {
    border: "border-red-200/80 hover:border-red-300",
    badge: "bg-red-100 text-red-900",
    text: "text-red-800",
  },
};

export default function EnvironmentalRiskGrid({
  cards,
  loading,
}: {
  cards: RiskCardData[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-panel rounded-xl h-36 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      {cards.map((card) => {
        const style = TONE_STYLES[card.tone];
        return (
          <Link
            key={card.title}
            href={card.href}
            className={clsx(
              "group glass-panel rounded-xl p-4 border transition-all hover:shadow-md",
              style.border
            )}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-sm font-semibold text-eco-text">{card.title}</h3>
              <ArrowRight className="w-3.5 h-3.5 text-eco-muted group-hover:text-eco-primary shrink-0" />
            </div>
            <span
              className={clsx(
                "inline-block text-[10px] font-bold tracking-wide px-2 py-0.5 rounded",
                style.badge
              )}
            >
              {card.status}
            </span>
            <p className={clsx("text-sm font-semibold mt-2 tabular-nums", style.text)}>
              {card.level}
            </p>
            <p className="text-xs text-eco-muted mt-2 leading-relaxed line-clamp-2">
              {card.recommendation}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
