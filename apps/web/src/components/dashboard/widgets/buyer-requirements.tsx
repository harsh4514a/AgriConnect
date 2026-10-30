'use client';

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
    <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{t('dashboard.widgets.buyerRequirements.title')}</h3>
        <button type="button" onClick={() => router.push(`/${locale}/dashboard/buyer-requirements`)} className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded px-1 text-xs font-medium text-accent hover:text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          {t('dashboard.widgets.viewAll')} <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {state.isLoading ? (
        <div className="divide-y divide-border" aria-busy="true">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="h-3 w-2/3 animate-pulse rounded bg-surface-subtle" />
                <div className="h-2.5 w-4/5 animate-pulse rounded bg-surface-subtle" />
              </div>
              <div className="h-6 w-14 shrink-0 animate-pulse rounded-full bg-surface-subtle" />
            </div>
          ))}
        </div>
      ) : state.error ? (
        <div role="alert" className="py-5 text-center"><p className="text-sm text-muted-foreground">{t('dashboard.widgets.buyerRequirements.error')}</p><button type="button" onClick={retry} className="mt-2 inline-flex min-h-9 items-center rounded px-2 text-xs font-semibold text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">{t('dashboard.widgets.retry')}</button></div>
      ) : active.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-5 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-subtle"><ClipboardList className="h-5 w-5 text-muted-foreground" /></div>
          <p className="text-sm font-medium text-foreground">{t('dashboard.widgets.buyerRequirements.emptyTitle')}</p>
          <p className="max-w-[240px] text-xs text-muted-foreground">{t('dashboard.widgets.buyerRequirements.emptyDesc')}</p>
          <button type="button" onClick={() => router.push(`/${locale}/dashboard/buyer-requirements/create`)} className="mt-1 inline-flex min-h-9 items-center gap-2 rounded-full border border-border-strong bg-accent-soft px-4 text-xs font-semibold text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
            <Plus className="h-4 w-4" /> {t('buyerRequirements.create')}
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {active.map((item) => (
            <li key={item.id} className="py-2.5 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between gap-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {getLocalizedDomainName(item.cropKey === 'other' ? item.customCropName || item.cropKey : item.cropKey, locale, 'crop')}
                    {item.variety ? ` · ${getLocalizedDomainName(item.variety, locale, 'variety')}` : ''}
                  </p>
                  <p className="mt-1 truncate text-[11px] text-muted-foreground">{item.quantity} {t(`buyerRequirements.units.${item.unit}`)} · {getLocalizedDomainName(item.district, locale, 'district')}</p>
                </div>
                <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-[10px] font-semibold text-accent">{t('buyerRequirements.status.active')}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
