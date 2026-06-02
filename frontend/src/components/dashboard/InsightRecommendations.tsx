"use client";

import { memo, useState } from "react";
import { Lightbulb } from "lucide-react";
import clsx from "clsx";
import type { EnvironmentalAnalysis, Recommendation } from "@/types/environment";
import { formatRiskLevel, sortRecommendations } from "@/lib/insights";
import { RecommendationSkeleton } from "@/components/ui/Skeleton";

const priorityStyles: Record<string, string> = {
  critical: "border-eco-danger/40 bg-eco-danger/5",
  high: "border-orange-400/40 bg-orange-400/5",
  medium: "border-eco-warning/40 bg-eco-warning/5",
  low: "border-eco-primary/40 bg-eco-primary/5",
};

const InsightCard = memo(function InsightCard({
  rec,
  riskLevel,
}: {
  rec: Recommendation;
  riskLevel: string;
}) {
  const actions = rec.actions.slice(0, 3);
  const style = priorityStyles[rec.priority] ?? priorityStyles.medium;

  return (
    <article className={clsx("border rounded-xl p-5", style)}>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-eco-muted">
          Environmental Risk
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-eco-surface-hover text-eco-text capitalize">
          {rec.priority}
        </span>
        <span className="text-xs text-eco-muted">· {formatRiskLevel(riskLevel)}</span>
      </div>
      <h4 className="font-semibold text-eco-text mb-2">{rec.title}</h4>
      <div className="mb-3">
        <p className="text-xs font-medium text-eco-muted uppercase tracking-wider mb-1">
          Why This Matters
        </p>
        <p className="text-sm text-eco-muted line-clamp-3">{rec.description}</p>
      </div>
      {actions.length > 0 && (
        <div>
          <p className="text-xs font-medium text-eco-muted uppercase tracking-wider mb-2">
            Suggested Actions
          </p>
          <ul className="space-y-1.5">
            {actions.map((action, j) => (
              <li
                key={j}
                className="text-sm text-eco-text flex items-start gap-2 before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-eco-primary before:mt-2 before:shrink-0"
              >
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
});

function InsightRecommendations({
  analysis,
  loading,
}: {
  analysis: EnvironmentalAnalysis | null;
  loading: boolean;
}) {
  const [showAll, setShowAll] = useState(false);

  if (loading && !analysis) {
    return <RecommendationSkeleton />;
  }

  if (!analysis?.recommendations.length) return null;

  const sorted = sortRecommendations(analysis.recommendations);
  const visible = showAll ? sorted : sorted.slice(0, 3);

  return (
    <section className="glass-panel p-6 lg:p-8">
      <div className="flex items-center gap-2 mb-6">
        <Lightbulb className="w-5 h-5 text-eco-accent" />
        <h2 className="text-lg font-semibold text-eco-text">AI Recommendations</h2>
      </div>
      <div className="space-y-4">
        {visible.map((rec, i) => (
          <InsightCard
            key={`${rec.title}-${i}`}
            rec={rec}
            riskLevel={analysis.risk.level}
          />
        ))}
      </div>
      {sorted.length > 3 && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-4 text-sm text-eco-primary hover:text-eco-secondary transition-colors"
        >
          {showAll ? "Show fewer" : `View all ${sorted.length} recommendations`}
        </button>
      )}
    </section>
  );
}

export default memo(InsightRecommendations);
