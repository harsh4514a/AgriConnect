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
        className="w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-green-950/90 p-6 text-center shadow-2xl backdrop-blur-2xl"
      >
        {/* Animated celebration icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 20 }}
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-green-600 to-emerald-400 text-white shadow-xl shadow-green-900/50"
        >
          <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
        </motion.div>

        <h3 className="mt-5 text-2xl font-extrabold text-white">
          {isEdit
            ? t('dashboard.createListing.modal.updateSuccessTitle')
            : t('dashboard.createListing.modal.successTitle')}
        </h3>

        <p className="mt-2 text-sm text-white/70">
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
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white transition-all duration-200 active:scale-95 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #2E7D32, #1B5E20)',
              boxShadow: '0 4px 16px rgba(46,125,50,0.45)',
            }}
          >
            <Store className="h-4 w-4" />
            <span>{t('dashboard.createListing.modal.viewListing')}</span>
            <ArrowRight className="h-4 w-4 ml-1" />
          </button>

          {/* Secondary: View My Listings */}
          <button
            type="button"
            onClick={() => router.push(`/${locale}/dashboard/my-listings`)}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/15 active:scale-95"
          >
            <Package className="h-4 w-4" />
            <span>{t('dashboard.createListing.modal.viewMyListings')}</span>
          </button>

          {/* Tertiary: Create Another Listing */}
          {!isEdit && (
            <button
              type="button"
              onClick={onReset}
              className="mt-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-white/50 hover:text-white transition-colors py-2"
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
