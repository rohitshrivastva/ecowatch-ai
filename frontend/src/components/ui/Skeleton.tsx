import clsx from "clsx";

export function Skeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "animate-pulse rounded-lg bg-eco-surface-hover/80",
        className
      )}
    />
  );
}

export function HeroSkeleton() {
  return (
    <div className="hero-panel p-8 lg:p-10 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-12 w-24" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-20" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-16" />
        </div>
        <div className="space-y-2 sm:col-span-2 lg:col-span-1 lg:col-start-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </div>
  );
}

export function MapSkeleton() {
  return (
    <div className="glass-panel overflow-hidden">
      <Skeleton className="h-14 w-full rounded-none" />
      <Skeleton className="h-[320px] sm:h-[400px] lg:h-[480px] w-full rounded-none" />
    </div>
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="metric-card space-y-3">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

export function RecommendationSkeleton() {
  return (
    <div className="glass-panel p-6 space-y-4">
      <Skeleton className="h-6 w-48" />
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="glass-panel p-6">
      <Skeleton className="h-6 w-40 mb-4" />
      <Skeleton className="h-[200px] w-full" />
    </div>
  );
}
