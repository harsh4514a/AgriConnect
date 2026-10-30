'use client';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import {
  Clock3,
  MapPin,
  Navigation,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';

import { getNearbyListings } from '@/services/api/listings.api';
import { useAuth } from '@/hooks/use-auth';

import type {
  CropKey,
  CropListing,
} from '@/data/marketplace-listings';

import { CROPS } from '@/data/marketplace-listings';

import { useProfileLocation } from '@/hooks/use-profile-location';

import { MarketplaceGrid } from '@/components/marketplace/marketplace-grid';

import { cn } from '@/utils/cn';

const PAGE_SIZE = 12;

const RADII = [
  5,
  10,
  25,
  50,
] as const;

const CROP_EMOJI: Record<CropKey, string> = {
  wheat: '🌾',
  onion: '🧅',
  tomato: '🍅',
  cotton: '🫘',
  maize: '🌽',
  potato: '🥔',
  groundnut: '🥜',
  rice: '🍚',
  bajra: '🌾',
  chili: '🌶️',
  other: '🌱',
};

function NearbyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="aspect-[2/1] skeleton-shimmer" />

      <div className="space-y-2 p-3.5">
        <div className="h-5 w-2/5 rounded skeleton-shimmer" />
        <div className="h-7 w-1/2 rounded skeleton-shimmer" />
        <div className="h-3 w-3/4 rounded skeleton-shimmer" />
        <div className="h-3 w-full rounded skeleton-shimmer" />
        <div className="h-10 w-full rounded-xl skeleton-shimmer" />
      </div>
    </div>
  );
}

