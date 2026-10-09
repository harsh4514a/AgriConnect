// 'use client';

// import { useCallback, useEffect, useMemo, useState } from 'react';
// import { useRouter, useParams } from 'next/navigation';
// import { useTranslations } from 'next-intl';
// import { MarketplaceSearch } from '@/components/marketplace/marketplace-search';
// import { MarketplaceQuickChips } from '@/components/marketplace/marketplace-quick-chips';
// import { MarketplaceActionBar } from '@/components/marketplace/marketplace-action-bar';
// import {
//   MarketplaceFilterSheet,
//   type FilterSheetMode,
// } from '@/components/marketplace/marketplace-filter-sheet';
// import {
//   DEFAULT_FILTERS,
//   type MarketplaceFilterState,
// } from '@/components/marketplace/marketplace-filters';
// import { MarketplaceGrid } from '@/components/marketplace/marketplace-grid';
// import { MarketplaceSkeleton } from '@/components/marketplace/marketplace-skeleton';
// import { MarketplaceEmptyState } from '@/components/marketplace/marketplace-empty-state';
// import { Pagination } from '@/components/marketplace/pagination';
// import { MarketplaceNearby } from '@/components/marketplace/marketplace-nearby';
// import { MarketplaceActiveFilters } from '@/components/marketplace/marketplace-active-filters';
// import { MarketplaceSummary } from '@/components/marketplace/marketplace-summary';
// import { useProfileLocation, haversineKm } from '@/hooks/use-profile-location';
// import { getListings } from '@/services/api/listings.api';
// import {
//   PRICE_RANGES,
//   QUANTITY_RANGES,
//   type CropListing,
//   type CropKey,
//   type SortKey,
// } from '@/data/marketplace-listings';

// const PAGE_SIZE = 12;

// /**
//  * Marketplace dashboard page.
//  * Farmer-friendly, mobile-first browsing with search, quick chips, nearby,
//  * and a bottom-sheet/modal filter+sort. Listings are loaded from PostgreSQL
//  * through the marketplace API; no browser-local listing data is used here.
//  */
// export function MarketplacePage() {
//   const t = useTranslations();
//   const router = useRouter();
//   const params = useParams();
//   const locale = (params?.locale as string) || 'en';

//   const { latitude, longitude, available, district } = useProfileLocation();

//   const [listings, setListings] = useState<CropListing[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [search, setSearch] = useState('');
//   const [filters, setFilters] = useState<MarketplaceFilterState>(DEFAULT_FILTERS);
//   const [selectedChip, setSelectedChip] = useState<CropKey | 'all'>('all');
//   const [nearMe, setNearMe] = useState(false);
//   const [sheetOpen, setSheetOpen] = useState(false);
//   const [sheetMode, setSheetMode] = useState<FilterSheetMode>('filters');
//   const [currentPage, setCurrentPage] = useState(1);

//   // The marketplace is database-backed. Do not fall back to the static or
//   // localStorage listing store when the API is unavailable.
//   useEffect(() => {
//     let mounted = true;

//     void getListings()
//       .then((response) => {
//         if (mounted) setListings(response.listings);
//       })
//       .catch(() => {
//         if (mounted) setListings([]);
//       })
//       .finally(() => {
//         if (mounted) setIsLoading(false);
//       });

//     return () => {
//       mounted = false;
//     };
//   }, []);

//   // Reset page when search/filters/chip change.
//   useEffect(() => {
//     setCurrentPage(1);
//   }, [search, filters, selectedChip, nearMe]);

//   const isValidListing = useCallback(
//     (listing: CropListing) => {
//       const query = search.trim().toLowerCase();
//       if (query) {
//         const cropLabel = t(`dashboard.marketplaceBrowse.crop.${listing.cropKey}`).toLowerCase();
//         const districtLabel = t(
//           `dashboard.marketplaceBrowse.district.${listing.district}`,
//         ).toLowerCase();
//         const village = listing.village.toLowerCase();
//         const farmer = listing.farmerName.toLowerCase();
//         if (
//           !cropLabel.includes(query) &&
//           !districtLabel.includes(query) &&
//           !village.includes(query) &&
//           !farmer.includes(query)
//         ) {
//           return false;
//         }
//       }

//       const activeCrop = selectedChip !== 'all' ? selectedChip : filters.crop;
//       if (activeCrop !== 'all' && listing.cropKey !== activeCrop) return false;
//       if (filters.district !== 'all' && listing.district !== filters.district) return false;
//       if (filters.village !== 'all' && listing.village !== filters.village) return false;
//       if (filters.verifiedOnly && !listing.verified) return false;

