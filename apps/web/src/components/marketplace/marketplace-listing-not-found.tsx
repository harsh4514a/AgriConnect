'use client';

import { motion } from 'framer-motion';
import { PackageSearch, ArrowLeft } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

export function MarketplaceListingNotFound() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex min-h-[60vh] flex-col items-center justify-center rounded-3xl border border-border bg-surface-subtle p-8 text-center backdrop-blur-xl"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4, type: 'spring', stiffness: 220 }}
        className="flex h-20 w-20 items-center justify-center rounded-3xl bg-surface-subtle"
      >
        <PackageSearch className="h-10 w-10 text-accent" aria-hidden="true" />
      </motion.div>

      <h2 className="mt-6 text-2xl font-bold text-foreground">
        {t('dashboard.marketplaceBrowse.detail.notFound')}
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {t('dashboard.marketplaceBrowse.detail.notFoundDesc')}
      </p>

      <button
        type="button"
        onClick={() => router.push(`/${locale}/dashboard/marketplace`)}
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-strong hover:shadow-lg active:scale-95 focus-visible:outline-2 focus-visible:outline-focus"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t('dashboard.marketplaceBrowse.detail.backToMarketplace')}
      </button>
    </motion.div>
  );
}
