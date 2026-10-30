export default function DashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard...">
      {/* Welcome Banner Skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-32 rounded-full skeleton-shimmer" />
        <div className="h-8 w-64 rounded-xl skeleton-shimmer" />
        <div className="h-4 w-48 rounded-full skeleton-shimmer" />
      </div>

      {/* Primary Actions Skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-2xl border border-border bg-surface/[0.03] p-4 skeleton-shimmer"
          />
        ))}
      </div>

      {/* Statistics Cards Skeleton */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl border border-border bg-surface/[0.03] p-4 skeleton-shimmer"
          />
        ))}
      </div>

      {/* Quick Access Bar Skeleton */}
      <div className="h-14 w-full rounded-2xl border border-border bg-surface/[0.03] skeleton-shimmer" />

      {/* Widgets Grid Skeleton */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-64 rounded-2xl border border-border bg-surface/[0.03] p-5 skeleton-shimmer"
          />
        ))}
      </div>
    </div>
  );
}
