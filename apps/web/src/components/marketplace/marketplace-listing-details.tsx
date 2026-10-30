'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Share2,
  Heart,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import type { CropListing } from '@/data/marketplace-listings';
import { getListing } from '@/services/api/listings.api';
import { useProfileLocation, haversineKm } from '@/hooks/use-profile-location';
import { MarketplaceListingNotFound } from '@/components/marketplace/marketplace-listing-not-found';
import { MarketplaceListingSkeleton } from '@/components/marketplace/marketplace-listing-skeleton';
import { MarketplaceListingGallery } from '@/components/marketplace/marketplace-listing-gallery';
import { MarketplaceListingInfo } from '@/components/marketplace/marketplace-listing-info';
import { MarketplaceProductDetails } from '@/components/marketplace/marketplace-product-details';
import MarketplaceListingLocation from './marketplace-listing-location';
import { MarketplaceFarmerCard } from '@/components/marketplace/marketplace-farmer-card';
import { MarketplaceContactAction } from '@/components/marketplace/marketplace-contact-action';
import { MarketplaceRelatedListings } from '@/components/marketplace/marketplace-related-listings';
import { cn } from '@/utils/cn';
import { getLocalizedDomainName } from '@agri/domain-data';
import { useAuth } from '@/hooks/use-auth';

interface MarketplaceListingDetailsProps {
  id: string;
}

