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
import { useParams, useRouter } from 'next/navigation';
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
import { useAuth } from '@/hooks/use-auth';

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
  const params = useParams();
  const router = useRouter();
  const routeLocale = (params?.locale as string) || locale;
  const { isAuthenticated, isLoading: authLoading } = useAuth();

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
    if (authLoading) return;
    let cancelled = false;

    async function initialise() {
      try {
        const [profileResult, statesResult] = await Promise.allSettled([
          isAuthenticated ? getProfile() : Promise.resolve(null),
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
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (authLoading) return;
    const requestedView = new URLSearchParams(window.location.search).get('view');
    if (requestedView !== 'mine') return;
    if (isAuthenticated) {
      setView('mine');
    } else {
      router.replace(`/${routeLocale}/auth`);
    }
  }, [authLoading, isAuthenticated, routeLocale, router]);

  const changeView = (nextView: ViewMode) => {
    setView(nextView);
    const url = new URL(window.location.href);
    if (nextView === 'mine') {
      url.searchParams.set('view', 'mine');
    } else {
      url.searchParams.delete('view');
    }
    router.replace(`${url.pathname}${url.search}`, { scroll: false });
  };

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
    if (view !== 'mine' || !isAuthenticated) return;

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
  }, [isAuthenticated, myPage, view]);

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
    if (!isAuthenticated) {
      router.push(`/${routeLocale}/auth`);
      return;
    }
    setEditingProvider(null);
    setFormOpen(true);
  };

  const openEdit = (provider: TransportProvider) => {
    if (!isAuthenticated) return;
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
    if (!isAuthenticated) return;
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
    if (!deleteTarget || !isAuthenticated) return;

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
    if (!provider.phoneNumber) {
      router.push(`/${routeLocale}/auth`);
      return;
    }
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
        className="h-10 w-full appearance-none rounded-xl border border-border bg-surface px-3 pr-8 text-sm text-foreground outline-none transition-colors focus:border-focus focus:ring-2 focus:ring-focus disabled:cursor-not-allowed disabled:opacity-40"
      >
        <option value="" className="bg-surface">
          {placeholder}
        </option>

        {options.map((option) => (
          <option
            key={option.id}
            value={option.id}
            className="bg-surface"
          >
            {locationDomain
              ? getLocalizedDomainName(option.name, locale, locationDomain)
              : option.displayName ?? option.name}
          </option>
        ))}
      </select>

      <ChevronDown
        className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
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

  const visibleViews: ViewMode[] = isAuthenticated
    ? ['discover', 'mine']
    : ['discover'];

  const currentPage =
    view === 'discover' ? page : myPage;

  const addTransportButton = (
    <button
      type="button"
      onClick={openCreate}
      className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
    >
      <Plus className="h-4 w-4" aria-hidden="true" />
      {t('actions.add')}
    </button>
  );

  return (
    <section
      aria-labelledby="transport-page-title"
      className="space-y-3"
    >
      <h1 id="transport-page-title" className="sr-only">{t('title')}</h1>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {visibleViews.length > 1 ? (
          <div className="flex gap-1 rounded-xl border border-border bg-surface-subtle p-1">
            {visibleViews.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => changeView(item)}
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                  view === item
                    ? 'bg-accent-soft text-accent'
                    : 'text-muted-foreground hover:bg-surface hover:text-foreground'
                }`}
                aria-pressed={view === item}
              >
                {item === 'discover' ? (
                  <Search className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Truck className="h-4 w-4" aria-hidden="true" />
                )}
                {item === 'discover' ? t('tabs.find') : t('tabs.mine')}
                {item === 'mine' && myTotal > 0 ? (
                  <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] text-accent">
                    {myTotal}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {view === 'discover' || !isAuthenticated ? (
        <>
          <form
            onSubmit={submitSearch}
            className="rounded-2xl border border-border bg-surface p-3"
          >
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
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
                  className="h-11 w-full rounded-xl border border-border bg-surface pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-focus focus:ring-2 focus:ring-focus"
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
                    className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-subtle hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
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
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-accent to-accent px-4 text-sm font-bold text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
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
                className="relative inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface-subtle px-3 text-sm font-semibold text-foreground hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus lg:hidden"
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
                  <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-foreground">
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>
            </div>

            <div className="mt-2.5 hidden items-center gap-3 lg:flex">
              <div className="min-w-0 flex-1">
                {filterPanel}
              </div>
              {addTransportButton}
            </div>
          </form>

          <div className="flex justify-end lg:hidden">
            {addTransportButton}
          </div>

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
          <div className="flex justify-end">
            {addTransportButton}
          </div>

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
            className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-3xl border-t border-border bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl"
          >
            <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-surface-subtle" />

            <div className="flex items-center justify-between gap-3">
              <h2
                id="transport-mobile-filters-title"
                className="text-lg font-bold text-foreground"
              >
                {t('filters.title')}
              </h2>

              <button
                type="button"
                onClick={() =>
                  setMobileFiltersOpen(false)
                }
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-surface-subtle text-muted-foreground hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
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
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface-subtle text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
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
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-accent to-accent text-sm font-bold text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
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

      {isAuthenticated ? (
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
      ) : null}

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
          t={t}
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
        <p className="text-sm text-muted-foreground">
          {t('resultsCount', { count: total })}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-subtle text-foreground hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            aria-label={t('pagination.previous')}
          >
            <ChevronLeft
              className="h-4 w-4"
              aria-hidden="true"
            />
          </button>

          <span className="text-sm font-semibold text-muted-foreground">
            {t('pagination.page', {
              page,
              totalPages,
            })}
          </span>

          <button
            type="button"
            onClick={onNext}
            disabled={page >= totalPages}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-subtle text-foreground hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
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
    <div className="rounded-2xl border border-border bg-surface px-6 py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
        <MapPin
          className="h-6 w-6"
          aria-hidden="true"
        />
      </div>

      <h2 className="mt-4 text-lg font-bold text-foreground">
        {title}
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>

      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-surface-subtle px-5 text-sm font-semibold text-foreground hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function ConfirmContactDialog({
  provider,
  t,
  onCancel,
  onConfirm,
}: {
  provider: TransportProvider;
  t: ReturnType<typeof useTranslations>;
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
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-2xl sm:p-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Phone
            className="h-5 w-5"
            aria-hidden="true"
          />
        </div>

        <h2
          id="transport-contact-title"
          className="mt-4 text-lg font-bold text-foreground"
        >
          {t('contactConfirmation.title')}
        </h2>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {t('contactConfirmation.description', {
            name: provider.businessName,
            phone: provider.phoneNumber ?? '',
          })}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-surface-subtle text-sm font-semibold text-foreground hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            {t('contactConfirmation.cancel')}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-accent to-accent text-sm font-bold text-accent-foreground hover:from-accent hover:to-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <Phone
              className="h-4 w-4"
              aria-hidden="true"
            />
            {t('contactConfirmation.call')}
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
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-2xl sm:p-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-danger-soft text-danger">
          <Trash2
            className="h-5 w-5"
            aria-hidden="true"
          />
        </div>

        <h2
          id="transport-delete-title"
          className="mt-4 text-lg font-bold text-foreground"
        >
          {t('myTransport.deleteTitle')}
        </h2>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {t('myTransport.deleteDescription', {
            name: provider.businessName,
          })}
        </p>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-border bg-surface-subtle text-sm font-semibold text-foreground hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-40"
          >
            {t('myTransport.cancel')}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-danger text-sm font-bold text-danger-foreground hover:bg-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger disabled:opacity-50"
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
