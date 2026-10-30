'use client';

import { ArrowRight, TrendingUp } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { DashboardDataState } from '@/hooks/use-dashboard-data';
import type { MarketPrice } from '@/services/api/market-prices.api';
import { getLocalizedCropName, getLocalizedDistrictName, getLocalizedMarketName } from '@/components/market-prices/market-prices-i18n';

export function MarketPrices({ state, retry }: { state: DashboardDataState<MarketPrice[]> & { latestAvailableDate?: string }; retry: () => void }) {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const numberLocale = locale === 'gu' ? 'gu-IN' : locale === 'hi' ? 'hi-IN' : 'en-IN';

  return (
    <div className="rounded-2xl border border-border bg-surface-subtle p-5 backdrop-blur-xl">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{t('dashboard.widgets.marketPrices.title')}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{t('dashboard.widgets.marketPrices.latestAvailable')}{state.latestAvailableDate ? `· ${state.latestAvailableDate}` : ''}</p>
        </div>
        <button type="button" onClick={() => router.push(`/${locale}/dashboard/market-prices`)} className="inline-flex items-center gap-1 text-xs font-medium text-accent">
          {t('dashboard.widgets.viewAll')} <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {state.isLoading ? (
        <div className="space-y-3" aria-busy="true">{[1, 2, 3].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-surface-subtle" />)}</div>
      ) : state.error ? (
        <div className="py-8 text-center"><p className="text-sm text-muted-foreground">{t('dashboard.widgets.marketPrices.unavailable')}</p><button onClick={retry} className="mt-3 text-xs font-semibold text-accent">{t('dashboard.widgets.retry')}</button></div>
      ) : state.data.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface-subtle px-4 py-8 text-center"><p className="text-sm text-muted-foreground">{t('dashboard.widgets.marketPrices.empty')}</p></div>
      ) : (
        <ul className="space-y-2">
          {state.data.map((item) => (
            <li key={item.id} className="rounded-xl border border-border bg-surface-subtle px-3 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft"><TrendingUp className="h-4 w-4 text-accent" /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{getLocalizedCropName(item.commodity, locale)}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{getLocalizedMarketName(item.market, locale)} · {getLocalizedDistrictName(item.district, locale)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-accent">₹{new Intl.NumberFormat(numberLocale).format(item.modalPrice)}</p>
                  <p className="text-[10px] text-muted-foreground">{t('dashboard.widgets.marketPrices.modalPrice')} / {t('dashboard.marketplace.perQuintal')}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
