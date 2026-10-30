export default function MarketPricesLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading market prices...">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 rounded-xl skeleton-shimmer" />
        <div className="h-4 w-96 max-w-full rounded-full skeleton-shimmer" />
        <div className="h-3 w-48 rounded-full skeleton-shimmer" />
      </div>

      {/* View Switcher Tabs Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="h-28 rounded-2xl border border-border bg-surface/[0.03] p-5 skeleton-shimmer" />
        <div className="h-28 rounded-2xl border border-border bg-surface/[0.03] p-5 skeleton-shimmer" />
      </div>

      {/* Filter / Search Bar Skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="h-11 flex-1 rounded-xl border border-border bg-surface/[0.03] skeleton-shimmer" />
        <div className="h-11 w-32 rounded-xl border border-border bg-surface/[0.03] skeleton-shimmer" />
      </div>

      {/* Cards Grid Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-44 rounded-2xl border border-border bg-surface/[0.03] p-5 skeleton-shimmer"
          />
        ))}
      </div>
    </div>
  );
}
