import clsx from "clsx";
import type { LucideIcon } from "lucide-react";

export default function InsightPanel({
  icon: Icon,
  title,
  description,
  children,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("glass-panel rounded-2xl p-6", className)}>
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="w-5 h-5 text-eco-primary" />}
        <h2 className="text-lg font-semibold text-eco-text">{title}</h2>
      </div>
      {description && (
        <p className="text-sm text-eco-muted mb-5">{description}</p>
      )}
      {!description && <div className="mb-5" />}
      {children}
    </section>
  );
}
