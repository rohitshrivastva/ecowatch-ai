import { memo } from "react";
import clsx from "clsx";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  status?: "good" | "moderate" | "warning" | "danger";
  subtitle?: string;
  delay?: number;
}

const statusColors = {
  good: "text-eco-primary border-eco-primary/30",
  moderate: "text-eco-warning border-eco-warning/30",
  warning: "text-orange-400 border-orange-400/30",
  danger: "text-eco-danger border-eco-danger/30",
};

function MetricCard({
  title,
  value,
  unit,
  icon: Icon,
  status = "good",
  subtitle,
  delay = 0,
}: MetricCardProps) {
  return (
    <div
      className={clsx(
        "metric-card animate-fade-in-up opacity-0",
        statusColors[status]
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm text-eco-muted font-medium">{title}</span>
        <div className="p-2 rounded-lg bg-eco-surface-hover">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-eco-text">{value}</span>
        {unit && <span className="text-sm text-eco-muted">{unit}</span>}
      </div>
      {subtitle && (
        <p className="text-xs text-eco-muted mt-1">{subtitle}</p>
      )}
    </div>
  );
}

export default memo(MetricCard);
