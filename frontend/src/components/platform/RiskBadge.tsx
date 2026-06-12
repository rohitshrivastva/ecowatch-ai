import clsx from "clsx";

const VARIANTS: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-800 border-emerald-200",
  good: "bg-cyan-100 text-cyan-800 border-cyan-200",
  moderate: "bg-amber-100 text-amber-900 border-amber-200",
  high: "bg-orange-100 text-orange-900 border-orange-200",
  critical: "bg-red-100 text-red-900 border-red-200",
  default: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function RiskBadge({
  label,
  variant = "default",
}: {
  label: string;
  variant?: keyof typeof VARIANTS;
}) {
  return (
    <span
      className={clsx(
        "inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wide",
        VARIANTS[variant] ?? VARIANTS.default
      )}
    >
      {label}
    </span>
  );
}
