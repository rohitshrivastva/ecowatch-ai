import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import clsx from "clsx";

export default function ModuleOverviewCard({
  title,
  icon: Icon,
  accent,
  metrics,
  href,
  actionLabel,
}: {
  title: string;
  icon: LucideIcon;
  accent: string;
  metrics: { label: string; value: string }[];
  href: string;
  actionLabel: string;
}) {
  return (
    <Link
      href={href}
      className="group glass-panel rounded-2xl p-5 border hover:shadow-md transition-all h-full flex flex-col"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className={clsx("p-2.5 rounded-xl border", accent)}>
          <Icon className="w-5 h-5" />
        </div>
        <ArrowRight className="w-4 h-4 text-eco-muted group-hover:text-eco-primary group-hover:translate-x-0.5 transition-all" />
      </div>
      <h3 className="text-base font-semibold text-eco-text mb-3">{title}</h3>
      <dl className="space-y-2 flex-1">
        {metrics.map((m) => (
          <div key={m.label} className="flex justify-between gap-2 text-sm">
            <dt className="text-eco-muted">{m.label}</dt>
            <dd className="font-medium text-eco-text tabular-nums text-right">
              {m.value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-xs font-medium text-eco-primary mt-4 pt-3 border-t border-eco-border">
        {actionLabel} →
      </p>
    </Link>
  );
}
