'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, Store, Package, Plus } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface ListingSuccessModalProps {
  listingId: string;
  isEdit?: boolean;
  onReset: () => void;
}

export function ListingSuccessModal({
  listingId,
  isEdit = false,
  onReset,
}: ListingSuccessModalProps) {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-surface p-6 text-center shadow-2xl"
      >
        {/* Animated celebration icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 20 }}
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg shadow-black/10"
        >
          <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
        </motion.div>

        <h3 className="mt-5 text-2xl font-extrabold text-foreground">
          {isEdit
            ? t('dashboard.createListing.modal.updateSuccessTitle')
            : t('dashboard.createListing.modal.successTitle')}
        </h3>

        <p className="mt-2 text-sm text-foreground">
          {isEdit
            ? t('dashboard.createListing.modal.updateSuccessSubtitle')
            : t('dashboard.createListing.modal.successSubtitle')}
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col gap-3">
          {/* Primary: View Listing in Marketplace */}
          <button
            type="button"
            onClick={() => router.push(`/${locale}/dashboard/marketplace/${listingId}`)}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-bold text-accent-foreground shadow-sm transition-all duration-200 hover:bg-accent-strong active:scale-95"
          >
            <Store className="h-4 w-4" />
            <span>{t('dashboard.createListing.modal.viewListing')}</span>
            <ArrowRight className="h-4 w-4 ml-1" />
          </button>

          {/* Secondary: View My Listings */}
          <button
            type="button"
            onClick={() => router.push(`/${locale}/dashboard/my-listings`)}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-subtle text-sm font-semibold text-foreground transition-all duration-200 hover:bg-surface-subtle active:scale-95"
          >
            <Package className="h-4 w-4" />
            <span>{t('dashboard.createListing.modal.viewMyListings')}</span>
          </button>

          {/* Tertiary: Create Another Listing */}
          {!isEdit && (
            <button
              type="button"
              onClick={onReset}
              className="mt-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t('dashboard.createListing.modal.createAnother')}</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
