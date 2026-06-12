import { Sparkles } from "lucide-react";

export default function AIInsightCard({
  insights,
  title = "AI insights",
}: {
  insights: string[];
  title?: string;
}) {
  if (!insights.length) return null;
  return (
    <div className="glass-panel rounded-2xl p-5 border border-violet-200/40">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-violet-600" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <ul className="space-y-2">
        {insights.map((line) => (
          <li key={line} className="text-sm text-slate-700 leading-relaxed">
            · {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
