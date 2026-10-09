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
import { cn } from '@/utils/cn';
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

function formatPosted(hoursAgo: number, t: (key: string) => string): string {
  if (hoursAgo < 1) return t('dashboard.marketplaceBrowse.ux.postedToday');
  if (hoursAgo < 24) return `${hoursAgo} ${t('dashboard.marketplaceBrowse.ux.postedHours')}`;
  const days = Math.floor(hoursAgo / 24);
  if (days === 1) return t('dashboard.marketplaceBrowse.ux.postedYesterday');
  return `${days} ${t('dashboard.marketplaceBrowse.ux.postedDays')}`;
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
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-300 hover:border-green-400/30 hover:bg-white/10 hover:shadow-xl"
    >
      {/* Image with status badge overlay */}
      <div className="relative aspect-[2/1] overflow-hidden bg-white/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={listing.image}
          alt={listing.imageAlt}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/70 to-transparent" />

        {/* Top-right Status Badge */}
        <div className="absolute right-2.5 top-2.5">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold backdrop-blur-md shadow-md',
              status === 'active' && 'border border-emerald-500/30 bg-emerald-950/80 text-emerald-300',
              status === 'sold' && 'border border-amber-500/30 bg-amber-950/80 text-amber-300',
              status === 'inactive' && 'border border-slate-500/30 bg-slate-900/80 text-slate-300',
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                status === 'active' && 'bg-emerald-400 animate-pulse',
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
            <h3 className="truncate text-base font-bold text-white">{cropLabel}</h3>
            <p className="truncate text-xs text-white/60">{getLocalizedDomainName(listing.variety || 'A Grade', locale, 'variety')}</p>
          </div>

          <div className="text-right">
            <span className="text-lg font-extrabold text-green-300">
              {formatPrice(listing.price)}
            </span>
            <span className="block text-[10px] text-white/50">/{getLocalizedDomainName(listing.primaryUnit, locale, 'unit')}</span>
          </div>
        </div>

        {/* Quantity & Location */}
        <div className="mt-3 space-y-1.5 border-t border-white/5 pt-2.5 text-xs text-white/70">
          <p className="flex items-center gap-1.5">
            <Scale className="h-3.5 w-3.5 text-green-400 shrink-0" />
            <span>
              {listing.quantity} {t(`dashboard.marketplaceBrowse.unit.${listing.unit}`)}
            </span>
          </p>
          <p className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-green-400 shrink-0" />
            <span className="truncate">
              {getLocalizedDomainName(listing.village, locale, 'village')}, {districtLabel}
            </span>
          </p>
          <p className="flex items-center gap-1.5 text-[11px] text-white/40">
            <Clock className="h-3 w-3" />
            <span>{formatPosted(listing.postedHoursAgo, t)}</span>
          </p>
        </div>

        {/* Action Buttons Row */}
        <div className="mt-4 grid grid-cols-4 gap-1.5 border-t border-white/10 pt-3">
          {/* View in Marketplace */}
          <button
            type="button"
            onClick={() => router.push(`/${locale}/dashboard/marketplace/${listing.id}`)}
            className="flex h-9 items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-white/80 transition-colors hover:bg-white/15 hover:text-white"
            title={t('dashboard.myListings.card.view')}
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('dashboard.myListings.card.view')}</span>
          </button>

          {/* Edit */}
          <button
            type="button"
            onClick={() => router.push(`/${locale}/dashboard/my-listings/${listing.id}/edit`)}
            className="flex h-9 items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-white/80 transition-colors hover:bg-white/15 hover:text-white"
            title={t('dashboard.myListings.card.edit')}
          >
            <Edit className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('dashboard.myListings.card.edit')}</span>
          </button>

          {/* Status Change */}
          <button
            type="button"
            onClick={() => onOpenStatus(listing)}
            className="flex h-9 items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-white/80 transition-colors hover:bg-white/15 hover:text-white"
            title={t('dashboard.myListings.card.changeStatus')}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('dashboard.myListings.card.changeStatus')}</span>
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => onOpenDelete(listing)}
            className="flex h-9 items-center justify-center gap-1 rounded-xl border border-red-500/20 bg-red-950/20 text-xs font-semibold text-red-300 transition-colors hover:bg-red-950/40 hover:text-red-200"
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
