'use client';

import { motion } from 'framer-motion';
import { MapPin, Phone, BadgeCheck, ArrowRight } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { DashboardDataState } from '@/hooks/use-dashboard-data';
import type { CropListing } from '@/data/marketplace-listings';
import { getLocalizedDomainName } from '@agri/domain-data';

export function MarketplacePreview({ state, retry }: { state: DashboardDataState<CropListing[]>; retry: () => void }) {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const listings = state.data.slice(0, 3);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">{t('dashboard.marketplace.title')}</h3>
          <p className="mt-0.5 text-xs text-white/40">{t('dashboard.marketplace.nearby')}</p>
        </div>
        <button onClick={() => router.push(`/${locale}/dashboard/marketplace`)} className="inline-flex items-center gap-1 text-xs font-medium text-green-300">
          {t('dashboard.widgets.viewAll')} <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {state.isLoading ? (
        <div className="space-y-3" aria-busy="true">{[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl bg-white/5" />)}</div>
      ) : state.error ? (
        <div className="py-8 text-center"><p className="text-sm text-white/60">{t('dashboard.marketplace.error')}</p><button onClick={retry} className="mt-3 text-xs font-semibold text-green-300">{t('dashboard.widgets.retry')}</button></div>
      ) : listings.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-white/5 px-4 py-8 text-center">
          <p className="text-sm font-medium text-white">{t('dashboard.marketplace.emptyTitle')}</p>
          <p className="mt-1 text-xs text-white/45">{t('dashboard.marketplace.emptyDescription')}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {listings.map((item, idx) => (
            <motion.li key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="overflow-hidden rounded-xl border border-white/5 bg-white/5">
              <div className="flex items-center gap-3 p-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt={item.imageAlt} loading="lazy" width={40} height={40} className="h-10 w-10 object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold text-white">
                      {getLocalizedDomainName(item.customCropName || item.cropKey, locale, 'crop')}
                    </p>
                    {item.verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-green-300" aria-label={t('dashboard.marketplace.verified')} />}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-white/50">
                    <span>{item.quantity} {getLocalizedDomainName(item.unit, locale, 'unit')}</span>
                    <span className="inline-flex items-center gap-0.5"><MapPin className="h-3 w-3" />{getLocalizedDomainName(item.village, locale, 'village')}, {getLocalizedDomainName(item.district, locale, 'district')}</span>
                    {Number.isFinite(item.distanceKm) && item.distanceKm > 0 && <span>{Math.round(item.distanceKm)} {t('dashboard.marketplace.distance')}</span>}
                  </div>
                  <p className="mt-1 text-sm font-bold text-green-300">₹{item.price.toLocaleString('en-IN')} <span className="text-[11px] font-normal text-white/40">{getLocalizedDomainName(item.primaryUnit, locale, 'unit')}</span></p>
                </div>
                {item.mobileNumber && (
                  <a href={`tel:${item.mobileNumber}`} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-green-500/15 px-3 py-2 text-xs font-semibold text-green-200 hover:bg-green-500/25" aria-label={`${t('dashboard.marketplace.callFarmer')}: ${item.farmerName}`}>
                    <Phone className="h-3.5 w-3.5" /> {t('dashboard.marketplace.callFarmer')}
                  </a>
                )}
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
