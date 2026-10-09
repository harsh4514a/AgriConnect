'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Plus,
  Search,
  Package,
  CheckCircle2,
  Archive,
  Store,
  Layers,
} from 'lucide-react';
import type { CropListing, ListingStatus } from '@/data/marketplace-listings';
import { getMyListings } from '@/services/api/listings.api';
import { MyListingCard } from '@/components/marketplace/my-listings/my-listing-card';
import { ListingStatusDialog } from '@/components/marketplace/my-listings/listing-status-dialog';
import { DeleteListingDialog } from '@/components/marketplace/my-listings/delete-listing-dialog';
import { MyListingsEmptyState } from '@/components/marketplace/my-listings/my-listings-empty-state';
import { cn } from '@/utils/cn';

export function MyListingsPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const [userListings, setUserListings] = useState<CropListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | ListingStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusListing, setStatusListing] = useState<CropListing | null>(null);
  const [deleteListingTarget, setDeleteListingTarget] = useState<CropListing | null>(null);

  // The API derives ownership from the JWT; this page has no local-store fallback.
  useEffect(() => {
    let mounted = true;

    void getMyListings()
      .then((listings) => {
        if (mounted) setUserListings(listings);
      })
      .catch(() => {
        if (mounted) setUserListings([]);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Statistics counts
  const stats = useMemo(() => {
    let active = 0;
    let sold = 0;
    let inactive = 0;

    userListings.forEach((l) => {
      const st = l.status || (l.availability === 'soldOut' ? 'sold' : 'active');
      if (st === 'active') active += 1;
      else if (st === 'sold') sold += 1;
      else if (st === 'inactive') inactive += 1;
    });

    return {
      total: userListings.length,
      active,
      sold,
      inactive,
    };
  }, [userListings]);

  // Filtered listings
  const filteredListings = useMemo(() => {
    return userListings.filter((l) => {
      const st = l.status || (l.availability === 'soldOut' ? 'sold' : 'active');

      if (activeTab !== 'all' && st !== activeTab) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const crop = t(`dashboard.marketplaceBrowse.crop.${l.cropKey}`).toLowerCase();
        const village = l.village.toLowerCase();
        const district = l.district.toLowerCase();
        const variety = (l.variety || '').toLowerCase();
        if (
          !crop.includes(q) &&
          !village.includes(q) &&
          !district.includes(q) &&
          !variety.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [userListings, activeTab, searchQuery, t]);

  const tabs: { key: 'all' | ListingStatus; label: string; count: number }[] = [
    { key: 'all', label: t('dashboard.myListings.tabs.all'), count: stats.total },
    { key: 'active', label: t('dashboard.myListings.tabs.active'), count: stats.active },
    { key: 'sold', label: t('dashboard.myListings.tabs.sold'), count: stats.sold },
    { key: 'inactive', label: t('dashboard.myListings.tabs.inactive'), count: stats.inactive },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header with Title & Create CTA */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {t('dashboard.myListings.header.title')}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-white/60">
            {t('dashboard.myListings.header.subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push(`/${locale}/dashboard/marketplace/create`)}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-bold text-white transition-all shadow-lg active:scale-95 sm:w-auto"
          style={{
            background: 'linear-gradient(135deg, #2E7D32, #1B5E20)',
            boxShadow: '0 4px 16px rgba(46,125,50,0.4)',
          }}
        >
          <Plus className="h-4 w-4" />
          <span>{t('dashboard.myListings.createCta')}</span>
        </button>
      </div>

      {/* 2. Summary Statistics Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Total Listings */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/60">
              {t('dashboard.myListings.stats.total')}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/80">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-white">{stats.total}</p>
        </div>

        {/* Active */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-300">
              {t('dashboard.myListings.stats.active')}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300">
              <Store className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-emerald-300">{stats.active}</p>
        </div>

        {/* Sold */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-300">
              {t('dashboard.myListings.stats.sold')}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-amber-300">{stats.sold}</p>
        </div>

        {/* Inactive */}
        <div className="rounded-2xl border border-slate-500/20 bg-slate-900/20 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              {t('dashboard.myListings.stats.inactive')}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-500/20 text-slate-300">
              <Archive className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-300">{stats.inactive}</p>
        </div>
      </div>

      {/* 3. Toolbar (Filter Tabs + Search) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto rounded-2xl border border-white/10 bg-white/5 p-1.5 backdrop-blur-xl">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all',
                activeTab === tab.key
                  ? 'bg-green-600 text-white shadow-md'
                  : 'text-white/60 hover:bg-white/5 hover:text-white',
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.2 text-[10px] font-bold',
                  activeTab === tab.key ? 'bg-green-800 text-white' : 'bg-white/10 text-white/50',
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search crop or village..."
            className="h-10 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 text-xs text-white placeholder-white/40 backdrop-blur-xl transition-all focus:border-green-400 focus:bg-white/10 focus:outline-none"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
            >
              <div className="aspect-[16/10] skeleton-shimmer" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-3/4 rounded-full skeleton-shimmer" />
                <div className="h-3 w-1/2 rounded-full skeleton-shimmer" />
                <div className="flex items-center justify-between pt-2">
                  <div className="h-5 w-1/3 rounded-full skeleton-shimmer" />
                  <div className="h-8 w-20 rounded-lg skeleton-shimmer" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredListings.length === 0 ? (
        <MyListingsEmptyState
          statusFilter={activeTab}
          onClearFilter={() => {
            setActiveTab('all');
            setSearchQuery('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredListings.map((listing, idx) => (
            <MyListingCard
              key={listing.id}
              listing={listing}
              index={idx}
              onOpenStatus={(l) => setStatusListing(l)}
              onOpenDelete={(l) => setDeleteListingTarget(l)}
            />
          ))}
        </div>
      )}

      {/* Status Management Dialog */}
      {statusListing && (
        <ListingStatusDialog
          listing={statusListing}
          onClose={() => setStatusListing(null)}
          onSaved={(updated) => {
            setUserListings((current) =>
              current.map((listing) => (listing.id === updated.id ? updated : listing)),
            );
            setStatusListing(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteListingTarget && (
        <DeleteListingDialog
          listing={deleteListingTarget}
          onClose={() => setDeleteListingTarget(null)}
          onDeleted={(id) => {
            setUserListings((current) => current.filter((listing) => listing.id !== id));
            setDeleteListingTarget(null);
          }}
        />
      )}
    </div>
  );
}
