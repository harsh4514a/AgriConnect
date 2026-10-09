'use client';

import { motion } from 'framer-motion';
import { Package, ArrowRight, PlusCircle, MapPin } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { DashboardDataState } from '@/hooks/use-dashboard-data';
import type { CropListing } from '@/data/marketplace-listings';
import { getLocalizedDomainName } from '@agri/domain-data';

export function RecentListings({ state, retry }: { state: DashboardDataState<CropListing[]>; retry: () => void }) {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const listings = [...state.data]
    .sort((a, b) => new Date(String(b.createdAt ?? 0)).getTime() - new Date(String(a.createdAt ?? 0)).getTime())
    .slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
    >
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{t('dashboard.widgets.recentListings.title')}</h3>
        <button onClick={() => router.push(`/${locale}/dashboard/my-listings`)} className="inline-flex items-center gap-1 text-xs font-medium text-green-300">
          {t('dashboard.widgets.viewAll')} <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {state.isLoading ? (
        <div className="space-y-3" aria-busy="true">
          {[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-white/5" />)}
        </div>
      ) : state.error ? (
        <div className="py-8 text-center">
          <p className="text-sm text-white/60">{t('dashboard.widgets.recentListings.error')}</p>
          <button onClick={retry} className="mt-3 text-xs font-semibold text-green-300">{t('dashboard.widgets.retry')}</button>
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10"><Package className="h-7 w-7 text-white/40" /></div>
          <p className="text-sm font-medium text-white">{t('dashboard.widgets.recentListings.emptyTitle')}</p>
          <p className="max-w-[240px] text-xs text-white/50">{t('dashboard.widgets.recentListings.emptyDesc')}</p>
          <button onClick={() => router.push(`/${locale}/dashboard/marketplace/create`)} className="mt-2 inline-flex items-center gap-2 rounded-full bg-green-500/15 px-5 py-3 text-sm font-semibold text-green-200">
            <PlusCircle className="h-4 w-4" /> {t('dashboard.primary.sellCrop')}
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {listings.map((listing) => (
            <li key={listing.id} className="rounded-xl border border-white/5 bg-white/5 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={listing.image} alt={listing.imageAlt} width={32} height={32} className="h-8 w-8 object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{getLocalizedDomainName(listing.customCropName || listing.cropKey, locale, 'crop')}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-white/45"><MapPin className="h-3 w-3" />{getLocalizedDomainName(listing.village, locale, 'village')}, {getLocalizedDomainName(listing.district, locale, 'district')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-300">₹{listing.price.toLocaleString('en-IN')}</p>
                  <p className="text-[11px] text-white/45">{listing.quantity} {getLocalizedDomainName(listing.unit, locale, 'unit')}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
