'use client';

import { useState, useEffect } from 'react';
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
import { getMyListingsPage } from '@/services/api/listings.api';
import { MyListingCard } from '@/components/marketplace/my-listings/my-listing-card';
import { ListingStatusDialog } from '@/components/marketplace/my-listings/listing-status-dialog';
import { DeleteListingDialog } from '@/components/marketplace/my-listings/delete-listing-dialog';
import { MyListingsEmptyState } from '@/components/marketplace/my-listings/my-listings-empty-state';
import { cn } from '@/utils/cn';
import { Pagination } from '@/components/marketplace/pagination';

const PAGE_SIZE = 12;

export function MyListingsPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const [userListings, setUserListings] = useState<CropListing[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, sold: 0, inactive: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | ListingStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusListing, setStatusListing] = useState<CropListing | null>(null);
  const [deleteListingTarget, setDeleteListingTarget] = useState<CropListing | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setCurrentPage(1);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  // The API derives ownership from the JWT and returns only the requested page.
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    setIsLoading(true);

    void getMyListingsPage({
      page: currentPage,
      limit: PAGE_SIZE,
      ...(activeTab !== 'all' ? { status: activeTab } : {}),
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    }, controller.signal)
      .then((response) => {
        if (!mounted) return;
        setUserListings(response.listings);
        setStats(response.stats);
        setTotal(response.total);
        setTotalPages(response.totalPages);
        if (currentPage > response.totalPages) setCurrentPage(response.totalPages);
      })
      .catch(() => {
        if (!mounted) return;
        setUserListings([]);
        setStats({ total: 0, active: 0, sold: 0, inactive: 0 });
        setTotal(0);
        setTotalPages(1);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [activeTab, currentPage, debouncedSearch, refreshKey]);

  const filteredListings = userListings;

  const tabs: { key: 'all' | ListingStatus; label: string; count: number }[] = [
    { key: 'all', label: t('dashboard.myListings.tabs.all'), count: stats.total },
    { key: 'active', label: t('dashboard.myListings.tabs.active'), count: stats.active },
    { key: 'sold', label: t('dashboard.myListings.tabs.sold'), count: stats.sold },
    { key: 'inactive', label: t('dashboard.myListings.tabs.inactive'), count: stats.inactive },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header with Title & Create CTA */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            {t('dashboard.myListings.header.title')}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            {t('dashboard.myListings.header.subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push(`/${locale}/dashboard/marketplace/create`)}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-accent px-6 text-sm font-bold text-accent-foreground shadow-sm transition-all hover:bg-accent-strong active:scale-95 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          <span>{t('dashboard.myListings.createCta')}</span>
        </button>
      </div>

      {/* 2. Summary Statistics Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Total Listings */}
        <div className="rounded-2xl border border-border bg-surface-subtle p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              {t('dashboard.myListings.stats.total')}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-subtle text-foreground">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-foreground">{stats.total}</p>
        </div>

        {/* Active */}
        <div className="rounded-2xl border border-accent/20 bg-accent-soft p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-accent">
              {t('dashboard.myListings.stats.active')}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Store className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-accent">{stats.active}</p>
        </div>

        {/* Sold */}
        <div className="rounded-2xl border border-warning/20 bg-warning/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-warning">
              {t('dashboard.myListings.stats.sold')}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/20 text-warning">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-warning">{stats.sold}</p>
        </div>

        {/* Inactive */}
        <div className="rounded-2xl border border-border bg-surface-subtle p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              {t('dashboard.myListings.stats.inactive')}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-muted-foreground">
              <Archive className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-foreground">{stats.inactive}</p>
        </div>
      </div>

      {/* 3. Toolbar (Filter Tabs + Search) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto rounded-2xl border border-border bg-surface-subtle p-1.5 backdrop-blur-xl">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key);
                setCurrentPage(1);
              }}
              className={cn(
                'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all',
                activeTab === tab.key
                  ? 'bg-accent text-accent-foreground shadow-md'
                  : 'text-muted-foreground hover:bg-surface-subtle hover:text-foreground',
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.2 text-[10px] font-bold',
                  activeTab === tab.key ? 'bg-accent text-accent-foreground' : 'bg-surface-subtle text-muted-foreground',
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search crop or village..."
            className="h-10 w-full rounded-xl border border-border bg-surface-subtle pl-9 pr-3 text-xs text-foreground placeholder-muted-foreground backdrop-blur-xl transition-all focus:border-focus focus:bg-surface-subtle focus:outline-none"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-border bg-surface-subtle"
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

      {!isLoading && filteredListings.length > 0 ? (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={total}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      ) : null}

      {/* Status Management Dialog */}
      {statusListing && (
        <ListingStatusDialog
          listing={statusListing}
          onClose={() => setStatusListing(null)}
          onSaved={() => {
            setStatusListing(null);
            setRefreshKey((value) => value + 1);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteListingTarget && (
        <DeleteListingDialog
          listing={deleteListingTarget}
          onClose={() => setDeleteListingTarget(null)}
          onDeleted={() => {
            setDeleteListingTarget(null);
            setRefreshKey((value) => value + 1);
          }}
        />
      )}
    </div>
  );
}
