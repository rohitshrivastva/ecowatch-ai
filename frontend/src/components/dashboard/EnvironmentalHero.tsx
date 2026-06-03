"use client";

import { memo } from "react";
import { Wind, Thermometer, Sparkles } from "lucide-react";
import clsx from "clsx";
import type { EnvironmentalAnalysis } from "@/types/environment";
import { buildInsightSummary, formatRiskLevel } from "@/lib/insights";
import EnvironmentalLoading from "@/components/dashboard/EnvironmentalLoading";
import { HeroSkeleton } from "@/components/ui/Skeleton";

interface EnvironmentalHeroProps {
  analysis: EnvironmentalAnalysis | null;
  loading: boolean;
  locationLabel?: string;
}

function riskTone(level: string): string {
  const l = level.toLowerCase();
  if (l.includes("critical") || l.includes("high")) return "text-eco-danger";
  if (l.includes("moderate")) return "text-eco-warning";
  return "text-eco-primary";
}

function EnvironmentalHero({
  analysis,
  loading,
  locationLabel,
}: EnvironmentalHeroProps) {
  if (loading && !analysis) {
    return (
      <div className="space-y-4">
        <HeroSkeleton />
        <EnvironmentalLoading compact />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="hero-panel p-8 lg:p-10 text-center">
        <p className="text-eco-muted text-sm max-w-lg mx-auto">
          Select a location on the map to see your environmental health overview
          and AI recommendations.
        </p>
      </div>
    );
  }

  const insight = buildInsightSummary(analysis);
  const riskLabel = formatRiskLevel(analysis.risk.level);

  return (
    <section className="hero-panel p-8 lg:p-10 animate-fade-in-up">
      {locationLabel && (
        <p className="text-xs text-eco-muted uppercase tracking-wider mb-4 truncate">
          {locationLabel}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <p className="text-xs font-medium text-eco-muted uppercase tracking-wider mb-2">
            Environmental Score
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl lg:text-5xl font-bold text-eco-text tabular-nums">
              {analysis.risk.score}
            </span>
            <span className="text-xl text-eco-muted">/100</span>
          </div>
          <p className={clsx("text-sm font-semibold mt-2", riskTone(analysis.risk.level))}>
            {riskLabel} Environmental Risk
          </p>
        </div>

        <div>
          <p className="text-xs font-medium text-eco-muted uppercase tracking-wider mb-2 flex items-center gap-1">
            <Thermometer className="w-3.5 h-3.5" />
            Temperature
          </p>
          <p className="text-3xl lg:text-4xl font-bold text-eco-text">
            {Math.round(analysis.weather.temperature)}°C
          </p>
          <p className="text-xs text-eco-muted mt-1">
            Feels like {Math.round(analysis.weather.feels_like)}°C
          </p>
        </div>

        <div>
          <p className="text-xs font-medium text-eco-muted uppercase tracking-wider mb-2 flex items-center gap-1">
            <Wind className="w-3.5 h-3.5" />
            Air Quality
          </p>
          <p className="text-3xl lg:text-4xl font-bold text-eco-text">
            AQI {analysis.air_pollution.aqi}
          </p>
          <p className="text-xs text-eco-muted mt-1 capitalize">
            {analysis.air_pollution.aqi_label}
          </p>
        </div>

        <div className="sm:col-span-2 lg:col-span-1">
          <p className="text-xs font-medium text-eco-muted uppercase tracking-wider mb-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-eco-accent" />
            AI Insight
          </p>
          <p className="text-sm text-eco-text leading-relaxed">{insight}</p>
        </div>
      </div>
      {loading && (
        <div className="mt-4 pt-4 border-t border-eco-border/50">
          <EnvironmentalLoading compact />
        </div>
      )}
    </section>
  );
}

export default memo(EnvironmentalHero);
