'use client';

export function TransportSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-2xl border border-border bg-surface-subtle p-5"
        >
          <div className="h-5 w-2/3 rounded bg-surface-subtle" />
          <div className="mt-3 h-4 w-1/3 rounded bg-surface-subtle" />
          <div className="mt-5 space-y-3">
            <div className="h-4 w-4/5 rounded bg-surface-subtle" />
            <div className="h-4 w-3/5 rounded bg-surface-subtle" />
            <div className="h-4 w-full rounded bg-surface-subtle" />
          </div>
          <div className="mt-5 h-11 w-full rounded-xl bg-surface-subtle" />
        </div>
      ))}
    </div>
  );
}
