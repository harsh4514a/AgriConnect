'use client';

import { motion } from 'framer-motion';
import {
  MapPin,
  Clock,
  Edit,
  Trash2,
  Eye,
  SlidersHorizontal,
  Scale,
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { CropListing, ListingStatus } from '@/data/marketplace-listings';
import { formatListingCreatedAt } from '@/utils/listing-date';
import { cn } from '@/utils/cn';
import { OptimizedListingImage } from '../optimized-listing-image';
import { getLocalizedDomainName } from '@agri/domain-data';

interface MyListingCardProps {
  listing: CropListing;
  index?: number;
  onOpenStatus: (listing: CropListing) => void;
  onOpenDelete: (listing: CropListing) => void;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
}

export function MyListingCard({
  listing,
  index = 0,
  onOpenStatus,
  onOpenDelete,
}: MyListingCardProps) {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const postedAt = formatListingCreatedAt(listing.createdAt, locale);

  const status: ListingStatus = listing.status || (listing.availability === 'soldOut' ? 'sold' : 'active');
  const cropSource = listing.customCropName || listing.cropKey;
  const cropLabel = listing.cropKey === 'other' && !listing.customCropName
    ? t('dashboard.marketplaceBrowse.crop.other')
    : getLocalizedDomainName(cropSource, locale, 'crop');
  const districtLabel = getLocalizedDomainName(listing.district, locale, 'district');

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-subtle backdrop-blur-xl transition-all duration-300 hover:border-accent/30 hover:bg-surface-subtle hover:shadow-xl"
    >
      {/* Image with status badge overlay */}
      <div className="relative aspect-[2/1] overflow-hidden bg-surface-subtle">
        <OptimizedListingImage
          src={listing.image}
          alt={listing.imageAlt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/70 to-transparent" />

        {/* Top-right Status Badge */}
        <div className="absolute right-2.5 top-2.5">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold backdrop-blur-md shadow-md',
              status === 'active' && 'border border-accent/30 bg-accent/15 text-accent',
              status === 'sold' && 'border border-warning/30 bg-warning/15 text-warning',
              status === 'inactive' && 'border border-slate-500/30 bg-slate-900/80 text-slate-300',
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                status === 'active' && 'bg-accent animate-pulse',
                status === 'sold' && 'bg-amber-400',
                status === 'inactive' && 'bg-slate-400',
              )}
            />
            {t(`dashboard.myListings.status.${status}`)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="truncate text-base font-bold text-foreground">{cropLabel}</h3>
            <p className="truncate text-xs text-muted-foreground">{getLocalizedDomainName(listing.variety || 'A Grade', locale, 'variety')}</p>
          </div>

          <div className="text-right">
            <span className="text-lg font-extrabold text-accent">
              {formatPrice(listing.price)}
            </span>
            <span className="block text-[10px] text-muted-foreground">/{getLocalizedDomainName(listing.primaryUnit, locale, 'unit')}</span>
          </div>
        </div>

        {/* Quantity & Location */}
        <div className="mt-3 space-y-1.5 border-t border-border pt-2.5 text-xs text-foreground">
          <p className="flex items-center gap-1.5">
            <Scale className="h-3.5 w-3.5 text-accent shrink-0" />
            <span>
              {listing.quantity} {t(`dashboard.marketplaceBrowse.unit.${listing.unit}`)}
            </span>
          </p>
          <p className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-accent shrink-0" />
            <span className="truncate">
              {[listing.village ? getLocalizedDomainName(listing.village, locale, 'village') : '', districtLabel].filter(Boolean).join(', ')}
            </span>
          </p>
          {postedAt ? <time dateTime={postedAt.iso} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{t('dashboard.marketplaceBrowse.ux.postedAt', { date: postedAt.label })}</span>
          </time> : null}
        </div>

        {/* Action Buttons Row */}
        <div className="mt-4 grid grid-cols-4 gap-1.5 border-t border-border pt-3">
          {/* View in Marketplace */}
          <button
            type="button"
            onClick={() => router.push(`/${locale}/dashboard/marketplace/${listing.id}`)}
            className="flex h-9 items-center justify-center gap-1 rounded-xl border border-border bg-surface-subtle text-xs font-semibold text-foreground transition-colors hover:bg-surface-subtle hover:text-foreground"
            title={t('dashboard.myListings.card.view')}
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('dashboard.myListings.card.view')}</span>
          </button>

          {/* Edit */}
          <button
            type="button"
            onClick={() => router.push(`/${locale}/dashboard/my-listings/${listing.id}/edit`)}
            className="flex h-9 items-center justify-center gap-1 rounded-xl border border-border bg-surface-subtle text-xs font-semibold text-foreground transition-colors hover:bg-surface-subtle hover:text-foreground"
            title={t('dashboard.myListings.card.edit')}
          >
            <Edit className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('dashboard.myListings.card.edit')}</span>
          </button>

          {/* Status Change */}
          <button
            type="button"
            onClick={() => onOpenStatus(listing)}
            className="flex h-9 items-center justify-center gap-1 rounded-xl border border-border bg-surface-subtle text-xs font-semibold text-foreground transition-colors hover:bg-surface-subtle hover:text-foreground"
            title={t('dashboard.myListings.card.changeStatus')}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('dashboard.myListings.card.changeStatus')}</span>
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => onOpenDelete(listing)}
            className="flex h-9 items-center justify-center gap-1 rounded-xl border border-danger/30 bg-danger-soft text-xs font-semibold text-danger transition-colors hover:bg-danger-soft hover:text-danger"
            title={t('dashboard.myListings.card.delete')}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('dashboard.myListings.card.delete')}</span>
          </button>
        </div>
      </div>
    </motion.article>
  );
}
