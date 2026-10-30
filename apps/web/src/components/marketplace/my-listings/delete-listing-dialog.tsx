'use client';

import { motion } from 'framer-motion';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { CropListing } from '@/data/marketplace-listings';
import { deleteListing } from '@/services/api/listings.api';

interface DeleteListingDialogProps {
  listing: CropListing | null;
  onClose: () => void;
  onDeleted: (id: string) => void;
}

export function DeleteListingDialog({ listing, onClose, onDeleted }: DeleteListingDialogProps) {
  const t = useTranslations();

  if (!listing) return null;

  const cropLabel = t(`dashboard.marketplaceBrowse.crop.${listing.cropKey}`);

  const handleDelete = async () => {
    try {
      await deleteListing(listing.id);
      toast.success(t('dashboard.myListings.deleteModal.success'));
      onDeleted(listing.id);
    } catch {
      toast.error(t('errors.unexpectedError'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md overflow-hidden rounded-3xl border border-danger/30 bg-surface p-6 shadow-2xl"
      >
        {/* Warning Icon */}
        <div className="flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-danger/30 bg-danger-soft text-danger">
            <AlertTriangle className="h-6 w-6" />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-subtle hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Title & Warning message */}
        <div className="mt-4">
          <h3 className="text-lg font-bold text-foreground">
            {t('dashboard.myListings.deleteModal.title')}
          </h3>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {cropLabel} ({listing.quantity} {listing.unit})
          </p>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            {t('dashboard.myListings.deleteModal.desc')}
          </p>
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-border px-4 text-xs font-semibold text-foreground hover:bg-surface-subtle hover:text-foreground"
          >
            {t('dashboard.myListings.deleteModal.cancel')}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-danger/40 bg-danger px-5 text-xs font-bold text-danger-foreground transition-all hover:bg-danger active:scale-95"
          >
            <Trash2 className="h-4 w-4" />
            <span>{t('dashboard.myListings.deleteModal.confirm')}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
