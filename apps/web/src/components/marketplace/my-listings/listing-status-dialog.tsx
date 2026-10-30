'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, ShieldAlert, CheckCircle2, Archive, Store } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { CropListing, ListingStatus } from '@/data/marketplace-listings';
import { updateListingStatus } from '@/services/api/listings.api';
import { cn } from '@/utils/cn';

interface ListingStatusDialogProps {
  listing: CropListing | null;
  onClose: () => void;
  onSaved: (listing: CropListing) => void;
}

export function ListingStatusDialog({ listing, onClose, onSaved }: ListingStatusDialogProps) {
  const t = useTranslations();

  const currentStatus: ListingStatus =
    listing?.status || (listing?.availability === 'soldOut' ? 'sold' : 'active');
  const [selectedStatus, setSelectedStatus] = useState<ListingStatus>(currentStatus);
  const [isSaving, setIsSaving] = useState(false);

  if (!listing) return null;

  const cropLabel = t(`dashboard.marketplaceBrowse.crop.${listing.cropKey}`);

  const options: {
    status: ListingStatus;
    title: string;
    desc: string;
    icon: typeof Store;
    accent: string;
  }[] = [
    {
      status: 'active',
      title: t('dashboard.myListings.status.active'),
      desc: t('dashboard.myListings.statusModal.activeDesc'),
      icon: Store,
      accent: 'text-accent border-accent/30 bg-accent-soft',
    },
    {
      status: 'sold',
      title: t('dashboard.myListings.status.sold'),
      desc: t('dashboard.myListings.statusModal.soldDesc'),
      icon: CheckCircle2,
      accent: 'text-warning border-warning/30 bg-warning/10',
    },
    {
      status: 'inactive',
      title: t('dashboard.myListings.status.inactive'),
      desc: t('dashboard.myListings.statusModal.inactiveDesc'),
      icon: Archive,
      accent: 'text-muted-foreground border-border bg-surface-subtle',
    },
  ];

  const handleSave = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      const updated = await updateListingStatus(listing.id, selectedStatus);
      toast.success(
        t('dashboard.myListings.statusModal.success', {
          status: t(`dashboard.myListings.status.${selectedStatus}`),
        }),
      );
      onSaved(updated);
    } catch {
      toast.error(t('errors.unexpectedError'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="text-lg font-bold text-foreground">
              {t('dashboard.myListings.statusModal.title')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {cropLabel} ({listing.quantity} {listing.unit})
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-subtle hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Status Selection Cards */}
        <div className="mt-4 space-y-2.5">
          {options.map((opt) => {
            const isSelected = selectedStatus === opt.status;
            const Icon = opt.icon;

            return (
              <button
                key={opt.status}
                type="button"
                onClick={() => setSelectedStatus(opt.status)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition-all',
                  isSelected
                    ? 'border-accent bg-accent-soft ring-1 ring-focus shadow-sm'
                    : 'border-border bg-surface-subtle hover:border-border hover:bg-surface-subtle',
                )}
              >
                <div
                  className={cn(
                    'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border',
                    opt.accent,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">{opt.title}</span>
                    {isSelected && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-border px-4 text-xs font-semibold text-foreground hover:bg-surface-subtle hover:text-foreground"
          >
            {t('dashboard.myListings.statusModal.cancel')}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="h-11 rounded-xl bg-accent px-6 text-xs font-bold text-accent-foreground shadow-sm transition-all hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t('dashboard.myListings.statusModal.confirm')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
