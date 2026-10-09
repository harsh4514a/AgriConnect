'use client';

import { motion } from 'framer-motion';
import { ClipboardList, ArrowRight, Plus } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { DashboardDataState } from '@/hooks/use-dashboard-data';
import type { BuyerRequirement } from '@/services/api/buyer-requirements.api';
import { getLocalizedDomainName } from '@agri/domain-data';

export function BuyerRequirements({ state, retry }: { state: DashboardDataState<BuyerRequirement[]>; retry: () => void }) {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const active = state.data.filter((item) => item.status === 'active').slice(0, 3);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{t('dashboard.widgets.buyerRequirements.title')}</h3>
        <button onClick={() => router.push(`/${locale}/dashboard/buyer-requirements`)} className="inline-flex items-center gap-1 text-xs font-medium text-green-300">
          {t('dashboard.widgets.viewAll')} <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {state.isLoading ? (
        <div className="space-y-3" aria-busy="true">{[1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-white/5" />)}</div>
      ) : state.error ? (
        <div className="py-8 text-center"><p className="text-sm text-white/60">{t('dashboard.widgets.buyerRequirements.error')}</p><button onClick={retry} className="mt-3 text-xs font-semibold text-green-300">{t('dashboard.widgets.retry')}</button></div>
      ) : active.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10"><ClipboardList className="h-7 w-7 text-white/40" /></div>
          <p className="text-sm font-medium text-white">{t('dashboard.widgets.buyerRequirements.emptyTitle')}</p>
          <p className="max-w-[240px] text-xs text-white/50">{t('dashboard.widgets.buyerRequirements.emptyDesc')}</p>
          <button onClick={() => router.push(`/${locale}/dashboard/buyer-requirements/create`)} className="mt-2 inline-flex items-center gap-2 rounded-full border border-green-400/40 bg-green-400/10 px-5 py-3 text-sm font-semibold text-green-200">
            <Plus className="h-4 w-4" /> {t('buyerRequirements.create')}
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {active.map((item) => (
            <li key={item.id} className="rounded-xl border border-white/5 bg-white/5 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {getLocalizedDomainName(item.cropKey === 'other' ? item.customCropName || item.cropKey : item.cropKey, locale, 'crop')}
                    {item.variety ? ` · ${getLocalizedDomainName(item.variety, locale, 'variety')}` : ''}
                  </p>
                  <p className="mt-1 text-[11px] text-white/45">{item.quantity} {t(`buyerRequirements.units.${item.unit}`)} · {getLocalizedDomainName(item.district, locale, 'district')}</p>
                </div>
                <span className="rounded-full bg-green-400/10 px-2.5 py-1 text-[11px] font-semibold text-green-300">{t('buyerRequirements.status.active')}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