export function NearbyListingsPage() {
  const t = useTranslations();
  const { isLoading: isAuthLoading, isAuthenticated } = useAuth();

  const router = useRouter();

  const params = useParams();

  const locale =
    (params?.locale as string) || 'en';

  const {
    latitude,
    longitude,
    available,
    district,
    village,
    taluka,
  } = useProfileLocation();

  const locationReady =
    available &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    latitude !== 0 &&
    longitude !== 0;

  const [
    listings,
    setListings,
  ] = useState<CropListing[]>([]);

  const [totalListings, setTotalListings] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [unlocatedCount, setUnlocatedCount] = useState(0);
  const [loadError, setLoadError] = useState(false);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isRefreshing,
    setIsRefreshing,
  ] = useState(false);

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    radius,
    setRadius,
  ] = useState<(typeof RADII)[number]>(10);

  const [
    selectedCrop,
    setSelectedCrop,
  ] = useState<CropKey | 'all'>('all');

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const loadListings = useCallback(
    async (refresh = false, signal?: AbortSignal) => {
      if (isAuthLoading) {
        setIsLoading(true);
        return;
      }

      if (!isAuthenticated) {
        setListings([]);
        setTotalListings(0);
        setTotalPages(1);
        setUnlocatedCount(0);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      if (!locationReady) {
        setListings([]);
        setTotalListings(0);
        setTotalPages(1);
        setUnlocatedCount(0);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        setLoadError(false);
        const response = await getNearbyListings({
          radius,
          cropKey: selectedCrop === 'all' ? undefined : selectedCrop,
          search,
          page: currentPage,
          limit: PAGE_SIZE,
        }, signal);

        if (signal?.aborted) return;

        setListings(response.listings);
        setTotalListings(response.total);
        setTotalPages(Math.max(1, response.totalPages));
        setUnlocatedCount(response.unlocatedCount ?? 0);
      } catch {
        if (!signal?.aborted) {
          setListings([]);
          setTotalListings(0);
          setTotalPages(1);
          setUnlocatedCount(0);
          setLoadError(true);
        }
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [currentPage, isAuthLoading, isAuthenticated, locationReady, radius, search, selectedCrop],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadListings(false, controller.signal);

    return () => controller.abort();
  }, [loadListings]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    radius,
    selectedCrop,
  ]);

  const safePage = Math.min(
    currentPage,
    totalPages,
  );

  const paginatedListings = listings;

  const locationText = [...new Set(
    [village, taluka, district].filter((part): part is string => Boolean(part)),
  )].join(', ');

  /*
   * Profile does not contain usable coordinates.
   */
  if (
    !isAuthLoading &&
    isAuthenticated &&
    !locationReady &&
    !isLoading
  ) {
    return (
      <div className="mx-auto max-w-4xl py-6">
        <section className="rounded-2xl border border-border bg-surface px-5 py-10 text-center shadow-[0_12px_40px_rgba(0,0,0,0.10)] sm:px-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <MapPin
              className="h-6 w-6"
              aria-hidden="true"
            />
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
            {t(
              'dashboard.marketplaceBrowse.ux.completeProfile',
            )}
          </h1>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            {t(
              'dashboard.marketplaceBrowse.ux.completeProfileDesc',
            )}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/${locale}/dashboard/profile`,
              )
            }
            className="mt-5 h-10 rounded-xl bg-accent px-5 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-strong"
          >
            {t(
              'dashboard.marketplaceBrowse.ux.completeProfileCta',
            )}
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-3 pb-8">
      {/* =====================================================
          COMPACT HEADER
          ===================================================== */}

      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <Navigation
                className="h-3.5 w-3.5"
                aria-hidden="true"
              />
            </span>

            <h1 className="text-[26px] font-bold tracking-tight text-foreground sm:text-[28px]">
              {t(
                'dashboard.marketplaceBrowse.ux.nearbyTitle',
              )}
            </h1>
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            {t(
              'dashboard.marketplaceBrowse.ux.nearbySubtitle',
            )}
          </p>

          <div className="mt-2 inline-flex max-w-full items-center gap-1.5 text-xs text-foreground">
            <MapPin
              className="h-3.5 w-3.5 shrink-0 text-accent"
              aria-hidden="true"
            />

            <span className="truncate">
              {locationText ||
                t(
                  'dashboard.marketplaceBrowse.ux.nearbyComplete',
                )}
            </span>
          </div>
        </div>

        {/* HEADER STATS */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="rounded-xl border border-border bg-surface px-3 py-2 text-center">
            <div className="text-base font-bold text-foreground">
              {totalListings}
            </div>

            <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
              {t(
                'dashboard.marketplaceBrowse.ux.summaryListings',
              )}
            </div>
          </div>

          <div className="rounded-xl border border-accent/10 bg-accent-soft px-3 py-2 text-center">
            <div className="text-base font-bold text-accent">
              {radius} km
            </div>

            <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
              {t(
                'dashboard.marketplaceBrowse.ux.radius',
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          SEARCH + RADIUS
          ===================================================== */}

      <section className="rounded-2xl border border-border bg-surface p-2">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder={t(
                'dashboard.marketplaceBrowse.ux.searchPlaceholder',
              )}
              aria-label={t(
                'dashboard.marketplaceBrowse.search.label',
              )}
              className="h-11 w-full rounded-xl border border-border bg-surface-subtle pl-10 pr-10 text-[13px] text-foreground outline-none placeholder:text-muted-foreground transition-colors focus:border-focus/30 focus:bg-surface"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label={t(
                  'dashboard.marketplaceBrowse.search.clear',
                )}
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-subtle hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* RADIUS */}
          <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <span className="mr-0.5 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t(
                'dashboard.marketplaceBrowse.ux.radius',
              )}
            </span>

            {RADII.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  setRadius(value)
                }
                aria-pressed={
                  radius === value
                }
                className={cn(
                  'h-8 shrink-0 rounded-lg px-3 text-[11px] font-semibold transition-colors',
                  radius === value
                    ? 'bg-accent text-accent-foreground shadow-sm'
                    : 'border border-border bg-surface text-muted-foreground hover:bg-surface-subtle hover:text-foreground',
                )}
              >
                {value} km
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          CROP FILTERS
          ===================================================== */}

      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() =>
            setSelectedCrop('all')
          }
          aria-pressed={
            selectedCrop === 'all'
          }
          className={cn(
            'inline-flex h-8 shrink-0 items-center rounded-lg px-3 text-[11px] font-semibold transition-colors',
            selectedCrop === 'all'
              ? 'bg-accent text-accent-foreground'
              : 'border border-border bg-surface text-muted-foreground hover:bg-surface-subtle hover:text-foreground',
          )}
        >
          {t(
            'dashboard.marketplaceBrowse.ux.allCrops',
          )}
        </button>

        {CROPS.map((crop) => (
          <button
            key={crop}
            type="button"
            onClick={() =>
              setSelectedCrop(
                selectedCrop === crop
                  ? 'all'
                  : crop,
              )
            }
            aria-pressed={
              selectedCrop === crop
            }
            className={cn(
              'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[11px] font-semibold transition-colors',
              selectedCrop === crop
                ? 'bg-accent text-accent-foreground'
                : 'border border-border bg-surface text-muted-foreground hover:bg-surface-subtle hover:text-foreground',
            )}
          >
            <span aria-hidden="true">
              {CROP_EMOJI[crop]}
            </span>

            {t(
              `dashboard.marketplaceBrowse.crop.${crop}`,
            )}
          </button>
        ))}
      </div>

      {/* =====================================================
          RESULTS HEADER
          ===================================================== */}

      <div className="flex min-h-10 items-center justify-between gap-3 px-0.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-[17px] font-bold text-foreground">
              {t(
                'dashboard.marketplaceBrowse.ux.nearbyTitle',
              )}
            </h2>

            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent">
              {totalListings}
            </span>
          </div>

          <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock3
              className="h-3 w-3"
              aria-hidden="true"
            />

            {t(
              'dashboard.marketplaceBrowse.ux.sortedBy',
              {
                sort: t(
                  'dashboard.marketplaceBrowse.sort.nearest',
                ),
              },
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void loadListings(true)
          }
          disabled={isRefreshing}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 text-[10px] font-semibold text-muted-foreground transition-colors hover:bg-surface-subtle hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={cn(
              'h-3 w-3',
              isRefreshing &&
                'animate-spin',
            )}
            aria-hidden="true"
          />

          {t(
            'dashboard.marketplaceBrowse.ux.refresh',
          )}
        </button>
      </div>

      {/* =====================================================
          LOADING
          ===================================================== */}

      {unlocatedCount > 0 && !isLoading ? (
        <p role="status" className="rounded-xl border border-border bg-surface-subtle px-4 py-3 text-xs leading-5 text-muted-foreground">
          {t('dashboard.marketplaceBrowse.ux.unlocatedListings', { count: unlocatedCount })}
        </p>
      ) : null}

      {loadError && !isLoading ? (
        <section role="alert" className="rounded-2xl border border-border bg-surface px-5 py-8 text-center">
          <p className="text-sm font-semibold text-foreground">
            {t('dashboard.marketplaceBrowse.ux.nearbyLoadError')}
          </p>
          <button type="button" onClick={() => void loadListings(true)} className="mt-4 h-9 rounded-lg bg-accent px-4 text-xs font-bold text-accent-foreground">
            {t('dashboard.marketplaceBrowse.ux.refresh')}
          </button>
        </section>
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({
            length: 6,
          }).map((_, index) => (
            <NearbyCardSkeleton
              key={index}
            />
          ))}
        </div>
      ) : paginatedListings.length > 0 ? (
        <>
          {/* =================================================
              LISTINGS
              ================================================= */}

          <MarketplaceGrid
            listings={paginatedListings}
            isAuthenticated={isAuthenticated}
            isAuthLoading={isAuthLoading}
          />

          {/* =================================================
              PAGINATION
              ================================================= */}

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/[0.06] pt-3">
              <p className="text-[10px] text-muted-foreground">
                {(safePage - 1) *
                  PAGE_SIZE +
                  1}
                –
                {Math.min(
                  safePage * PAGE_SIZE,
                  totalListings,
                )}{' '}
                / {totalListings}
              </p>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={
                    safePage === 1
                  }
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        page - 1,
                    )
                  }
                  className="h-8 rounded-lg border border-border px-3 text-[10px] text-muted-foreground hover:bg-surface disabled:opacity-30"
                >
                  ‹
                </button>

                <span className="px-2 text-[10px] font-semibold text-muted-foreground">
                  {safePage} /{' '}
                  {totalPages}
                </span>

                <button
                  type="button"
                  disabled={
                    safePage ===
                    totalPages
                  }
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        page + 1,
                    )
                  }
                  className="h-8 rounded-lg border border-border px-3 text-[10px] text-muted-foreground hover:bg-surface disabled:opacity-30"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* ===================================================
           EMPTY STATE
           =================================================== */

        <section className="rounded-2xl border border-border bg-surface px-5 py-10 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <MapPin
              className="h-5 w-5"
              aria-hidden="true"
            />
          </div>

          <h3 className="mt-3 text-base font-bold text-foreground">
            {t(
              'dashboard.marketplaceBrowse.ux.nearbyNoResultsTitle',
            )}
          </h3>

          <p className="mx-auto mt-1.5 max-w-sm text-xs leading-5 text-muted-foreground">
            {t(
              'dashboard.marketplaceBrowse.ux.nearbyNoResultsSubtitle',
            )}
          </p>

          <div className="mt-4 flex justify-center gap-2">
            {radius < 50 && (
              <button
                type="button"
                onClick={() =>
                  setRadius(
                    radius === 5
                      ? 10
                      : radius === 10
                        ? 25
                        : 50,
                  )
                }
                className="h-9 rounded-lg bg-accent px-4 text-xs font-bold text-accent-foreground hover:bg-accent-strong"
              >
                {t(
                  'dashboard.marketplaceBrowse.ux.expandRadius',
                )}
              </button>
            )}

            {(search ||
              selectedCrop !==
                'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedCrop(
                    'all',
                  );
                }}
                className="h-9 rounded-lg border border-border bg-surface px-4 text-xs font-semibold text-foreground hover:bg-surface-subtle hover:text-foreground"
              >
                {t(
                  'dashboard.marketplaceBrowse.ux.clearAll',
                )}
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
