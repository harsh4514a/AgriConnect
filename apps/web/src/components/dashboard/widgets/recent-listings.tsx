'use client';

import { Package, ArrowRight, PlusCircle, MapPin } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { DashboardDataState } from '@/hooks/use-dashboard-data';
import type { RecentListingPreview } from '@/services/api/listings.api';
import { getLocalizedDomainName } from '@agri/domain-data';
import { OptimizedListingImage } from '@/components/marketplace/optimized-listing-image';

export function RecentListings({ state, retry }: { state: DashboardDataState<RecentListingPreview[]>; retry: () => void }) {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const listings = state.data.slice(0, 3);

  return (
    <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{t('dashboard.widgets.recentListings.title')}</h3>
        <button type="button" onClick={() => router.push(`/${locale}/dashboard/my-listings`)} className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded px-1 text-xs font-medium text-accent hover:text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          {t('dashboard.widgets.viewAll')} <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {state.isLoading ? (
        <div className="divide-y divide-border" aria-busy="true">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex items-center gap-3 py-2.5">
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-surface-subtle" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="h-3 w-2/3 animate-pulse rounded bg-surface-subtle" />
                <div className="h-2.5 w-4/5 animate-pulse rounded bg-surface-subtle" />
              </div>
              <div className="w-16 shrink-0 space-y-1.5">
                <div className="ml-auto h-3 w-12 animate-pulse rounded bg-surface-subtle" />
                <div className="ml-auto h-2.5 w-10 animate-pulse rounded bg-surface-subtle" />
              </div>
            </div>
          ))}
        </div>
      ) : state.error ? (
        <div role="alert" className="py-5 text-center">
          <p className="text-sm text-muted-foreground">{t('dashboard.widgets.recentListings.error')}</p>
          <button type="button" onClick={retry} className="mt-2 inline-flex min-h-9 items-center rounded px-2 text-xs font-semibold text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">{t('dashboard.widgets.retry')}</button>
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-5 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-subtle"><Package className="h-5 w-5 text-muted-foreground" /></div>
          <p className="text-sm font-medium text-foreground">{t('dashboard.widgets.recentListings.emptyTitle')}</p>
          <p className="max-w-[240px] text-xs text-muted-foreground">{t('dashboard.widgets.recentListings.emptyDesc')}</p>
          <button type="button" onClick={() => router.push(`/${locale}/dashboard/marketplace/create`)} className="mt-1 inline-flex min-h-9 items-center gap-2 rounded-full bg-accent-soft px-4 text-xs font-semibold text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
            <PlusCircle className="h-4 w-4" /> {t('dashboard.primary.sellCrop')}
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {listings.map((listing) => (
            <li key={listing.id} className="py-2.5 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-subtle">
                  <OptimizedListingImage src={listing.image} alt={listing.imageAlt} width={32} height={32} sizes="32px" className="h-8 w-8 object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{getLocalizedDomainName(listing.customCropName || listing.cropKey, locale, 'crop')}</p>
                  <p className="mt-1 flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground"><MapPin className="h-3 w-3 shrink-0" /><span className="truncate">{getLocalizedDomainName(listing.village, locale, 'village')}, {getLocalizedDomainName(listing.district, locale, 'district')}</span></p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-accent">₹{listing.price.toLocaleString('en-IN')}</p>
                  <p className="text-[11px] text-muted-foreground">{listing.quantity} {getLocalizedDomainName(listing.unit, locale, 'unit')}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
