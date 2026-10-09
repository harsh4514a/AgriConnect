'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import type { DashboardUser } from '@/types/dashboard.types';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { PrimaryActions } from '@/components/dashboard/widgets/primary-actions';
import { QuickActions } from '@/components/dashboard/widgets/quick-actions';
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
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="text-sm text-white/50">{t('dashboard.welcome.greeting')}</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">{firstName},</h2>
        <p className="mt-1 text-sm text-white/60">{t('dashboard.welcome.subtitle')}</p>
      </motion.div>

      <PrimaryActions />

      <StatisticsCards
        user={user}
        activeListingsCount={dashboard.activeListingsCount}
        buyerRequirements={dashboard.buyerRequirements}
      />

      <QuickActions />



      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecentListings state={dashboard.myListings} retry={dashboard.retry} />
        <BuyerRequirements state={dashboard.buyerRequirements} retry={dashboard.retry} />
        <MarketPrices state={dashboard.marketPrices} retry={dashboard.retry} />
        <GovtSchemes />
      </div>
    </div>
  );
}
