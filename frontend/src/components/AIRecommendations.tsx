"use client";

import type { Recommendation } from "@/types/environment";
import { Lightbulb, AlertTriangle, Info, AlertCircle } from "lucide-react";
import clsx from "clsx";

interface AIRecommendationsProps {
  recommendations: Recommendation[];
}

const priorityConfig = {
  critical: { icon: AlertCircle, color: "border-eco-danger/50 bg-eco-danger/5" },
  high: { icon: AlertTriangle, color: "border-orange-400/50 bg-orange-400/5" },
  medium: { icon: Info, color: "border-eco-warning/50 bg-eco-warning/5" },
  low: { icon: Lightbulb, color: "border-eco-primary/50 bg-eco-primary/5" },
};

export default function AIRecommendations({ recommendations }: AIRecommendationsProps) {
  return (
    <div className="glass-panel p-6">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-eco-accent" />
        <h3 className="text-lg font-semibold">AI Recommendations</h3>
      </div>
      <div className="space-y-4">
        {recommendations.map((rec, i) => {
          const config = priorityConfig[rec.priority as keyof typeof priorityConfig]
            || priorityConfig.medium;
          const Icon = config.icon;

          return (
            <div
              key={i}
              className={clsx(
                "border rounded-lg p-4 animate-fade-in-up opacity-0",
                config.color
              )}
              style={{
                animationDelay: `${i * 100}ms`,
                animationFillMode: "forwards",
              }}
            >
              <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 mt-0.5 shrink-0" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-eco-text">{rec.title}</h4>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-eco-surface-hover text-eco-muted capitalize">
                      {rec.category.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-sm text-eco-muted mb-3">{rec.description}</p>
                  <ul className="space-y-1">
                    {rec.actions.map((action, j) => (
                      <li key={j} className="text-xs text-eco-text flex items-start gap-2">
                        <span className="text-eco-primary mt-0.5">→</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
