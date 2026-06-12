import { Check, Sparkles } from "lucide-react";
import type { EnvironmentalOutlookData } from "@/lib/dashboard-intelligence";

export default function EnvironmentalOutlook({
  outlook,
  loading,
}: {
  outlook: EnvironmentalOutlookData | null;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-5 animate-pulse h-36 border border-violet-100" />
    );
  }

  if (!outlook) return null;

  return (
    <section className="glass-panel rounded-2xl p-5 lg:p-6 border border-violet-100/80 bg-gradient-to-br from-violet-50/40 via-white to-white">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-violet-600" />
        <h2 className="text-base font-semibold text-eco-text">Environmental Outlook</h2>
      </div>
      <ul className="space-y-2 mb-4">
        {outlook.bullets.map((line) => (
          <li key={line} className="flex items-start gap-2 text-sm text-slate-700">
            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            {line}
          </li>
        ))}
      </ul>
      <div className="rounded-xl bg-violet-50/80 border border-violet-100 px-4 py-3">
        <p className="text-xs font-semibold text-violet-800 uppercase tracking-wide mb-1">
          Recommendation
        </p>
        <p className="text-sm text-slate-800 leading-relaxed">{outlook.recommendation}</p>
      </div>
    </section>
  );
}
