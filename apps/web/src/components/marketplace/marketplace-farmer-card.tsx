'use client';

import { AdaptiveLink as Link } from '@/components/performance/adaptive-link';
import { useLocale, useTranslations } from 'next-intl';
import { Calendar, Package, ShieldCheck, UserCheck } from 'lucide-react';

import type { CropListing } from '@/data/marketplace-listings';

interface MarketplaceFarmerCardProps {
  listing: CropListing;
  isAuthenticated: boolean;
  isAuthLoading?: boolean;
}

export function MarketplaceFarmerCard({ listing, isAuthenticated, isAuthLoading = false }: MarketplaceFarmerCardProps) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <section className="flex h-full flex-col rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex items-center gap-2 text-foreground">
        <UserCheck className="h-5 w-5 text-accent" aria-hidden="true" />
        <h2 className="text-lg font-bold">{t('dashboard.marketplaceBrowse.detail.aboutFarmer')}</h2>
      </div>

      {isAuthenticated ? (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
              <UserCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              {listing.farmerName ? (
                <h3 className="truncate text-base font-semibold text-foreground">{listing.farmerName}</h3>
              ) : null}
              {listing.verified ? (
                <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-accent">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('dashboard.marketplaceBrowse.detail.verifiedSeller')}
                </p>
              ) : null}
            </div>
          </div>

          {listing.farmerMemberSince != null || listing.farmerListingCount != null ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {listing.farmerMemberSince != null ? (
                <p className="inline-flex items-center gap-1.5 rounded-lg bg-surface-subtle px-3 py-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  {t('dashboard.marketplaceBrowse.detail.memberSince', { year: listing.farmerMemberSince })}
                </p>
              ) : null}
              {listing.farmerListingCount != null ? (
                <p className="inline-flex items-center gap-1.5 rounded-lg bg-surface-subtle px-3 py-2 text-xs text-muted-foreground">
                  <Package className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  {t('dashboard.marketplaceBrowse.detail.activeListings', { count: listing.farmerListingCount })}
                </p>
              ) : null}
            </div>
          ) : null}
        </>
      ) : isAuthLoading ? (
        <div className="mt-5 h-11 animate-pulse rounded-xl bg-surface-subtle" aria-hidden="true" />
      ) : (
        <div className="mt-4">
          <p className="text-sm leading-6 text-muted-foreground">
            {t('dashboard.marketplaceBrowse.ux.signInToContact')}
          </p>
          <Link
            href={`/${locale}/auth`}
            prefetch={false}
            className="mt-3 inline-flex min-h-10 items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-focus"
          >
            {t('common.login')}
          </Link>
        </div>
      )}
    </section>
  );
}
