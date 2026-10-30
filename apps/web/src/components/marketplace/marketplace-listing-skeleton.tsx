'use client';

import { useTranslations } from 'next-intl';

/**
 * Skeleton loader for the crop listing details page.
 * Mirrors the details page layout: top bar, 2-col hero (image + info),
 * produce details, location, farmer card, and related listings.
 */
export function MarketplaceListingSkeleton() {
  const t = useTranslations();

  return (
    <div
      role="status"
      aria-label={t('dashboard.marketplaceBrowse.detail.skeletonAriaLabel')}
      className="space-y-6"
    >
      {/* Top action bar skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-10 w-44 rounded-xl skeleton-shimmer" />
        <div className="flex gap-2">
          <div className="h-10 w-10 rounded-xl skeleton-shimmer" />
          <div className="h-10 w-10 rounded-xl skeleton-shimmer" />
        </div>
      </div>

      {/* Hero section: 2 columns on desktop, 1 on mobile */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Gallery skeleton (5 cols lg) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="aspect-[4/3] w-full rounded-2xl border border-border bg-surface-subtle skeleton-shimmer" />
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-16 w-16 rounded-xl border border-border bg-surface-subtle skeleton-shimmer"
              />
            ))}
          </div>
        </div>

        {/* Right: Listing info skeleton (7 cols lg) */}
        <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-border bg-surface-subtle p-6 backdrop-blur-xl space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-5 w-28 rounded-full skeleton-shimmer" />
              <div className="h-5 w-24 rounded-full skeleton-shimmer" />
            </div>
            <div className="h-8 w-3/4 rounded-xl skeleton-shimmer" />
            <div className="h-10 w-48 rounded-xl skeleton-shimmer" />
            <div className="h-4 w-36 rounded-full skeleton-shimmer" />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-surface-subtle skeleton-shimmer" />
            ))}
          </div>

          <div className="space-y-2 pt-2">
            <div className="h-4 w-1/2 rounded-full skeleton-shimmer" />
            <div className="h-4 w-2/3 rounded-full skeleton-shimmer" />
          </div>

          <div className="h-12 w-full rounded-xl skeleton-shimmer" />
        </div>
      </div>

      {/* Structured details & description grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Description skeleton */}
        <div className="rounded-2xl border border-border bg-surface-subtle p-6 backdrop-blur-xl space-y-3">
          <div className="h-5 w-40 rounded-full skeleton-shimmer" />
          <div className="h-4 w-full rounded-full skeleton-shimmer" />
          <div className="h-4 w-5/6 rounded-full skeleton-shimmer" />
          <div className="h-4 w-4/6 rounded-full skeleton-shimmer" />
        </div>

        {/* Product details skeleton */}
        <div className="rounded-2xl border border-border bg-surface-subtle p-6 backdrop-blur-xl space-y-3">
          <div className="h-5 w-36 rounded-full skeleton-shimmer" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-surface-subtle skeleton-shimmer" />
            ))}
          </div>
        </div>
      </div>

      {/* Location & Farmer grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface-subtle p-6 backdrop-blur-xl space-y-3">
          <div className="h-5 w-36 rounded-full skeleton-shimmer" />
          <div className="h-14 rounded-xl bg-surface-subtle skeleton-shimmer" />
        </div>

        <div className="rounded-2xl border border-border bg-surface-subtle p-6 backdrop-blur-xl space-y-3">
          <div className="h-5 w-36 rounded-full skeleton-shimmer" />
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full skeleton-shimmer" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-1/2 rounded-full skeleton-shimmer" />
              <div className="h-3 w-1/3 rounded-full skeleton-shimmer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
