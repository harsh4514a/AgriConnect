'use client';

import { useTranslations } from 'next-intl';
import { Sprout, MapPin, Building2 } from 'lucide-react';

interface MarketplaceSummaryProps {
    /** Total number of listings. */
    total: number;
    /** Number of nearby listings (within threshold). */
    nearby: number;
    /** User's district (from saved profile), may be null. */
    district?: string | null;
}

/**
 * Compact summary chips shown above the listings grid.
 * Replaces the verbose "Showing N crops" line with scannable chips:
 *   🌾 16 Listings · 📍 8 Nearby · 🏘 Rajkot District
 * Minimal height, mobile-first.
 */
export function MarketplaceSummary({ total, nearby, district }: MarketplaceSummaryProps) {
    const t = useTranslations();

    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {/* Total listings */}
            <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 text-[11px] font-medium text-white/75">
                <Sprout className="h-3 w-3 text-green-300" aria-hidden="true" />
                {total} {t('dashboard.marketplaceBrowse.ux.summaryListings')}
            </span>

            {/* Nearby listings */}
            {nearby > 0 && (
                <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-green-400/20 bg-green-500/10 px-2.5 text-[11px] font-medium text-green-200">
                    <MapPin className="h-3 w-3" aria-hidden="true" />
                    {nearby} {t('dashboard.marketplaceBrowse.ux.summaryNearby')}
                </span>
            )}

            {/* District */}
            {district && (
                <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 text-[11px] font-medium text-white/75">
                    <Building2 className="h-3 w-3 text-green-300" aria-hidden="true" />
                    {district}
                </span>
            )}
        </div>
    );
}
