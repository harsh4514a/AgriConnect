'use client';

import type { CropListing } from '@/data/marketplace-listings';
import { MarketplaceCard } from '@/components/marketplace/marketplace-card';

interface MarketplaceGridProps {
    listings: CropListing[];
    isAuthenticated: boolean;
    isAuthLoading?: boolean;
}

/**
 * Responsive grid.
 * Mobile: 1 col, tablet: 2 cols, desktop: 4 cols (xl).
 */
export function MarketplaceGrid({ listings, isAuthenticated, isAuthLoading = false }: MarketplaceGridProps) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((listing, index) => (
                <MarketplaceCard
                    key={listing.id}
                    listing={listing}
                    index={index}
                    isAuthenticated={isAuthenticated}
                    isAuthLoading={isAuthLoading}
                />
            ))}
        </div>
    );
}
