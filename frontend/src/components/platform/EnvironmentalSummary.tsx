import { Sparkles } from "lucide-react";

export default function EnvironmentalSummary({
  text,
  title = "Environmental summary",
}: {
  text: string;
  title?: string;
}) {
  if (!text) return null;
  return (
    <div className="rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-50/80 to-white px-5 py-4">
      <div className="flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-violet-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-semibold text-violet-900 mb-1">{title}</p>
          <p className="text-sm text-slate-800 leading-relaxed">{text}</p>
        </div>
      </div>
    </div>
  );
}
