"use client";

import { useState } from "react";
import { Bot, Send } from "lucide-react";
import ModuleShell from "@/components/platform/ModuleShell";
import AIInsightCard from "@/components/platform/AIInsightCard";
import { useEnvironmentalAnalysis } from "@/hooks/useEnvironmentalAnalysis";
import { usePlatformLocation } from "@/hooks/usePlatformLocation";

const PRESET_QUESTIONS = [
  "Why is AQI high today?",
  "Is drought risk increasing?",
  "Which areas face water stress?",
  "How safe is it to exercise outdoors?",
];

function buildAnswer(
  question: string,
  analysis: ReturnType<typeof useEnvironmentalAnalysis>["analysis"]
): string {
  if (!analysis) {
    return "Select a location on the dashboard or search above to get location-specific answers.";
  }

  const q = question.toLowerCase();
  const air = analysis.air_pollution;
  const wc = analysis.water_crisis;
  const cr = analysis.climate_risk;
  const bto = analysis.best_time_outside;

  if (q.includes("aqi")) {
    return `AQI is ${air.aqi} (${air.aqi_label}) near ${analysis.location_name}. Primary driver: PM2.5 at ${air.pm25.toFixed(1)} µg/m³. ${analysis.recommendations?.[0]?.description ?? ""}`.trim();
  }
  if (q.includes("drought")) {
    return wc
      ? `Drought risk is ${wc.drought_risk} with ${wc.stress_level} water stress. ${wc.environmental_summary ?? ""}`.trim()
      : "Water crisis data is not available for this location.";
  }
  if (q.includes("water stress")) {
    return wc
      ? `Water stress level: ${wc.stress_level}. Rainfall deficit: ${wc.rainfall_deficit_pct != null ? `${Math.round(wc.rainfall_deficit_pct)}%` : "unknown"}. ${wc.recommendations?.[0] ?? ""}`.trim()
      : "Water stress data is not available for this location.";
  }
  if (q.includes("exercise") || q.includes("outdoor")) {
    return bto
      ? `${bto.environmental_status}. ${bto.why} Best window: ${bto.time_window}.`
      : "Outdoor activity guidance is not available for this location.";
  }
  if (cr) {
    return cr.summary ?? `Climate risk is ${cr.category} (${cr.score}/100), trend ${cr.trend}.`;
  }
  return analysis.water_crisis?.environmental_summary ?? "Ask about air, water, climate, or outdoor safety for this location.";
}

export default function AssistantPage() {
  const { location, setLocation, detecting } = usePlatformLocation();
  const { analysis, loading } = useEnvironmentalAnalysis(location);
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<{ q: string; a: string }[]>([]);

  const ask = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    const answer = buildAnswer(trimmed, analysis);
    setHistory((prev) => [...prev, { q: trimmed, a: answer }]);
    setQuestion("");
  };

  return (
    <ModuleShell
      title="AI Environmental Assistant"
      description="Ask about air quality, drought, water stress, climate risk, and outdoor safety. Built for future RAG and OpenAI integration."
      accent="border-violet-100 bg-gradient-to-br from-violet-50 via-white to-indigo-50/40"
      location={location}
      onLocationSelect={setLocation}
      detectingLocation={detecting}
      loading={loading}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel rounded-2xl p-4 flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask(question)}
              placeholder="Ask anything about your environment…"
              className="flex-1 text-sm px-3 py-2 rounded-lg border border-eco-border bg-white focus:outline-none focus:ring-2 focus:ring-eco-primary/30"
            />
            <button
              type="button"
              onClick={() => ask(question)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-eco-primary text-white text-sm font-medium hover:bg-eco-primary/90"
            >
              <Send className="w-4 h-4" />
              Ask
            </button>
          </div>

          {history.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 text-center text-sm text-eco-muted">
              <Bot className="w-10 h-10 text-violet-500 mx-auto mb-3" />
              Try a suggested question or type your own.
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div key={item.q + item.a} className="space-y-2">
                  <p className="text-sm font-medium text-eco-text">{item.q}</p>
                  <p className="text-sm text-eco-muted leading-relaxed glass-panel rounded-xl p-4">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-eco-muted">
            Suggested questions
          </p>
          {PRESET_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => ask(q)}
              className="w-full text-left text-sm px-4 py-3 rounded-xl border border-eco-border bg-white hover:border-eco-primary/40 hover:bg-eco-surface transition-colors"
            >
              {q}
            </button>
          ))}
          {analysis?.recommendations && analysis.recommendations.length > 0 && (
            <AIInsightCard
              title="Current insights"
              insights={analysis.recommendations.map((r) => r.description).slice(0, 3)}
            />
          )}
        </div>
      </div>
    </ModuleShell>
  );
}