//       if (filters.priceRange !== 'all') {
//         const range = PRICE_RANGES.find((r) => r.key === filters.priceRange);
//         if (range && (listing.price < range.min || listing.price >= range.max)) return false;
//       }

//       if (filters.quantity !== 'all') {
//         const range = QUANTITY_RANGES.find((r) => r.key === filters.quantity);
//         const qtyInQuintal =
//           listing.unit === 'ton'
//             ? listing.quantity * 10
//             : listing.unit === 'kg'
//               ? listing.quantity / 100
//               : listing.quantity;
//         if (range && (qtyInQuintal < range.min || qtyInQuintal >= range.max)) return false;
//       }

//       return true;
//     },
//     [search, filters, selectedChip, t],
//   );

//   const filtered = useMemo(() => {
//     return listings.filter((l) => l.status !== 'inactive' && isValidListing(l));
//   }, [listings, isValidListing]);

//   const sorted = useMemo(() => {
//     const list = [...filtered];

//     // Near Me: sort by computed distance from the saved profile location.
//     if (nearMe && available) {
//       list.sort((a, b) => {
//         const da = haversineKm(latitude, longitude, a.lat, a.lng);
//         const db = haversineKm(latitude, longitude, b.lat, b.lng);
//         return da - db;
//       });
//       return list;
//     }

//     const sorters: Record<SortKey, (a: CropListing, b: CropListing) => number> = {
//       newest: (a, b) => a.postedHoursAgo - b.postedHoursAgo,
//       lowestPrice: (a, b) => a.price - b.price,
//       highestPrice: (a, b) => b.price - a.price,
//       nearest: (a, b) => a.distanceKm - b.distanceKm,
//       mostQty: (a, b) => b.quantity - a.quantity,
//     };
//     return list.sort(sorters[filters.sort]);
//   }, [filtered, filters.sort, nearMe, available, latitude, longitude]);

//   const nearbyCount = useMemo(() => {
//     if (!available) return 0;
//     return listings.filter(
//       (l: CropListing) =>
//         l.status !== 'inactive' && haversineKm(latitude, longitude, l.lat, l.lng) <= 30,
//     ).length;
//   }, [listings, available, latitude, longitude]);

//   // Count of explicitly applied filters (used for the Filter (n) badge).
//   const activeFilterCount = useMemo(() => {
//     let count =
//       (filters.district !== 'all' ? 1 : 0) +
//       (filters.village !== 'all' ? 1 : 0) +
//       (filters.priceRange !== 'all' ? 1 : 0) +
//       (filters.quantity !== 'all' ? 1 : 0) +
//       (filters.verifiedOnly ? 1 : 0);
//     if (selectedChip !== 'all') count += 1;
//     if (search.trim()) count += 1;
//     if (nearMe) count += 1;
//     return count;
//   }, [filters, selectedChip, search, nearMe]);

//   const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
//   const safePage = Math.min(currentPage, totalPages);
//   const paginated = useMemo(() => {
//     const start = (safePage - 1) * PAGE_SIZE;
//     return sorted.slice(start, start + PAGE_SIZE);
//   }, [sorted, safePage]);

//   const handleViewDetails = useCallback((listing: CropListing) => {
//     router.push(`/${locale}/dashboard/marketplace/${listing.id}`);
//   }, [locale, router]);

//   const handleReset = useCallback(() => {
//     setSearch('');
//     setFilters(DEFAULT_FILTERS);
//     setSelectedChip('all');
//     setNearMe(false);
//   }, []);

//   const handleBrowseAll = useCallback(() => {
//     setSelectedChip('all');
//     handleReset();
//   }, [handleReset]);

//   const handleRemoveFilter = useCallback((key: string) => {
//     switch (key) {
//       case 'crop':
//         setSelectedChip('all');
//         setFilters((prev) => ({ ...prev, crop: 'all' }));
//         break;
//       case 'district':
//         setFilters((prev) => ({ ...prev, district: 'all', village: 'all' }));
//         break;
//       case 'priceRange':
//         setFilters((prev) => ({ ...prev, priceRange: 'all' }));
//         break;
//       case 'search':
//         setSearch('');
//         break;
//       case 'nearMe':
//         setNearMe(false);
//         break;
//     }
//   }, []);

