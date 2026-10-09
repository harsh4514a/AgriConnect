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
      accent: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40',
    },
    {
      status: 'sold',
      title: t('dashboard.myListings.status.sold'),
      desc: t('dashboard.myListings.statusModal.soldDesc'),
      icon: CheckCircle2,
      accent: 'text-amber-400 border-amber-500/30 bg-amber-950/40',
    },
    {
      status: 'inactive',
      title: t('dashboard.myListings.status.inactive'),
      desc: t('dashboard.myListings.statusModal.inactiveDesc'),
      icon: Archive,
      accent: 'text-slate-400 border-slate-500/30 bg-slate-900/40',
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
        className="w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-green-950/95 p-6 shadow-2xl backdrop-blur-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h3 className="text-lg font-bold text-white">
              {t('dashboard.myListings.statusModal.title')}
            </h3>
            <p className="text-xs text-white/60">
              {cropLabel} ({listing.quantity} {listing.unit})
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
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
                    ? 'border-green-400 bg-green-900/40 ring-1 ring-green-400/40 shadow-lg'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10',
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
                    <span className="text-sm font-bold text-white">{opt.title}</span>
                    {isSelected && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-400 text-green-950">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-white/60 leading-relaxed">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-white/10 px-4 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white"
          >
            {t('dashboard.myListings.statusModal.cancel')}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="h-11 rounded-xl px-6 text-xs font-bold text-white transition-all shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, #2E7D32, #1B5E20)',
              boxShadow: '0 4px 14px rgba(46,125,50,0.4)',
            }}
          >
            {t('dashboard.myListings.statusModal.confirm')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
