'use client';

import { useTranslations } from 'next-intl';
import type { DashboardUser } from '@/types/dashboard.types';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { PrimaryActions } from '@/components/dashboard/widgets/primary-actions';
import { StatisticsCards } from '@/components/dashboard/widgets/statistics-cards';
import { RecentListings } from '@/components/dashboard/widgets/recent-listings';
import { BuyerRequirements } from '@/components/dashboard/widgets/buyer-requirements';
import { MarketPrices } from '@/components/dashboard/widgets/market-prices';
import { GovtSchemes } from '@/components/dashboard/widgets/govt-schemes';

export function DashboardHome({ user }: { user: DashboardUser | null }) {
  const t = useTranslations();
  const dashboard = useDashboardData(user);
  const firstName = user?.firstName?.trim() || t('dashboard.welcome.fallbackName');

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-muted-foreground">{t('dashboard.welcome.greeting')}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">{firstName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('dashboard.welcome.subtitle')}</p>
      </header>

      <PrimaryActions />

      <StatisticsCards
        user={user}
        activeListingsCount={dashboard.activeListingsCount}
        buyerRequirements={dashboard.buyerRequirements}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <RecentListings state={dashboard.myListings} retry={dashboard.retry} />
        <BuyerRequirements state={dashboard.buyerRequirements} retry={dashboard.retry} />
        <MarketPrices state={dashboard.marketPrices} retry={dashboard.retry} />
        <GovtSchemes />
      </div>
    </div>
  );
}