//   const handleOpenSheet = (mode: FilterSheetMode) => {
//     setSheetMode(mode);
//     setSheetOpen(true);
//   };

//   const handleCompleteProfile = useCallback(() => {
//   }, [locale, router]);

//   return (
//     <div className="space-y-3">
//       {/* Light glass toolbar: Search + Filter/Sort/NearMe. No heavy wrapper. */}
//       <div
//         className="sticky top-0 z-30 -mx-4 px-4 py-2 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
//         style={{ background: 'rgba(7,19,11,0.72)' }}
//       >
//         <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
//           {/* Search: ~60% width on desktop, full width on mobile */}
//           <div className="w-full sm:w-[60%]">
//             <MarketplaceSearch value={search} onChange={setSearch} />
//           </div>

//           {/* Action buttons: Filter / Sort / Nearby (compact pills) */}
//           <div className="w-full sm:w-auto sm:flex-1">
//             <MarketplaceActionBar
//               onOpenFilters={() => handleOpenSheet('filters')}
//               onOpenSort={() => handleOpenSheet('sort')}
//               onNearby={() => setNearMe((prev) => !prev)}
//               nearbyActive={nearMe}
//               nearbyDisabled={!available}
//               filterCount={activeFilterCount}
//             />
//           </div>
//         </div>
//       </div>

//       {/* Quick crop chips — scrolls away naturally (below sticky toolbar) */}
//       <MarketplaceQuickChips selected={selectedChip} onSelect={setSelectedChip} />

//       {/* Active filter chips (only when a filter is applied) */}
//       <MarketplaceActiveFilters
//         selectedChip={selectedChip}
//         district={filters.district}
//         priceRange={filters.priceRange}
//         search={search}
//         nearMe={nearMe}
//         onRemove={handleRemoveFilter}
//         onClearAll={handleReset}
//       />

//       {/* Filter sheet/modal */}
//       <MarketplaceFilterSheet
//         open={sheetOpen}
//         mode={sheetMode}
//         filters={filters}
//         onClose={() => setSheetOpen(false)}
//         onChange={setFilters}
//       />

//       {isLoading ? (
//         <>
//           <MarketplaceNearby
//             nearbyCount={0}
//             nearbyActive={false}
//             onCompleteProfile={handleCompleteProfile}
//           />
//           <MarketplaceSkeleton />
//         </>
//       ) : paginated.length === 0 ? (
//         <MarketplaceEmptyState
//           onReset={handleReset}
//           onBrowseAll={handleBrowseAll}
//           variant={nearMe ? 'nearby' : 'default'}
//         />
//       ) : (
//         <>
//           {/* Compact nearby row placed just above the cards */}
//           <MarketplaceNearby
//             nearbyCount={nearbyCount}
//             nearbyActive={nearMe}
//             onCompleteProfile={handleCompleteProfile}
//           />

//           {/* Compact summary chips */}
//           <MarketplaceSummary total={sorted.length} nearby={nearbyCount} district={district} />

//           <MarketplaceGrid listings={paginated} onViewDetails={handleViewDetails} />
//           <Pagination
//             currentPage={safePage}
//             totalPages={totalPages}
//             onPageChange={setCurrentPage}
//             totalItems={sorted.length}
//             pageSize={PAGE_SIZE}
//           />
//         </>
//       )}
//     </div>
//   );
// }


'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
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
import { MarketplaceNearby } from '@/components/marketplace/marketplace-nearby';
import { MarketplaceActiveFilters } from '@/components/marketplace/marketplace-active-filters';
import { MarketplaceSummary } from '@/components/marketplace/marketplace-summary';

import {
  useProfileLocation,
  haversineKm,
} from '@/hooks/use-profile-location';

import { getListings } from '@/services/api/listings.api';

import {
  PRICE_RANGES,
  QUANTITY_RANGES,
  type CropListing,
  type CropKey,
  type SortKey,
} from '@/data/marketplace-listings';

/*
 * Number of listings shown on one page.
 */
const PAGE_SIZE = 12;

/*
 * Nearby means:
 *
 * User's saved profile location
 *            +
 * Listing location
 *            ↓
 * Distance <= 10 km
 *
 * Keep this value in one place so the UI does not accidentally
 * use different nearby distances in different components.
 */
const NEARBY_RADIUS_KM = 10;

