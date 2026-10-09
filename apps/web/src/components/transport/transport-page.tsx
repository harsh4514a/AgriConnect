'use client';

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  MapPin,
  Phone,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { toast } from 'sonner';
import { getLocalizedDomainName } from '@agri/domain-data';

import {
  getDistricts,
  getProfile,
  getStates,
  getTalukas,
  getVillages,
  type LocationOption,
} from '@/services/api/auth.api';

import {
  deleteTransportProvider,
  getMyTransportProviders,
  getTransportProviders,
  updateTransportAvailability,
  type TransportProvider,
  type TransportQuery,
  type TransportVehicleType,
} from '@/services/api/transport.api';

import { TransportCard } from './transport-card';
import { TransportForm } from './transport-form';
import { TransportSkeleton } from './transport-skeleton';

type ViewMode = 'discover' | 'mine';

interface Filters {
  search: string;
  districtId: string;
  talukaId: string;
  villageId: string;
  vehicleType: TransportVehicleType | '';
  availability: '' | 'available' | 'unavailable';
}

const INITIAL_FILTERS: Filters = {
  search: '',
  districtId: '',
  talukaId: '',
  villageId: '',
  vehicleType: '',
  availability: '',
};

const PAGE_SIZE = 12;

const VEHICLE_TYPES: TransportVehicleType[] = [
  'tractor',
  'tractor_trailer',
  'pickup',
  'mini_truck',
  'truck',
  'other',
];

