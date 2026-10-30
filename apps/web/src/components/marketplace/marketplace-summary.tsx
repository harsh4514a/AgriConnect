'use client';

import { useTranslations } from 'next-intl';
import { Sprout, Building2 } from 'lucide-react';

interface MarketplaceSummaryProps {
    /** Total number of listings. */
    total: number;
    /** User's district (from saved profile), may be null. */
    district?: string | null;
}

/**
 * Compact summary chips shown above the listings grid.
 * Replaces the verbose "Showing N crops" line with scannable chips:
 *   🌾 16 Listings · 🏘 Rajkot District
 * Minimal height, mobile-first.
 */
export function MarketplaceSummary({ total, district }: MarketplaceSummaryProps) {
    const t = useTranslations();

    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {/* Total listings */}
            <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border bg-surface-subtle px-2.5 text-[11px] font-medium text-foreground">
                <Sprout className="h-3 w-3 text-accent" aria-hidden="true" />
                {total} {t('dashboard.marketplaceBrowse.ux.summaryListings')}
            </span>

            {/* District */}
            {district && (
                <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border bg-surface-subtle px-2.5 text-[11px] font-medium text-foreground">
                    <Building2 className="h-3 w-3 text-accent" aria-hidden="true" />
                    {district}
                </span>
            )}
        </div>
    );
}
