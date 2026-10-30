
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdaptiveLink as Link } from '@/components/performance/adaptive-link';
import { usePathname, useRouter, useParams, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { getDomainSearchAliases, getLocalizedDomainName } from '@agri/domain-data';

import { MarketplaceSearch } from '@/components/marketplace/marketplace-search';
import { MarketplaceQuickChips } from '@/components/marketplace/marketplace-quick-chips';
import { MarketplaceActionBar } from '@/components/marketplace/marketplace-action-bar';

import {
  MarketplaceFilterSheet,
  type FilterSheetMode,
} from '@/components/marketplace/marketplace-filter-sheet';

import {
  DEFAULT_FILTERS,
  type MarketplaceFilterState,
} from '@/components/marketplace/marketplace-filters';

import { MarketplaceGrid } from '@/components/marketplace/marketplace-grid';
import { MarketplaceSkeleton } from '@/components/marketplace/marketplace-skeleton';
import { MarketplaceEmptyState } from '@/components/marketplace/marketplace-empty-state';
import { Pagination } from '@/components/marketplace/pagination';
import { MarketplaceActiveFilters } from '@/components/marketplace/marketplace-active-filters';
import { getListingCreatedAtTimestamp } from '@/utils/listing-date';

import { getListings } from '@/services/api/listings.api';
import { useAuth } from '@/hooks/use-auth';

import {
  PRICE_RANGES,
  QUANTITY_RANGES,
  CROPS,
  SORT_OPTIONS,
  type CropListing,
  type CropKey,
  type SortKey,
} from '@/data/marketplace-listings';

/*
 * Number of listings shown on one page.
 */
const PAGE_SIZE = 12;

/**
 * Marketplace dashboard page.
 *
 * Listings come from the database through the marketplace API.
 */
export function MarketplacePage() {
  const t = useTranslations();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialQuery = new URLSearchParams(searchParams.toString());
  const params = useParams();

  const locale =
    (params?.locale as string) || 'en';

  const [listings, setListings] =
    useState<CropListing[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);
  const [nearestLocationAvailable, setNearestLocationAvailable] = useState<boolean | null>(null);
  const [nearestUnlocatedCount, setNearestUnlocatedCount] = useState(0);
  const [nearestTotal, setNearestTotal] = useState(0);

  const [search, setSearch] =
    useState(() => initialQuery.get('q') ?? '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const searchTerms = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? [query, ...getDomainSearchAliases(search).map((term) => term.toLowerCase())]
      : [];
  }, [search]);

  const [filters, setFilters] =
    useState<MarketplaceFilterState>(
      () => {
        const crop = initialQuery.get('crop');
        const priceRange = initialQuery.get('price');
        const quantity = initialQuery.get('quantity');
        const sort = initialQuery.get('sort');
        return {
          ...DEFAULT_FILTERS,
          crop: crop && CROPS.includes(crop as CropKey) ? crop as CropKey : 'all',
          district: initialQuery.get('district') || 'all',
          village: initialQuery.get('village') || 'all',
          priceRange: priceRange && PRICE_RANGES.some((range) => range.key === priceRange) ? priceRange : 'all',
          quantity: quantity && QUANTITY_RANGES.some((range) => range.key === quantity) ? quantity : 'all',
          verifiedOnly: initialQuery.get('verified') === '1',
          sort: sort && SORT_OPTIONS.some((option) => option.key === sort) ? sort as SortKey : 'newest',
        };
      },
    );

  const listingDistricts = useMemo(
    () => [...new Set(listings.map((listing) => listing.district).filter(Boolean))].sort(),
    [listings],
  );

  const listingVillages = useMemo(
    () => [...new Set(
      listings
        .filter((listing) => filters.district === 'all' || listing.district === filters.district)
        .flatMap((listing) => listing.village ? [listing.village] : []),
    )].sort(),
    [filters.district, listings],
  );

  const [selectedChip, setSelectedChip] =
    useState<CropKey | 'all'>(() => {
      const crop = initialQuery.get('crop');
      return crop && CROPS.includes(crop as CropKey) ? crop as CropKey : 'all';
    });

  const [sheetOpen, setSheetOpen] =
    useState(false);

  const [sheetMode, setSheetMode] =
    useState<FilterSheetMode>('filters');

  const [currentPage, setCurrentPage] =
    useState(() => {
      const page = Number(initialQuery.get('page'));
      return Number.isInteger(page) && page > 0 ? page : 1;
    });
  const hasMountedBrowseState = useRef(false);

  // Keep browse state in the URL so pagination, refresh, and returning from a
  // listing detail preserve the farmer's current result set.
  useEffect(() => {
    const next = new URLSearchParams();
    if (search.trim()) next.set('q', search.trim());
    const activeCrop = selectedChip !== 'all' ? selectedChip : filters.crop;
    if (activeCrop !== 'all') next.set('crop', activeCrop);
    if (filters.district !== 'all') next.set('district', filters.district);
    if (filters.village !== 'all') next.set('village', filters.village);
    if (filters.priceRange !== 'all') next.set('price', filters.priceRange);
    if (filters.quantity !== 'all') next.set('quantity', filters.quantity);
    if (filters.verifiedOnly) next.set('verified', '1');
    if (filters.sort !== 'newest') next.set('sort', filters.sort);
    if (currentPage > 1) next.set('page', String(currentPage));

    const query = next.toString();
    const current = searchParams.toString();
    if (query !== current) {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }
  }, [
    currentPage,
    filters,
    pathname,
    router,
    search,
    searchParams,
    selectedChip,
  ]);

  /*
   * ==========================================================
   * LOAD LISTINGS
   * ==========================================================
   */

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    const activeCrop = selectedChip !== 'all' ? selectedChip : filters.crop;
    const priceRange = PRICE_RANGES.find((range) => range.key === filters.priceRange);
    const quantityRange = QUANTITY_RANGES.find((range) => range.key === filters.quantity);
    const nearest = filters.sort === 'nearest';

    setIsLoading(true);
    setNearestLocationAvailable(null);
    setNearestUnlocatedCount(0);
    setNearestTotal(0);

    void getListings(nearest
      ? {
          sort: 'nearest',
          ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
          ...(activeCrop !== 'all' ? { cropKey: activeCrop } : {}),
          ...(filters.district !== 'all' ? { district: filters.district } : {}),
          ...(filters.village !== 'all' ? { village: filters.village } : {}),
          ...(filters.verifiedOnly ? { verified: true } : {}),
          ...(priceRange ? { priceMin: priceRange.min, ...(Number.isFinite(priceRange.max) ? { priceMax: priceRange.max } : {}) } : {}),
          ...(quantityRange ? { quantityMin: quantityRange.min, ...(Number.isFinite(quantityRange.max) ? { quantityMax: quantityRange.max } : {}) } : {}),
          page: currentPage,
          limit: PAGE_SIZE,
        }
      : { page: 1, limit: 100 }, controller.signal)
      .then((response) => {
        if (mounted) {
          setListings(response.listings);
          setNearestLocationAvailable(nearest ? response.locationAvailable ?? false : null);
          setNearestUnlocatedCount(nearest ? response.unlocatedCount ?? 0 : 0);
          setNearestTotal(nearest ? response.total : 0);
        }
      })
      .catch(() => {
        if (mounted) {
          setListings([]);
          setNearestLocationAvailable(nearest ? false : null);
          setNearestUnlocatedCount(0);
          setNearestTotal(0);
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [
    currentPage,
    debouncedSearch,
    filters.district,
    filters.crop,
    filters.priceRange,
    filters.quantity,
    filters.sort,
    filters.verifiedOnly,
    filters.village,
    selectedChip,
  ]);

  /*
   * ==========================================================
   * RESET PAGINATION WHEN FILTERS CHANGE
   * ==========================================================
   */

  useEffect(() => {
    if (!hasMountedBrowseState.current) {
      hasMountedBrowseState.current = true;
      return;
    }
    setCurrentPage(1);
  }, [
    search,
    filters,
    selectedChip,
  ]);

  /*
   * ==========================================================
   * NORMAL FILTERING
   * ==========================================================
   */

  const isValidListing = useCallback(
    (listing: CropListing) => {
      const query =
        search.trim().toLowerCase();

      /*
       * SEARCH
       */
      if (query) {
        const cropLabel = (listing.cropKey === 'other'
          ? t('dashboard.marketplaceBrowse.crop.other')
          : getLocalizedDomainName(listing.cropKey, locale, 'crop')).toLowerCase();

        const districtLabel = getLocalizedDomainName(listing.district, locale, 'district').toLowerCase();
        const talukaLabel = getLocalizedDomainName(listing.taluka ?? '', locale, 'taluka').toLowerCase();
        const villageLabel = getLocalizedDomainName(listing.village ?? '', locale, 'village').toLowerCase();

        const village =
          (listing.village ?? '').toLowerCase();

        const farmer =
          (listing.farmerName ?? '').toLowerCase();
        const searchableValues = [
          cropLabel,
          listing.cropKey.toLowerCase(),
          districtLabel,
          listing.district.toLowerCase(),
          talukaLabel,
          (listing.taluka ?? '').toLowerCase(),
          villageLabel,
          village,
          farmer,
        ];

        if (!searchTerms.some((term) => searchableValues.some((value) => value.includes(term)))) {
          return false;
        }
      }

      /*
       * CROP
       */
      const activeCrop =
        selectedChip !== 'all'
          ? selectedChip
          : filters.crop;

      if (
        activeCrop !== 'all' &&
        listing.cropKey !== activeCrop
      ) {
        return false;
      }

      /*
       * DISTRICT
       */
      if (
        filters.district !== 'all' &&
        listing.district !==
          filters.district
      ) {
        return false;
      }

      /*
       * VILLAGE
       */
      if (
        filters.village !== 'all' &&
        listing.village !==
          filters.village
      ) {
        return false;
      }

      /*
       * VERIFIED FARMERS
       */
      if (
        filters.verifiedOnly &&
        !listing.verified
      ) {
        return false;
      }

      /*
       * PRICE
       */
      if (
        filters.priceRange !== 'all'
      ) {
        const range =
          PRICE_RANGES.find(
            (item) =>
              item.key ===
              filters.priceRange,
          );

        if (
          range &&
          (
            listing.price < range.min ||
            listing.price >= range.max
          )
        ) {
          return false;
        }
      }

      /*
       * QUANTITY
       *
       * Normalize everything to quintals
       * for filtering.
       */
      if (
        filters.quantity !== 'all'
      ) {
        const range =
          QUANTITY_RANGES.find(
            (item) =>
              item.key ===
              filters.quantity,
          );

        const qtyInQuintal =
          listing.unit === 'ton'
            ? listing.quantity * 10
            : listing.unit === 'kg'
              ? listing.quantity / 100
              : listing.quantity;

        if (
          range &&
          (
            qtyInQuintal < range.min ||
            qtyInQuintal >= range.max
          )
        ) {
          return false;
        }
      }

      return true;
    },
    [
      search,
      searchTerms,
      filters,
      selectedChip,
      locale,
      t,
    ],
  );

  /*
   * ==========================================================
   * NORMAL FILTERED LIST
   * ==========================================================
   */

  const filtered = useMemo(() => {
    if (filters.sort === 'nearest') return listings;
    return listings.filter(
      (listing) =>
        listing.status !==
          'inactive' &&
        isValidListing(listing),
    );
  }, [
    listings,
    isValidListing,
    filters.sort,
  ]);

  /*
   * ==========================================================
   * SORT
   * ==========================================================
   */

  const sorted = useMemo(() => {
    const list = [...filtered];
    if (filters.sort === 'nearest') return list;

    /*
     * Normal marketplace sorting.
     */
    const sorters: Record<
      SortKey,
      (
        a: CropListing,
        b: CropListing,
      ) => number
    > = {
      newest: (a, b) => {
        const aCreatedAt = getListingCreatedAtTimestamp(a.createdAt);
        const bCreatedAt = getListingCreatedAtTimestamp(b.createdAt);

        if (aCreatedAt !== null && bCreatedAt !== null) {
          return bCreatedAt - aCreatedAt;
        }
        if (aCreatedAt !== null) return -1;
        if (bCreatedAt !== null) return 1;
        return a.postedHoursAgo - b.postedHoursAgo;
      },

      lowestPrice: (a, b) =>
        a.price - b.price,

      highestPrice: (a, b) =>
        b.price - a.price,

      nearest: (a, b) =>
        a.distanceKm -
        b.distanceKm,

      mostQty: (a, b) =>
        b.quantity -
        a.quantity,
    };

    return list.sort(
      sorters[filters.sort],
    );
  }, [
    filtered,
    filters.sort,
  ]);

  /*
   * ==========================================================
   * ACTIVE FILTER COUNT
   * ==========================================================
   */

  const activeFilterCount =
    useMemo(() => {
      let count =
        (
          filters.district !==
          'all'
            ? 1
            : 0
        ) +
        (
          filters.village !==
          'all'
            ? 1
            : 0
        ) +
        (
          filters.priceRange !==
          'all'
            ? 1
            : 0
        ) +
        (
          filters.quantity !==
          'all'
            ? 1
            : 0
        ) +
        (
          filters.verifiedOnly
            ? 1
            : 0
        );

      if (
        selectedChip !==
        'all'
      ) {
        count += 1;
      }

      if (
        search.trim()
      ) {
        count += 1;
      }

      return count;
    }, [
      filters,
      selectedChip,
      search,
    ]);

  /*
   * ==========================================================
   * PAGINATION
   * ==========================================================
   */

  const totalPages =
    Math.max(
      1,
      filters.sort === 'nearest'
        ? Math.ceil(nearestTotal / PAGE_SIZE)
        : Math.ceil(sorted.length / PAGE_SIZE),
    );

  const safePage =
    Math.min(
      currentPage,
      totalPages,
    );

  const paginated =
    useMemo(() => {
      const start =
        (safePage - 1) *
        PAGE_SIZE;

      if (filters.sort === 'nearest') return sorted;

      return sorted.slice(
        start,
        start + PAGE_SIZE,
      );
    }, [
      sorted,
      safePage,
      filters.sort,
    ]);

  /*
   * ==========================================================
   * ACTIONS
   * ==========================================================
   */

  const handleReset =
    useCallback(() => {
      setSearch('');
      setFilters(
        DEFAULT_FILTERS,
      );
      setSelectedChip('all');
    }, []);

  const handleBrowseAll =
    useCallback(() => {
      handleReset();
    }, [
      handleReset,
    ]);

  const handleRemoveFilter =
    useCallback(
      (key: string) => {
        switch (key) {
          case 'crop':
            setSelectedChip(
              'all',
            );

            setFilters(
              (prev) => ({
                ...prev,
                crop: 'all',
              }),
            );
            break;

          case 'district':
            setFilters(
              (prev) => ({
                ...prev,
                district: 'all',
                village: 'all',
              }),
            );
            break;

          case 'priceRange':
            setFilters(
              (prev) => ({
                ...prev,
                priceRange: 'all',
              }),
            );
            break;

          case 'search':
            setSearch('');
            break;

        }
      },
      [],
    );

  const handleOpenSheet =
    useCallback(
      (mode: FilterSheetMode) => {
        setSheetMode(mode);
        setSheetOpen(true);
      },
      [],
    );

  /*
   * ==========================================================
   * UI
   * ==========================================================
   */

  return (
    <div className="space-y-3">
      <h1 className="sr-only">{t('dashboard.marketplaceBrowse.header.title')}</h1>

      {/* ======================================================
          SEARCH + ACTION BAR
         ====================================================== */}

      <div
        className="sticky top-0 z-30 -mx-4 border-y border-border/70 bg-canvas/95 px-4 py-2 shadow-sm backdrop-blur-lg sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
      >
        <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
          <div className="min-w-0 flex-1">
            <MarketplaceSearch value={search} onChange={setSearch} />
          </div>

          <div className="shrink-0">
            <MarketplaceActionBar
              onOpenFilters={() =>
                handleOpenSheet(
                  'filters',
                )
              }
              onOpenSort={() =>
                handleOpenSheet(
                  'sort',
                )
              }
              filterCount={
                activeFilterCount
              }
            />
          </div>

          <Link
            href={`/${locale}/${isAuthenticated ? 'dashboard/marketplace/create' : 'auth'}`}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('dashboard.myListings.createCta')}
          </Link>
        </div>
      </div>

      {/* ======================================================
          CROP CHIPS
         ====================================================== */}

      <MarketplaceQuickChips
        selected={
          selectedChip
        }
        onSelect={
          setSelectedChip
        }
      />

      {/* ======================================================
          ACTIVE FILTERS
         ====================================================== */}

      <MarketplaceActiveFilters
        selectedChip={
          selectedChip
        }
        district={
          filters.district
        }
        priceRange={
          filters.priceRange
        }
        search={search}
        onRemove={
          handleRemoveFilter
        }
        onClearAll={
          handleReset
        }
      />

      {filters.sort === 'nearest' && nearestLocationAvailable === false ? (
        <p role="status" className="rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {t('dashboard.marketplaceBrowse.ux.nearestLocationUnavailable')}
        </p>
      ) : null}

      {filters.sort === 'nearest' && nearestLocationAvailable && nearestUnlocatedCount > 0 ? (
        <p role="status" className="rounded-xl border border-border bg-surface-subtle px-4 py-3 text-sm text-muted-foreground">
          {t('dashboard.marketplaceBrowse.ux.unlocatedListings', { count: nearestUnlocatedCount })}
        </p>
      ) : null}

      {/* ======================================================
          FILTER SHEET
         ====================================================== */}

      <MarketplaceFilterSheet
        open={sheetOpen}
        mode={sheetMode}
        filters={filters}
        districts={listingDistricts}
        villages={listingVillages}
        onClose={() =>
          setSheetOpen(false)
        }
        onChange={(nextFilters) => {
          setFilters(nextFilters);
          if (nextFilters.crop !== filters.crop) setSelectedChip('all');
        }}
      />

      {/* ======================================================
          LOADING
         ====================================================== */}

      {isLoading ? (
        <MarketplaceSkeleton />
      ) : paginated.length === 0 ? (
        /* ====================================================
           EMPTY
           ==================================================== */

        <MarketplaceEmptyState
          onReset={
            handleReset
          }
          onBrowseAll={
            handleBrowseAll
          }
        />
      ) : (
        <>
          {/* ==================================================
              LISTINGS
             ================================================== */}

          <MarketplaceGrid
            listings={
              paginated
            }
            isAuthenticated={isAuthenticated}
            isAuthLoading={isAuthLoading}
          />

          {/* ==================================================
              PAGINATION
             ================================================== */}

          <Pagination
            currentPage={
              safePage
            }
            totalPages={
              totalPages
            }
            onPageChange={
              setCurrentPage
            }
            totalItems={
              filters.sort === 'nearest' ? nearestTotal : sorted.length
            }
            pageSize={
              PAGE_SIZE
            }
          />
        </>
      )}
    </div>
  );
}