export function TransportPage() {
  const t = useTranslations('dashboard.transport');
  const locale = useLocale();

  const [view, setView] = useState<ViewMode>('discover');

  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [draftSearch, setDraftSearch] = useState('');

  const [providers, setProviders] = useState<TransportProvider[]>([]);
  const [myProviders, setMyProviders] = useState<TransportProvider[]>([]);

  const [total, setTotal] = useState(0);
  const [myTotal, setMyTotal] = useState(0);

  const [page, setPage] = useState(1);
  const [myPage, setMyPage] = useState(1);

  const [totalPages, setTotalPages] = useState(0);
  const [myTotalPages, setMyTotalPages] = useState(0);

  const [districts, setDistricts] = useState<LocationOption[]>([]);
  const [talukas, setTalukas] = useState<LocationOption[]>([]);
  const [villages, setVillages] = useState<LocationOption[]>([]);

  const [isInitialising, setIsInitialising] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isMineLoading, setIsMineLoading] = useState(false);
  const [isFilterLoading, setIsFilterLoading] = useState(false);

  const [error, setError] = useState(false);
  const [mineError, setMineError] = useState(false);

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingProvider, setEditingProvider] =
    useState<TransportProvider | null>(null);

  const [deleteTarget, setDeleteTarget] =
    useState<TransportProvider | null>(null);

  const [contactTarget, setContactTarget] =
    useState<TransportProvider | null>(null);

  const [deleting, setDeleting] = useState(false);

  const discoveryRequestRef = useRef(0);

  const activeFilterCount = useMemo(
    () =>
      [
        filters.districtId,
        filters.talukaId,
        filters.villageId,
        filters.vehicleType,
        filters.availability,
      ].filter(Boolean).length,
    [filters],
  );

  const updateFilters = useCallback(
    (patch: Partial<Filters>, resetPage = true) => {
      setFilters((current) => ({
        ...current,
        ...patch,
      }));

      if (resetPage) {
        setPage(1);
      }
    },
    [],
  );

  /*
   * Initial location loading
   */
  useEffect(() => {
    let cancelled = false;

    async function initialise() {
      try {
        const [profileResult, statesResult] = await Promise.allSettled([
          getProfile(),
          getStates(),
        ]);

        if (cancelled) return;

        const profile =
          profileResult.status === 'fulfilled' ? profileResult.value : null;

        let stateId = profile?.state?.id;

        if (!stateId && statesResult.status === 'fulfilled') {
          stateId = statesResult.value.find(
            (state) => state.name.trim().toLowerCase() === 'gujarat',
          )?.id;
        }

        if (!stateId) return;

        const districtOptions = await getDistricts(stateId);

        if (cancelled) return;

        setDistricts(districtOptions);

        if (
          profile?.district?.id &&
          districtOptions.some(
            (item) => item.id === profile.district?.id,
          )
        ) {
          setFilters((current) => ({
            ...current,
            districtId: profile.district!.id,
          }));

          const talukaOptions = await getTalukas(profile.district.id);

          if (cancelled) return;

          setTalukas(talukaOptions);

          if (profile.taluka?.id) {
            const villageOptions = await getVillages(profile.taluka.id);

            if (cancelled) return;

            setVillages(villageOptions);

            setFilters((current) => ({
              ...current,
              districtId: profile.district!.id,
              talukaId: profile.taluka!.id,
              villageId: profile.village?.id ?? '',
            }));
          }
        }
      } catch {
        // Transport discovery can still work without profile location.
      } finally {
        if (!cancelled) {
          setIsInitialising(false);
        }
      }
    }

    void initialise();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Load public transport providers
   */
  const loadProviders = useCallback(async () => {
    if (view !== 'discover') return;

    const requestId = ++discoveryRequestRef.current;

    setIsLoading(true);
    setError(false);

    const query: TransportQuery = {
      page,
      limit: PAGE_SIZE,

      ...(filters.search
        ? {
            search: filters.search,
          }
        : {}),

      ...(filters.districtId
        ? {
            districtId: filters.districtId,
          }
        : {}),

      ...(filters.talukaId
        ? {
            talukaId: filters.talukaId,
          }
        : {}),

      ...(filters.villageId
        ? {
            villageId: filters.villageId,
          }
        : {}),

      ...(filters.vehicleType
        ? {
            vehicleType: filters.vehicleType,
          }
        : {}),

      ...(filters.availability
        ? {
            available: filters.availability === 'available',
          }
        : {}),
    };

    try {
      const response = await getTransportProviders(query);

      if (requestId !== discoveryRequestRef.current) return;

      setProviders(response.items);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch {
      if (requestId !== discoveryRequestRef.current) return;

      setProviders([]);
      setTotal(0);
      setTotalPages(0);
      setError(true);
    } finally {
      if (requestId === discoveryRequestRef.current) {
        setIsLoading(false);
      }
    }
  }, [filters, page, view]);

  useEffect(() => {
    if (isInitialising || view !== 'discover') return;

    void loadProviders();
  }, [isInitialising, loadProviders, view]);

  /*
   * Load my transport providers
   */
  const loadMine = useCallback(async () => {
    if (view !== 'mine') return;

    setIsMineLoading(true);
    setMineError(false);

    try {
      const response = await getMyTransportProviders({
        page: myPage,
        limit: PAGE_SIZE,
      });

      setMyProviders(response.items);
      setMyTotal(response.total);
      setMyTotalPages(response.totalPages);
    } catch {
      setMyProviders([]);
      setMyTotal(0);
      setMyTotalPages(0);
      setMineError(true);
    } finally {
      setIsMineLoading(false);
    }
  }, [myPage, view]);

  useEffect(() => {
    if (view !== 'mine') return;

    void loadMine();
  }, [loadMine, view]);

  /*
   * Search
   */
  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    updateFilters({
      search: draftSearch.trim(),
    });
  };

  /*
   * Location filters
   */
  const handleDistrictChange = async (districtId: string) => {
    updateFilters({
      districtId,
      talukaId: '',
      villageId: '',
    });

    setTalukas([]);
    setVillages([]);

    if (!districtId) return;

    setIsFilterLoading(true);

    try {
      const options = await getTalukas(districtId);
      setTalukas(options);
    } catch {
      toast.error(t('filters.locationLoadError'));
    } finally {
      setIsFilterLoading(false);
    }
  };

  const handleTalukaChange = async (talukaId: string) => {
    updateFilters({
      talukaId,
      villageId: '',
    });

    setVillages([]);

    if (!talukaId) return;

    setIsFilterLoading(true);

    try {
      const options = await getVillages(talukaId);
      setVillages(options);
    } catch {
      toast.error(t('filters.locationLoadError'));
    } finally {
      setIsFilterLoading(false);
    }
  };

  /*
   * Reset filters
   */
  const resetFilters = () => {
    setDraftSearch('');
    setFilters(INITIAL_FILTERS);
    setPage(1);
    setTalukas([]);
    setVillages([]);
    setMobileFiltersOpen(false);
  };

  /*
   * Create / edit
   */
  const openCreate = () => {
    setEditingProvider(null);
    setFormOpen(true);
  };

  const openEdit = (provider: TransportProvider) => {
    setEditingProvider(provider);
    setFormOpen(true);
  };

  const handleSaved = (provider: TransportProvider) => {
    if (editingProvider) {
      setMyProviders((current) =>
        current.map((item) =>
          item.id === provider.id ? provider : item,
        ),
      );

      setProviders((current) =>
        current.map((item) =>
          item.id === provider.id ? provider : item,
        ),
      );
    } else {
      setMyProviders((current) => [provider, ...current]);
      setMyTotal((current) => current + 1);
      setMyPage(1);
    }

    setFormOpen(false);
    setEditingProvider(null);

    if (view === 'discover') {
      void loadProviders();
    } else {
      void loadMine();
    }
  };

  /*
   * Availability
   */
  const handleAvailability = async (
    provider: TransportProvider,
    isAvailable: boolean,
  ) => {
    try {
      const updated = await updateTransportAvailability(
        provider.id,
        isAvailable,
      );

      setMyProviders((current) =>
        current.map((item) =>
          item.id === updated.id ? updated : item,
        ),
      );

      setProviders((current) =>
        current.map((item) =>
          item.id === updated.id ? updated : item,
        ),
      );

      toast.success(
        isAvailable
          ? t('myTransport.success.available')
          : t('myTransport.success.unavailable'),
      );
    } catch {
      toast.error(t('myTransport.error.update'));
    }
  };

  /*
   * Delete
   */
  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await deleteTransportProvider(deleteTarget.id);

      setMyProviders((current) =>
        current.filter((item) => item.id !== deleteTarget.id),
      );

      setMyTotal((current) => Math.max(0, current - 1));

      const wasLastItemOnPage =
        myProviders.length === 1 && myPage > 1;

      setDeleteTarget(null);

      toast.success(t('myTransport.success.deleted'));

      if (wasLastItemOnPage) {
        setMyPage((current) => current - 1);
      } else {
        void loadMine();
      }
    } catch {
      toast.error(t('myTransport.error.delete'));
    } finally {
      setDeleting(false);
    }
  };

  /*
   * Contact confirmation
   */
  const handleContact = (provider: TransportProvider) => {
    setContactTarget(provider);
  };

  const confirmContact = () => {
    if (!contactTarget?.phoneNumber) return;

    const phone = contactTarget.phoneNumber.replace(/[^\d+]/g, '');

    setContactTarget(null);

    window.location.href = `tel:${phone}`;
  };

  /*
   * Location select
   */
  const renderSelect = (
    value: string,
    options: LocationOption[],
    placeholder: string,
    onChange: (value: string) => void,
    disabled = false,
    locationDomain?: 'district' | 'taluka' | 'village',
  ) => (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="h-10 w-full appearance-none rounded-xl border border-white/10 bg-white/[0.045] px-3 pr-8 text-sm text-white outline-none transition-colors focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <option value="" className="bg-green-950">
          {placeholder}
        </option>

        {options.map((option) => (
          <option
            key={option.id}
            value={option.id}
            className="bg-green-950"
          >
            {locationDomain
              ? getLocalizedDomainName(option.name, locale, locationDomain)
              : option.displayName ?? option.name}
          </option>
        ))}
      </select>

      <ChevronDown
        className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35"
        aria-hidden="true"
      />
    </div>
  );

  const filterPanel = (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
      {renderSelect(
        filters.districtId,
        districts,
        t('filters.allDistricts'),
        handleDistrictChange,
        false,
        'district',
      )}

      {renderSelect(
        filters.talukaId,
        talukas,
        t('filters.allTalukas'),
        handleTalukaChange,
        !filters.districtId || isFilterLoading,
        'taluka',
      )}

      {renderSelect(
        filters.villageId,
        villages,
        t('filters.allVillages'),
        (value) => updateFilters({ villageId: value }),
        !filters.talukaId || isFilterLoading,
        'village',
      )}

      {renderSelect(
        filters.vehicleType,
        VEHICLE_TYPES.map((id) => ({
          id,
          name: t(`vehicleTypes.${id}`),
        })),
        t('filters.allVehicleTypes'),
        (value) =>
          updateFilters({
            vehicleType: value as TransportVehicleType | '',
          }),
      )}

      {renderSelect(
        filters.availability,
        [
          {
            id: 'available',
            name: t('available'),
          },
          {
            id: 'unavailable',
            name: t('unavailable'),
          },
        ],
        t('filters.allAvailability'),
        (value) =>
          updateFilters({
            availability:
              value as Filters['availability'],
          }),
      )}
    </div>
  );

  const results =
    view === 'discover' ? providers : myProviders;

  const resultsTotal =
    view === 'discover' ? total : myTotal;

  const resultsLoading =
    view === 'discover' ? isLoading : isMineLoading;

  const resultsError =
    view === 'discover' ? error : mineError;

  const resultsPages =
    view === 'discover' ? totalPages : myTotalPages;

  const currentPage =
    view === 'discover' ? page : myPage;

  return (
    <section
      aria-labelledby="transport-page-title"
      className="space-y-5"
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1
            id="transport-page-title"
            className="text-2xl font-black tracking-tight text-white sm:text-3xl"
          >
            {t('title')}
          </h1>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-white/55 sm:text-base">
            {t('subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-green-600 to-green-800 px-4 text-sm font-bold text-white shadow-lg shadow-green-900/20 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        >
          <Plus
            className="h-4 w-4"
            aria-hidden="true"
          />
          {t('actions.add')}
        </button>
      </header>

      <div className="flex gap-1 rounded-xl border border-white/10 bg-white/[0.025] p-1 sm:w-fit">
        {(['discover', 'mine'] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setView(item)}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${
              view === item
                ? 'bg-white/10 text-white'
                : 'text-white/45 hover:bg-white/5 hover:text-white/75'
            }`}
            aria-pressed={view === item}
          >
            {item === 'discover' ? (
              <Search
                className="h-4 w-4"
                aria-hidden="true"
              />
            ) : (
              <Truck
                className="h-4 w-4"
                aria-hidden="true"
              />
            )}

            {item === 'discover'
              ? t('tabs.find')
              : t('tabs.mine')}

            {item === 'mine' && myTotal > 0 ? (
              <span className="rounded-full bg-emerald-400/10 px-1.5 py-0.5 text-[10px] text-emerald-300">
                {myTotal}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {view === 'discover' ? (
        <>
          <form
            onSubmit={submitSearch}
            className="rounded-2xl border border-white/10 bg-white/[0.035] p-3"
          >
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35"
                  aria-hidden="true"
                />

                <label
                  htmlFor="transport-search"
                  className="sr-only"
                >
                  {t('searchLabel')}
                </label>

                <input
                  id="transport-search"
                  value={draftSearch}
                  onChange={(event) =>
                    setDraftSearch(event.target.value)
                  }
                  placeholder={t('searchPlaceholder')}
                  className="h-11 w-full rounded-xl border border-white/10 bg-black/10 pl-9 pr-9 text-sm text-white placeholder:text-white/30 outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/15"
                />

                {draftSearch ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDraftSearch('');
                      updateFilters({
                        search: '',
                      });
                    }}
                    className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-white/40 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                    aria-label={t('clearSearch')}
                  >
                    <X
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                  </button>
                ) : null}
              </div>

              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-green-600 to-green-800 px-4 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              >
                <Search
                  className="h-4 w-4"
                  aria-hidden="true"
                />

                <span className="hidden sm:inline">
                  {t('search')}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setMobileFiltersOpen(true)
                }
                className="relative inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-white/75 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 lg:hidden"
                aria-expanded={mobileFiltersOpen}
                aria-controls="transport-mobile-filters"
              >
                <SlidersHorizontal
                  className="h-4 w-4"
                  aria-hidden="true"
                />

                <span className="hidden sm:inline">
                  {t('filters.button')}
                </span>

                {activeFilterCount > 0 ? (
                  <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>
            </div>

            <div className="mt-2.5 hidden lg:block">
              {filterPanel}
            </div>
          </form>

          {isInitialising || resultsLoading ? (
            <TransportSkeleton />
          ) : resultsError ? (
            <StateMessage
              title={t('error.title')}
              description={t('error.description')}
              actionLabel={t('tryAgain')}
              onAction={() => void loadProviders()}
            />
          ) : results.length === 0 ? (
            <StateMessage
              title={t('empty.title')}
              description={t('empty.description')}
              actionLabel={
                activeFilterCount > 0 ||
                filters.search
                  ? t('resetFilters')
                  : undefined
              }
              onAction={
                activeFilterCount > 0 ||
                filters.search
                  ? resetFilters
                  : undefined
              }
            />
          ) : (
            <Results
              providers={results}
              total={resultsTotal}
              page={currentPage}
              totalPages={resultsPages}
              onPrevious={() =>
                setPage((current) =>
                  Math.max(1, current - 1),
                )
              }
              onNext={() =>
                setPage((current) =>
                  Math.min(
                    resultsPages,
                    current + 1,
                  ),
                )
              }
              t={t}
              management={false}
              onContact={handleContact}
            />
          )}
        </>
      ) : (
        <>
          {isMineLoading ? (
            <TransportSkeleton />
          ) : mineError ? (
            <StateMessage
              title={t('myTransport.error.title')}
              description={t(
                'myTransport.error.description',
              )}
              actionLabel={t('tryAgain')}
              onAction={() => void loadMine()}
            />
          ) : myProviders.length === 0 ? (
            <StateMessage
              title={t('myTransport.empty.title')}
              description={t(
                'myTransport.empty.description',
              )}
              actionLabel={t('actions.add')}
              onAction={openCreate}
            />
          ) : (
            <Results
              providers={myProviders}
              total={myTotal}
              page={myPage}
              totalPages={myTotalPages}
              onPrevious={() =>
                setMyPage((current) =>
                  Math.max(1, current - 1),
                )
              }
              onNext={() =>
                setMyPage((current) =>
                  Math.min(
                    myTotalPages,
                    current + 1,
                  ),
                )
              }
              t={t}
              management
              onEdit={openEdit}
              onDelete={setDeleteTarget}
              onAvailability={handleAvailability}
              onContact={handleContact}
            />
          )}
        </>
      )}

      {mobileFiltersOpen ? (
        <div
          className="fixed inset-0 z-[80] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="transport-mobile-filters-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            onClick={() =>
              setMobileFiltersOpen(false)
            }
            aria-label={t('filters.close')}
          />

          <div
            id="transport-mobile-filters"
            className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-green-950 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl"
          >
            <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-white/15" />

            <div className="flex items-center justify-between gap-3">
              <h2
                id="transport-mobile-filters-title"
                className="text-lg font-bold text-white"
              >
                {t('filters.title')}
              </h2>

              <button
                type="button"
                onClick={() =>
                  setMobileFiltersOpen(false)
                }
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/60 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                aria-label={t('filters.close')}
              >
                <X
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              </button>
            </div>

            <div className="mt-4">
              {filterPanel}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-white/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              >
                <RotateCcw
                  className="h-4 w-4"
                  aria-hidden="true"
                />
                {t('resetFilters')}
              </button>

              <button
                type="button"
                onClick={() =>
                  setMobileFiltersOpen(false)
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-green-600 to-green-800 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              >
                <Filter
                  className="h-4 w-4"
                  aria-hidden="true"
                />
                {t('filters.apply')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <TransportForm
        key={editingProvider?.id ?? 'new'}
        open={formOpen}
        initial={editingProvider}
        onClose={() => {
          setFormOpen(false);
          setEditingProvider(null);
        }}
        onSaved={handleSaved}
      />

      {deleteTarget ? (
        <ConfirmDeleteDialog
          provider={deleteTarget}
          deleting={deleting}
          t={t}
          onCancel={() =>
            !deleting && setDeleteTarget(null)
          }
          onConfirm={() => void handleDelete()}
        />
      ) : null}

      {contactTarget ? (
        <ConfirmContactDialog
          provider={contactTarget}
          onCancel={() => setContactTarget(null)}
          onConfirm={confirmContact}
        />
      ) : null}
    </section>
  );
}

function Results({
  providers,
  total,
  page,
  totalPages,
  onPrevious,
  onNext,
  t,
  management,
  onEdit,
  onDelete,
  onAvailability,
  onContact,
}: {
  providers: TransportProvider[];
  total: number;
  page: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
  t: ReturnType<typeof useTranslations>;
  management: boolean;
  onEdit?: (provider: TransportProvider) => void;
  onDelete?: (provider: TransportProvider) => void;
  onAvailability?: (
    provider: TransportProvider,
    isAvailable: boolean,
  ) => Promise<void>;
  onContact: (provider: TransportProvider) => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-white/45">
          {t('resultsCount', { count: total })}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {providers.map((provider) => (
          <TransportCard
            key={provider.id}
            provider={provider}
            management={management}
            onEdit={onEdit}
            onDelete={onDelete}
            onAvailability={onAvailability}
            onContact={onContact}
          />
        ))}
      </div>

      {totalPages > 1 ? (
        <nav
          className="flex items-center justify-center gap-3 pt-1"
          aria-label={t('pagination.label')}
        >
          <button
            type="button"
            onClick={onPrevious}
            disabled={page <= 1}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/75 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            aria-label={t('pagination.previous')}
          >
            <ChevronLeft
              className="h-4 w-4"
              aria-hidden="true"
            />
          </button>

          <span className="text-sm font-semibold text-white/60">
            {t('pagination.page', {
              page,
              totalPages,
            })}
          </span>

          <button
            type="button"
            onClick={onNext}
            disabled={page >= totalPages}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/75 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            aria-label={t('pagination.next')}
          >
            <ChevronRight
              className="h-4 w-4"
              aria-hidden="true"
            />
          </button>
        </nav>
      ) : null}
    </>
  );
}

function StateMessage({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
        <MapPin
          className="h-6 w-6"
          aria-hidden="true"
        />
      </div>

      <h2 className="mt-4 text-lg font-bold text-white">
        {title}
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/50">
        {description}
      </p>

      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white/10 px-5 text-sm font-semibold text-white hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function ConfirmContactDialog({
  provider,
  onCancel,
  onConfirm,
}: {
  provider: TransportProvider;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transport-contact-title"
    >
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-green-950 p-5 shadow-2xl sm:p-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
          <Phone
            className="h-5 w-5"
            aria-hidden="true"
          />
        </div>

        <h2
          id="transport-contact-title"
          className="mt-4 text-lg font-bold text-white"
        >
          Contact transporter?
        </h2>

        <p className="mt-2 text-sm leading-6 text-white/55">
          You are about to call{' '}
          <span className="font-semibold text-white">
            {provider.businessName}
          </span>{' '}
          at{' '}
          <span className="font-semibold text-white">
            {provider.phoneNumber}
          </span>
          .
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-white/75 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-green-600 to-green-800 text-sm font-bold text-white hover:from-green-500 hover:to-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          >
            <Phone
              className="h-4 w-4"
              aria-hidden="true"
            />
            Call
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDeleteDialog({
  provider,
  deleting,
  t,
  onCancel,
  onConfirm,
}: {
  provider: TransportProvider;
  deleting: boolean;
  t: ReturnType<typeof useTranslations>;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transport-delete-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-green-950 p-5 shadow-2xl sm:p-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-400/10 text-red-300">
          <Trash2
            className="h-5 w-5"
            aria-hidden="true"
          />
        </div>

        <h2
          id="transport-delete-title"
          className="mt-4 text-lg font-bold text-white"
        >
          {t('myTransport.deleteTitle')}
        </h2>

        <p className="mt-2 text-sm leading-6 text-white/50">
          {t('myTransport.deleteDescription', {
            name: provider.businessName,
          })}
        </p>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-white/75 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:opacity-40"
          >
            {t('myTransport.cancel')}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-red-600/90 text-sm font-bold text-white hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-50"
          >
            <Trash2
              className="h-4 w-4"
              aria-hidden="true"
            />
            {t('myTransport.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
