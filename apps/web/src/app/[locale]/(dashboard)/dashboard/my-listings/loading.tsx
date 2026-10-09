export default function MyListingsLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading your listings...">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-5">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-xl skeleton-shimmer" />
          <div className="h-4 w-72 rounded-full skeleton-shimmer" />
        </div>
        <div className="h-11 w-36 rounded-xl skeleton-shimmer" />
      </div>

      {/* Stats Summary Row Skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-2xl border border-white/10 bg-white/[0.03] p-4 skeleton-shimmer"
          />
        ))}
      </div>

      {/* Tabs & Search Toolbar Skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="h-12 w-64 rounded-2xl border border-white/10 bg-white/[0.03] skeleton-shimmer" />
        <div className="h-10 w-full sm:w-64 rounded-xl border border-white/10 bg-white/[0.03] skeleton-shimmer" />
      </div>

      {/* Cards Grid Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
          >
            <div className="aspect-[16/10] skeleton-shimmer" />
            <div className="space-y-3 p-4">
              <div className="h-4 w-3/4 rounded-full skeleton-shimmer" />
              <div className="h-3 w-1/2 rounded-full skeleton-shimmer" />
              <div className="flex items-center justify-between pt-2">
                <div className="h-5 w-1/3 rounded-full skeleton-shimmer" />
                <div className="h-8 w-20 rounded-lg skeleton-shimmer" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
