'use client';

import {
  useCallback,
  useEffect,
  useMemo,
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

import { getListings } from '@/services/api/listings.api';

import type {
  CropKey,
  CropListing,
} from '@/data/marketplace-listings';

import { CROPS } from '@/data/marketplace-listings';

import {
  haversineKm,
  useProfileLocation,
} from '@/hooks/use-profile-location';

import { NearbyListingCard } from '@/components/marketplace/nearby-listing-card';

import { cn } from '@/utils/cn';

const PAGE_SIZE = 9;

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
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035]">
      <div className="aspect-[16/9] skeleton-shimmer" />

      <div className="space-y-2.5 p-3.5">
        <div className="h-4 w-2/5 rounded skeleton-shimmer" />
        <div className="h-3 w-1/3 rounded skeleton-shimmer" />
        <div className="h-6 w-1/2 rounded skeleton-shimmer" />
        <div className="h-3 w-3/4 rounded skeleton-shimmer" />
        <div className="h-3 w-full rounded skeleton-shimmer" />
        <div className="h-9 w-full rounded-xl skeleton-shimmer" />
      </div>
    </div>
  );
}

export function NearbyListingsPage() {
  const t = useTranslations();

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

  /*
   * Important:
   * A district alone is NOT enough for distance filtering.
   * We require real saved coordinates.
   */
  const locationReady =
    (available &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude !== 0 &&
      longitude !== 0) ||
    Boolean(village || taluka || district);

  const hasCoordinates =
    available &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude !== 0 &&
    longitude !== 0;

  const matchesSavedLocation = useCallback((listing: CropListing) => {
    const normalizeLocation = (value?: string) =>
      value?.trim().toLowerCase() ?? '';
    const savedVillage = normalizeLocation(village);
    const savedTaluka = normalizeLocation(taluka);
    const savedDistrict = normalizeLocation(district);

    if (savedVillage) {
      return normalizeLocation(listing.village) === savedVillage;
    }

    if (savedTaluka) {
      return normalizeLocation(listing.taluka) === savedTaluka;
    }

    return (
      Boolean(savedDistrict) &&
      normalizeLocation(listing.district) === savedDistrict
    );
  }, [district, taluka, village]);

  const [
    listings,
    setListings,
  ] = useState<CropListing[]>([]);

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
    async (refresh = false) => {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const response = await getListings();

        setListings(response.listings);
      } catch {
        setListings([]);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadListings();
  }, [loadListings]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    radius,
    selectedCrop,
  ]);

  /*
   * REAL nearby filtering:
   *
   * 1. Only active + available listings
   * 2. Calculate distance using Haversine
   * 3. Keep only listings <= selected radius
   * 4. Apply crop filter
   * 5. Apply search
   * 6. Sort nearest first
   */
  const nearbyListings = useMemo(() => {
    if (!locationReady) {
      return [];
    }

    const query =
      search.trim().toLowerCase();

    return listings
      .filter(
        (listing) =>
          listing.status !== 'inactive' &&
          listing.availability === 'available',
      )
      .filter((listing) => hasCoordinates || matchesSavedLocation(listing))
      .map((listing) => ({
        listing,
        distanceKm: hasCoordinates
          ? haversineKm(
              latitude,
              longitude,
              listing.lat,
              listing.lng,
            )
          : 0,
      }))
      .filter(
        ({
          listing,
          distanceKm,
        }) => {
          if (distanceKm > radius) {
            return false;
          }

          if (
            selectedCrop !== 'all' &&
            listing.cropKey !== selectedCrop
          ) {
            return false;
          }

          if (query) {
            const cropLabel = t(
              `dashboard.marketplaceBrowse.crop.${listing.cropKey}`,
            ).toLowerCase();

            const villageName =
              listing.village.toLowerCase();

            const farmerName =
              listing.farmerName.toLowerCase();

            const variety =
              (
                listing.variety ?? ''
              ).toLowerCase();

            const districtName =
              listing.district.toLowerCase();

            if (
              !cropLabel.includes(query) &&
              !villageName.includes(query) &&
              !farmerName.includes(query) &&
              !variety.includes(query) &&
              !districtName.includes(query)
            ) {
              return false;
            }
          }

          return true;
        },
      )
      .sort(
        (a, b) =>
          a.distanceKm - b.distanceKm,
      );
  }, [
    locationReady,
    latitude,
    longitude,
    hasCoordinates,
    matchesSavedLocation,
    listings,
    radius,
    search,
    selectedCrop,
    t,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      nearbyListings.length /
        PAGE_SIZE,
    ),
  );

  const safePage = Math.min(
    currentPage,
    totalPages,
  );

  const paginatedListings =
    nearbyListings.slice(
      (safePage - 1) *
        PAGE_SIZE,
      safePage * PAGE_SIZE,
    );

  const handleViewDetails =
    useCallback(
      (listing: CropListing) => {
        router.push(
          `/${locale}/dashboard/marketplace/${listing.id}`,
        );
      },
      [locale, router],
    );

  const locationText = [
    village,
    taluka,
    district,
  ]
    .filter(Boolean)
    .join(', ');

  /*
   * Profile does not contain usable coordinates.
   */
  if (
    !locationReady &&
    !isLoading
  ) {
    return (
      <div className="mx-auto max-w-4xl py-6">
        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.035] px-5 py-10 text-center shadow-[0_12px_40px_rgba(0,0,0,0.10)] sm:px-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
            <MapPin
              className="h-6 w-6"
              aria-hidden="true"
            />
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">
            {t(
              'dashboard.marketplaceBrowse.ux.completeProfile',
            )}
          </h1>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/55">
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
            className="mt-5 h-10 rounded-xl bg-emerald-500 px-5 text-sm font-bold text-white transition-colors hover:bg-emerald-400"
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

      <section className="flex flex-col gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300">
              <Navigation
                className="h-3.5 w-3.5"
                aria-hidden="true"
              />
            </span>

            <h1 className="text-[26px] font-bold tracking-tight text-white sm:text-[28px]">
              {t(
                'dashboard.marketplaceBrowse.ux.nearbyTitle',
              )}
            </h1>
          </div>

          <p className="mt-1 text-xs text-white/45">
            {t(
              'dashboard.marketplaceBrowse.ux.nearbySubtitle',
            )}
          </p>

          <div className="mt-2 inline-flex max-w-full items-center gap-1.5 text-xs text-white/70">
            <MapPin
              className="h-3.5 w-3.5 shrink-0 text-emerald-300"
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
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-center">
            <div className="text-base font-bold text-white">
              {nearbyListings.length}
            </div>

            <div className="text-[9px] uppercase tracking-wider text-white/35">
              {t(
                'dashboard.marketplaceBrowse.ux.summaryListings',
              )}
            </div>
          </div>

          <div className="rounded-xl border border-emerald-300/10 bg-emerald-400/[0.05] px-3 py-2 text-center">
            <div className="text-base font-bold text-emerald-300">
              {radius} km
            </div>

            <div className="text-[9px] uppercase tracking-wider text-white/35">
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

      <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-2">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35"
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
              className="h-11 w-full rounded-xl border border-white/[0.07] bg-black/10 pl-10 pr-10 text-[13px] text-white outline-none placeholder:text-white/30 transition-colors focus:border-emerald-300/30 focus:bg-white/[0.04]"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label={t(
                  'dashboard.marketplaceBrowse.search.clear',
                )}
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-white/40 hover:bg-white/10 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* RADIUS */}
          <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <span className="mr-0.5 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-white/35">
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
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'border border-white/[0.07] bg-white/[0.03] text-white/55 hover:bg-white/[0.07] hover:text-white',
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
              ? 'bg-emerald-500 text-white'
              : 'border border-white/[0.07] bg-white/[0.025] text-white/55 hover:bg-white/[0.06] hover:text-white',
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
                ? 'bg-emerald-500 text-white'
                : 'border border-white/[0.07] bg-white/[0.025] text-white/55 hover:bg-white/[0.06] hover:text-white',
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
            <h2 className="text-[17px] font-bold text-white">
              {t(
                'dashboard.marketplaceBrowse.ux.nearbyTitle',
              )}
            </h2>

            <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
              {nearbyListings.length}
            </span>
          </div>

          <p className="mt-0.5 flex items-center gap-1 text-[10px] text-white/35">
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
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.025] px-2.5 text-[10px] font-semibold text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
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

      {isLoading ? (
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {paginatedListings.map(
              (
                {
                  listing,
                  distanceKm,
                },
                index,
              ) => (
                <NearbyListingCard
                  key={listing.id}
                  listing={listing}
                  distanceKm={distanceKm}
                  index={index}
                  onViewDetails={
                    handleViewDetails
                  }
                />
              ),
            )}
          </div>

          {/* =================================================
              PAGINATION
              ================================================= */}

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
              <p className="text-[10px] text-white/35">
                {(safePage - 1) *
                  PAGE_SIZE +
                  1}
                –
                {Math.min(
                  safePage * PAGE_SIZE,
                  nearbyListings.length,
                )}{' '}
                / {nearbyListings.length}
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
                  className="h-8 rounded-lg border border-white/[0.07] px-3 text-[10px] text-white/55 hover:bg-white/[0.05] disabled:opacity-30"
                >
                  ‹
                </button>

                <span className="px-2 text-[10px] font-semibold text-white/60">
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
                  className="h-8 rounded-lg border border-white/[0.07] px-3 text-[10px] text-white/55 hover:bg-white/[0.05] disabled:opacity-30"
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

        <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-5 py-10 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
            <MapPin
              className="h-5 w-5"
              aria-hidden="true"
            />
          </div>

          <h3 className="mt-3 text-base font-bold text-white">
            {t(
              'dashboard.marketplaceBrowse.ux.nearbyNoResultsTitle',
            )}
          </h3>

          <p className="mx-auto mt-1.5 max-w-sm text-xs leading-5 text-white/45">
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
                className="h-9 rounded-lg bg-emerald-500 px-4 text-xs font-bold text-white hover:bg-emerald-400"
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
                className="h-9 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 text-xs font-semibold text-white/65 hover:bg-white/[0.07] hover:text-white"
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
