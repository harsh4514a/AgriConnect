'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/utils/cn';

/**
 * Skeleton loader for the marketplace — shown while "loading".
 * Covers the search bar, the quick chip row, and the card grid
 * using a subtle shimmer animation matched to the layout.
 */
export function MarketplaceSkeleton() {
    const t = useTranslations();

    return (
        <div
            role="status"
            aria-label={t('dashboard.marketplaceBrowse.skeleton.ariaLabel')}
            className="space-y-4"
        >
            {/* Search bar skeleton */}
            <div className="h-14 w-full rounded-2xl skeleton-shimmer" />

            {/* Quick chips row skeleton */}
            <div className="flex gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            'h-11 shrink-0 rounded-full skeleton-shimmer',
                            i === 0 ? 'w-24' : 'w-20',
                        )}
                    />
                ))}
            </div>

            {/* Action row skeleton */}
            <div className="flex gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-12 flex-1 rounded-full skeleton-shimmer" />
                ))}
            </div>

            {/* Cards grid skeleton */}
            <div className="grid grid-cols-1 gap-4 pt-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                    <div
                        key={index}
                        className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
                    >
                        {/* Image placeholder */}
                        <div className="aspect-[16/10] skeleton-shimmer" />
                        {/* Content */}
                        <div className="space-y-3 p-4">
                            <div className="h-4 w-3/4 rounded-full skeleton-shimmer" />
                            <div className="h-3 w-1/2 rounded-full skeleton-shimmer" />
                            <div className="h-3 w-2/3 rounded-full skeleton-shimmer" />
                            <div className="flex items-center justify-between pt-2">
                                <div className="h-5 w-1/3 rounded-full skeleton-shimmer" />
                                <div className="h-8 w-24 rounded-full skeleton-shimmer" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