/**
 * Marketplace dashboard page.
 *
 * Listings come from the database through the marketplace API.
 *
 * Nearby:
 * - Uses the user's saved profile coordinates.
 * - Shows ONLY listings within 10 km.
 * - Sorts those listings from nearest to farthest.
 * - Does NOT use browser GPS.
 */
export function MarketplacePage() {
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
  } = useProfileLocation();

  const [listings, setListings] =
    useState<CropListing[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [search, setSearch] =
    useState('');

  const searchTerms = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? [query, ...getDomainSearchAliases(search).map((term) => term.toLowerCase())]
      : [];
  }, [search]);

  const [filters, setFilters] =
    useState<MarketplaceFilterState>(
      DEFAULT_FILTERS,
    );

  const listingDistricts = useMemo(
    () => [...new Set(listings.map((listing) => listing.district).filter(Boolean))].sort(),
    [listings],
  );

  const listingVillages = useMemo(
    () => [...new Set(
      listings
        .filter((listing) => filters.district === 'all' || listing.district === filters.district)
        .map((listing) => listing.village)
        .filter(Boolean),
    )].sort(),
    [filters.district, listings],
  );

  const [selectedChip, setSelectedChip] =
    useState<CropKey | 'all'>('all');

  const [nearMe, setNearMe] =
    useState(false);

  const [sheetOpen, setSheetOpen] =
    useState(false);

  const [sheetMode, setSheetMode] =
    useState<FilterSheetMode>('filters');

  const [currentPage, setCurrentPage] =
    useState(1);

  /*
   * ==========================================================
   * LOAD LISTINGS
   * ==========================================================
   */

  useEffect(() => {
    let mounted = true;

    void getListings()
      .then((response) => {
        if (mounted) {
          setListings(response.listings);
        }
      })
      .catch(() => {
        if (mounted) {
          setListings([]);
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * ==========================================================
   * RESET PAGINATION WHEN FILTERS CHANGE
   * ==========================================================
   */

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    filters,
    selectedChip,
    nearMe,
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
        const talukaLabel = getLocalizedDomainName(listing.taluka, locale, 'taluka').toLowerCase();
        const villageLabel = getLocalizedDomainName(listing.village, locale, 'village').toLowerCase();

        const village =
          listing.village.toLowerCase();

        const farmer =
          listing.farmerName.toLowerCase();
        const searchableValues = [
          cropLabel,
          listing.cropKey.toLowerCase(),
          districtLabel,
          listing.district.toLowerCase(),
          talukaLabel,
          listing.taluka.toLowerCase(),
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
    return listings.filter(
      (listing) =>
        listing.status !==
          'inactive' &&
        isValidListing(listing),
    );
  }, [
    listings,
    isValidListing,
  ]);

  /*
   * ==========================================================
   * NEARBY DISTANCE
   * ==========================================================
   *
   * Calculate distance only when both:
   * - user's saved coordinates exist
   * - listing coordinates exist
   *
   * Invalid coordinates are ignored instead of accidentally
   * calculating distance from 0,0.
   */

  const getListingDistanceKm =
    useCallback(
      (listing: CropListing) => {
        if (!available) {
          return Number.POSITIVE_INFINITY;
        }

        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude)
        ) {
          return Number.POSITIVE_INFINITY;
        }

        if (
          !Number.isFinite(listing.lat) ||
          !Number.isFinite(listing.lng)
        ) {
          return Number.POSITIVE_INFINITY;
        }

        return haversineKm(
          latitude,
          longitude,
          listing.lat,
          listing.lng,
        );
      },
      [
        available,
        latitude,
        longitude,
      ],
    );

  /*
   * ==========================================================
   * NEARBY FILTER
   * ==========================================================
   *
   * THIS IS THE IMPORTANT FIX.
   *
   * Previously Nearby only sorted listings.
   *
   * Now:
   *
   *        distance <= 10 km
   *
   * is required.
   */

  const nearbyFiltered =
    useMemo(() => {
      if (!nearMe || !available) {
        return filtered;
      }

      return filtered.filter(
        (listing) => {
          const distance =
            getListingDistanceKm(
              listing,
            );

          return (
            Number.isFinite(distance) &&
            distance <=
              NEARBY_RADIUS_KM
          );
        },
      );
    }, [
      filtered,
      nearMe,
      available,
      getListingDistanceKm,
    ]);

  /*
   * ==========================================================
   * SORT
   * ==========================================================
   */

  const sorted = useMemo(() => {
    const list = [
      ...nearbyFiltered,
    ];

    /*
     * When Nearby is active:
     *
     * 1. ONLY listings <= 10 km exist here.
     * 2. Sort nearest first.
     */
    if (
      nearMe &&
      available
    ) {
      list.sort((a, b) => {
        const da =
          getListingDistanceKm(a);

        const db =
          getListingDistanceKm(b);

        return da - db;
      });

      return list;
    }

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
      newest: (a, b) =>
        a.postedHoursAgo -
        b.postedHoursAgo,

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
    nearbyFiltered,
    filters.sort,
    nearMe,
    available,
    getListingDistanceKm,
  ]);

  /*
   * ==========================================================
   * NEARBY COUNT
   * ==========================================================
   *
   * Always represents listings within 10 km.
   */

  const nearbyCount = useMemo(() => {
    if (!available) {
      return 0;
    }

    return listings.filter(
      (listing) => {
        if (
          listing.status ===
          'inactive'
        ) {
          return false;
        }

        const distance =
          getListingDistanceKm(
            listing,
          );

        return (
          Number.isFinite(distance) &&
          distance <=
            NEARBY_RADIUS_KM
        );
      },
    ).length;
  }, [
    listings,
    available,
    getListingDistanceKm,
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

      if (nearMe) {
        count += 1;
      }

      return count;
    }, [
      filters,
      selectedChip,
      search,
      nearMe,
    ]);

  /*
   * ==========================================================
   * PAGINATION
   * ==========================================================
   */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        sorted.length /
          PAGE_SIZE,
      ),
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

      return sorted.slice(
        start,
        start + PAGE_SIZE,
      );
    }, [
      sorted,
      safePage,
    ]);

  /*
   * ==========================================================
   * ACTIONS
   * ==========================================================
   */

  const handleViewDetails =
    useCallback(
      (listing: CropListing) => {
        router.push(
          `/${locale}/dashboard/marketplace/${listing.id}`,
        );
      },
      [
        locale,
        router,
      ],
    );

  const handleReset =
    useCallback(() => {
      setSearch('');
      setFilters(
        DEFAULT_FILTERS,
      );
      setSelectedChip('all');
      setNearMe(false);
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

          case 'nearMe':
            setNearMe(false);
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

  const handleCompleteProfile =
    useCallback(() => {
      router.push(
        `/${locale}/dashboard/profile`,
      );
    }, [
      locale,
      router,
    ]);

  /*
   * ==========================================================
   * UI
   * ==========================================================
   */

  return (
    <div className="space-y-3">

      {/* ======================================================
          SEARCH + ACTION BAR
         ====================================================== */}

      <div
        className="sticky top-0 z-30 -mx-4 px-4 py-2 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        style={{
          background:
            'rgba(7,19,11,0.72)',
        }}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">

          <div className="w-full sm:w-[60%]">
            <MarketplaceSearch
              value={search}
              onChange={setSearch}
            />
          </div>

          <div className="w-full sm:w-auto sm:flex-1">
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
              onNearby={() =>
                setNearMe(
                  (prev) =>
                    !prev,
                )
              }
              nearbyActive={
                nearMe
              }
              nearbyDisabled={
                !available
              }
              filterCount={
                activeFilterCount
              }
            />
          </div>
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
        nearMe={nearMe}
        onRemove={
          handleRemoveFilter
        }
        onClearAll={
          handleReset
        }
      />

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
        onChange={
          setFilters
        }
      />

      {/* ======================================================
          LOADING
         ====================================================== */}

      {isLoading ? (
        <>
          <MarketplaceNearby
            nearbyCount={0}
            nearbyActive={false}
            onCompleteProfile={
              handleCompleteProfile
            }
          />

          <MarketplaceSkeleton />
        </>
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
          variant={
            nearMe
              ? 'nearby'
              : 'default'
          }
        />
      ) : (
        <>
          {/* ==================================================
              NEARBY STATUS
             ================================================== */}

          <MarketplaceNearby
            nearbyCount={
              nearbyCount
            }
            nearbyActive={
              nearMe
            }
            onCompleteProfile={
              handleCompleteProfile
            }
          />

          {/* ==================================================
              SUMMARY
             ================================================== */}

          <MarketplaceSummary
            total={
              sorted.length
            }
            nearby={
              nearbyCount
            }
            district={
              district
            }
          />

          {/* ==================================================
              LISTINGS
             ================================================== */}

          <MarketplaceGrid
            listings={
              paginated
            }
            onViewDetails={
              handleViewDetails
            }
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
              sorted.length
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