export function MarketplaceListingDetails({ id }: MarketplaceListingDetailsProps) {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const returnQuery = searchParams.get('from');
  const locale = (params?.locale as string) || 'en';
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const { latitude, longitude, available } = useProfileLocation();

  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [listing, setListing] = useState<CropListing | null>(null);

  // Listing details must match the database-backed marketplace feed.
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    void getListing(id)
      .then((response) => {
        if (mounted) setListing(response);
      })
      .catch(() => {
        if (mounted) setListing(null);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  // Distance computed from the user's saved profile location when available.
  const computedDistanceKm = useMemo(() => {
    if (!listing) return undefined;
    if (
      available &&
      typeof listing.lat === 'number' && Number.isFinite(listing.lat) &&
      typeof listing.lng === 'number' && Number.isFinite(listing.lng) &&
      typeof latitude === 'number' && Number.isFinite(latitude) &&
      typeof longitude === 'number' && Number.isFinite(longitude)
    ) {
      return Math.round(haversineKm(latitude, longitude, listing.lat, listing.lng));
    }
    return listing.distanceKm;
  }, [listing, available, latitude, longitude]);

  if (!isLoading && !listing) {
    return <MarketplaceListingNotFound />;
  }

  if (isLoading || !listing) {
    return <MarketplaceListingSkeleton />;
  }

  const cropLabel = listing.cropKey === 'other'
    ? t('dashboard.marketplaceBrowse.crop.other')
    : getLocalizedDomainName(listing.cropKey, locale, 'crop');

  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareTitle = `${cropLabel}${listing.farmerName ? ` - ${listing.farmerName}` : ''} | AgriConnect`;
    const location = [
      ...(isAuthenticated && listing.village ? [getLocalizedDomainName(listing.village, locale, 'village')] : []),
      ...(isAuthenticated && listing.taluka ? [getLocalizedDomainName(listing.taluka, locale, 'taluka')] : []),
      getLocalizedDomainName(listing.district, locale, 'district'),
    ].filter(Boolean).join(', ');
    const quantity = `${new Intl.NumberFormat(locale).format(listing.quantity)} ${getLocalizedDomainName(listing.unit, locale, 'unit')}`;
    const price = `${new Intl.NumberFormat(locale, { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(listing.price)} / ${getLocalizedDomainName(listing.primaryUnit, locale, 'unit')}`;
    const shareText = `${t('dashboard.marketplaceBrowse.detail.shareMessage', { crop: cropLabel, quantity, price })} ${t('dashboard.marketplaceBrowse.detail.shareLocation', { location })}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (error) {
        // User cancelled share or not supported, fallback to clipboard
        if ((error as Error).name === 'AbortError') return;
      }
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t('dashboard.marketplaceBrowse.detail.shareSuccess'));
    } catch {
      toast.error(t('dashboard.marketplaceBrowse.detail.shareError'));
    }
  };

  const handleToggleFavorite = () => {
    setIsFavorite((prev) => !prev);
  };

  return (
    <div className="space-y-4 pb-10">
      {/* Top Action Bar (Back button, breadcrumb, favorite, share) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        {/* Left: Back & Breadcrumb */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => router.push(`/${locale}/dashboard/marketplace${returnQuery ? `?${returnQuery}` : ''}`)}
            aria-label={t('dashboard.marketplaceBrowse.detail.backToMarketplace')}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border bg-surface-subtle px-3 text-xs font-semibold text-foreground backdrop-blur-xl transition-all duration-200 hover:bg-surface-subtle hover:text-foreground active:scale-95 focus-visible:outline-2 focus-visible:outline-focus"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">
              {t('dashboard.marketplaceBrowse.detail.backToMarketplace')}
            </span>
          </button>

          {/* Breadcrumb trail */}
          <nav aria-label={t('dashboard.marketplaceBrowse.detail.breadcrumb')} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="hidden md:inline">
              {t('dashboard.marketplaceBrowse.header.title')}
            </span>
            <ChevronRight className="hidden h-3.5 w-3.5 text-muted-foreground md:inline" aria-hidden="true" />
            <span className="font-semibold text-foreground truncate max-w-[140px] sm:max-w-none">
              {cropLabel}
            </span>
          </nav>
        </div>

        {/* Right: Favorite & Share Buttons */}
        <div className="flex items-center gap-2">
          {/* Favorite Toggle */}
          <button
            type="button"
            onClick={handleToggleFavorite}
            aria-label={
              isFavorite
                ? t('dashboard.marketplaceBrowse.detail.unfavorite')
                : t('dashboard.marketplaceBrowse.detail.favorite')
            }
            className={cn(
              'inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 active:scale-95 focus-visible:outline-2 focus-visible:outline-focus',
              isFavorite
                ? 'border-danger/30 bg-danger-soft text-danger'
                : 'border-border bg-surface-subtle text-muted-foreground hover:bg-surface-subtle hover:text-foreground',
            )}
          >
            <Heart
              className={cn('h-4 w-4 transition-transform', isFavorite && 'fill-current scale-110')}
              aria-hidden="true"
            />
          </button>

          {/* Share Action */}
          <button
            type="button"
            onClick={handleShare}
            aria-label={t('dashboard.marketplaceBrowse.detail.share')}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border bg-surface-subtle px-3.5 text-xs font-semibold text-foreground backdrop-blur-xl transition-all duration-200 hover:bg-surface-subtle hover:text-foreground active:scale-95 focus-visible:outline-2 focus-visible:outline-focus"
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t('dashboard.marketplaceBrowse.detail.share')}</span>
          </button>
        </div>
      </div>

      {/* Hero Section: Gallery (left) + Info Panel (right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Image Gallery (5 cols on desktop) */}
        <div className="lg:col-span-5">
          <MarketplaceListingGallery listing={listing} />
        </div>

        {/* Right Column: Listing Information (7 cols on desktop) */}
        <div className="lg:col-span-7">
          <MarketplaceListingInfo
            listing={listing}
            computedDistanceKm={computedDistanceKm}
            isAuthenticated={isAuthenticated}
            isAuthLoading={isAuthLoading}
          />
        </div>
      </div>

      {/* Structured Details: About Produce & Specifications */}
      <MarketplaceProductDetails listing={listing} />

      {/* Location & Farmer Information Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MarketplaceListingLocation
          listing={listing}
          computedDistanceKm={computedDistanceKm}
          isAuthenticated={isAuthenticated}
        />
        <MarketplaceFarmerCard listing={listing} isAuthenticated={isAuthenticated} isAuthLoading={isAuthLoading} />
      </div>

      {/* Related Listings: You May Also Like */}
      <MarketplaceRelatedListings currentListing={listing} isAuthenticated={isAuthenticated} isAuthLoading={isAuthLoading} />

      {/* Mobile Sticky Contact Bar */}
      <MarketplaceContactAction listing={listing} isAuthenticated={isAuthenticated} isAuthLoading={isAuthLoading} variant="mobile-sticky" />
    </div>
  );
}
