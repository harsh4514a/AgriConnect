'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdaptiveLink as Link } from '@/components/performance/adaptive-link';
import {
  Plus,
  Search,
  SlidersHorizontal,
  X,
  RefreshCw,
  ClipboardList,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  getBuyerRequirements,
  getMyBuyerRequirements,
  type BuyerRequirement,
  type BuyerRequirementQuery,
} from '@/services/api/buyer-requirements.api';
import { getDistricts, getStates, type LocationOption } from '@/services/api/auth.api';
import { BuyerRequirementCard } from './buyer-requirement-card';
import { getLocalizedDomainName } from '@agri/domain-data';
import type { Locale } from '@/i18n/config';
import { useAuth } from '@/hooks/use-auth';

export function BuyerRequirementsPage() {
  const t = useTranslations('buyerRequirements');
  const params = useParams();
  const router = useRouter();
  const locale = ((params?.locale as string) || 'en') as Locale;
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const cropLabels = useMemo<Record<string, string>>(
    () => ({
      cotton: t('crops.cotton'),
      groundnut: t('crops.groundnut'),
      wheat: t('crops.wheat'),
      rice: t('crops.rice'),
      tomato: t('crops.tomato'),
      onion: t('crops.onion'),
      potato: t('crops.potato'),
      chili: t('crops.chili'),
      maize: t('crops.maize'),
      bajra: t('crops.bajra'),
      other: t('crops.other'),
    }),
    [t],
  );

  const [items, setItems] = useState<BuyerRequirement[]>([]);
  const [mine, setMine] = useState<BuyerRequirement[]>([]);
  const [tab, setTab] = useState<'find' | 'mine'>('find');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [district, setDistrict] = useState('');
  const [cropKey, setCropKey] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mineLoading, setMineLoading] = useState(false);
  const [error, setError] = useState(false);
  const [districtOptions, setDistrictOptions] = useState<LocationOption[]>([]);

  useEffect(() => {
    if (authLoading) return;
    const requestedView = new URLSearchParams(window.location.search).get('view');
    if (requestedView !== 'mine') return;
    if (isAuthenticated) {
      setTab('mine');
    } else {
      router.replace(`/${locale}/auth`);
    }
  }, [authLoading, isAuthenticated, locale, router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const states = await getStates(locale);
        const gujarat = states.find((item) => item.name.trim().toLowerCase() === 'gujarat');
        const options = gujarat ? await getDistricts(gujarat.id, locale) : [];
        if (!cancelled) setDistrictOptions(options);
      } catch {
        if (!cancelled) setDistrictOptions([]);
      }
    })();
    return () => { cancelled = true; };
  }, [locale]);

  const districts = useMemo(
    () => [...districtOptions].sort((a, b) =>
      getLocalizedDomainName(a.name, locale, 'district').localeCompare(
        getLocalizedDomainName(b.name, locale, 'district'),
      ),
    ),
    [districtOptions, locale],
  );

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(false);

    try {
      const query: BuyerRequirementQuery = {
        page,
        limit: 12,
        search: debouncedSearch || undefined,
        district: district || undefined,
        cropKey: cropKey || undefined,
      };

      const response = await getBuyerRequirements(query, signal);
      setItems(response.items);
      setTotalPages(Math.max(1, response.totalPages));
      setTotal(response.total);
    } catch {
      if (!signal?.aborted) setError(true);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [page, debouncedSearch, district, cropKey]);

  const loadMine = useCallback(async (signal?: AbortSignal) => {
    setMineLoading(true);

    try {
      setMine(await getMyBuyerRequirements(signal));
    } catch {
      if (!signal?.aborted) toast.error(t('errors.load'));
    } finally {
      if (!signal?.aborted) setMineLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const controller = new AbortController();
    if (tab === 'find') {
      void load(controller.signal);
    } else if (isAuthenticated) {
      void loadMine(controller.signal);
    } else {
      setTab('find');
    }
    return () => controller.abort();
  }, [isAuthenticated, tab, load, loadMine]);

  const changeTab = (nextTab: 'find' | 'mine') => {
    setTab(nextTab);
    const url = new URL(window.location.href);
    if (nextTab === 'mine') url.searchParams.set('view', 'mine');
    else url.searchParams.delete('view');
    router.replace(`${url.pathname}${url.search}`, { scroll: false });
  };

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, district, cropKey]);

  const clearFilters = () => {
    setSearch('');
    setDistrict('');
    setCropKey('');
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-3">
      <h1 className="sr-only">{t('title')}</h1>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 rounded-xl bg-surface-subtle p-1">
          <button
            onClick={() => changeTab('find')}
            className={`min-h-10 rounded-lg px-4 text-sm font-semibold ${
              tab === 'find'
                ? 'bg-surface text-foreground shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            {t('tabs.find')}
          </button>

          {isAuthenticated ? (
            <button
              onClick={() => changeTab('mine')}
              className={`min-h-10 rounded-lg px-4 text-sm font-semibold ${
                tab === 'mine'
                  ? 'bg-surface text-foreground shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              {t('tabs.mine')}
            </button>
          ) : null}
        </div>
        <Link
          href={isAuthenticated ? `/${locale}/dashboard/buyer-requirements/create` : `/${locale}/auth`}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-accent-foreground shadow-sm transition hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          <Plus className="h-4 w-4" />
          {t('create')}
        </Link>
      </div>

      {tab === 'find' ? (
        <>
          <div className="mt-3 rounded-2xl border border-border bg-surface p-3 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="h-11 w-full rounded-xl border border-border bg-surface-subtle pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-focus focus:bg-surface focus:ring-2 focus:ring-focus"
                />

                {search ? (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    aria-label={t('clear')}
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              <div className="hidden gap-2 lg:flex">
                <select
                  value={cropKey}
                  onChange={(event) => setCropKey(event.target.value)}
                  className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-foreground"
                >
                  <option value="">{t('filters.allCrops')}</option>
                  {Object.entries(cropLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>

                <select
                  value={district}
                  onChange={(event) => setDistrict(event.target.value)}
                  className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-foreground"
                >
                  <option value="">{t('filters.allDistricts')}</option>
                  {districts.map((item) => (
                    <option key={item.id} value={item.name}>
                      {getLocalizedDomainName(item.name, locale, 'district')}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setShowFilters((value) => !value)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {t('filters.title')}
              </button>
            </div>

            {showFilters ? (
              <div className="mt-3 grid gap-3 border-t border-border pt-3 sm:grid-cols-2 lg:hidden">
                <select
                  value={cropKey}
                  onChange={(event) => setCropKey(event.target.value)}
                  className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-foreground"
                >
                  <option value="">{t('filters.allCrops')}</option>
                  {Object.entries(cropLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>

                <select
                  value={district}
                  onChange={(event) => setDistrict(event.target.value)}
                  className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-foreground"
                >
                  <option value="">{t('filters.allDistricts')}</option>
                  {districts.map((item) => (
                    <option key={item.id} value={item.name}>
                      {getLocalizedDomainName(item.name, locale, 'district')}
                    </option>
                  ))}
                </select>

                <button
                  onClick={clearFilters}
                  className="h-11 rounded-xl border border-border text-sm font-semibold text-muted-foreground sm:col-span-2"
                >
                  {t('filters.clear')}
                </button>
              </div>
            ) : null}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {total} {t('results')}
            </span>

            {search || district || cropKey ? (
              <button
                onClick={clearFilters}
                className="font-semibold text-accent hover:text-foreground"
              >
                {t('filters.clear')}
              </button>
            ) : null}
          </div>

          {loading ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-52 animate-pulse rounded-2xl bg-surface-subtle"
                />
              ))}
            </div>
          ) : error ? (
            <div className="mt-6 rounded-2xl border border-danger/30 bg-danger-soft p-8 text-center">
              <ClipboardList className="mx-auto h-8 w-8 text-danger" />
              <p className="mt-3 font-semibold text-danger">
                {t('errors.title')}
              </p>

              <button
                onClick={() => void load()}
                className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-surface px-4 text-sm font-semibold text-danger shadow-sm"
              >
                <RefreshCw className="h-4 w-4" />
                {t('errors.retry')}
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center">
              <ClipboardList className="mx-auto h-9 w-9 text-muted-foreground" />
              <p className="mt-3 font-semibold text-foreground">
                {t('empty.title')}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('empty.description')}
              </p>

              {search || district || cropKey ? (
                <button
                  onClick={clearFilters}
                  className="mt-4 text-sm font-semibold text-accent"
                >
                  {t('filters.clear')}
                </button>
              ) : null}
            </div>
          ) : (
            <>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                  <BuyerRequirementCard
                    key={item.id}
                    requirement={item}
                    cropLabels={cropLabels}
                    labels={{
                      buyer: t('card.buyer'),
                      verifiedBuyer: t('card.verifiedBuyer'),
                      view: t('card.view'),
                      variety: t('form.variety'),
                    }}
                  />
                ))}
              </div>

              {totalPages > 1 ? (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                    className="h-10 rounded-lg border px-4 text-sm disabled:opacity-40"
                  >
                    {t('pagination.previous')}
                  </button>

                  <span className="text-sm text-muted-foreground">
                    {page} / {totalPages}
                  </span>

                  <button
                    disabled={page >= totalPages}
                    onClick={() =>
                      setPage((current) =>
                        Math.min(totalPages, current + 1),
                      )
                    }
                    className="h-10 rounded-lg border px-4 text-sm disabled:opacity-40"
                  >
                    {t('pagination.next')}
                  </button>
                </div>
              ) : null}
            </>
          )}
        </>
      ) : (
        <div className="mt-5">
          {mineLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-52 animate-pulse rounded-2xl bg-surface-subtle"
                />
              ))}
            </div>
          ) : mine.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center">
              <ClipboardList className="mx-auto h-9 w-9 text-muted-foreground" />
              <p className="mt-3 font-semibold text-foreground">
                {t('mine.emptyTitle')}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('mine.emptyDescription')}
              </p>

              <Link
                href={`/${locale}/dashboard/buyer-requirements/create`}
                className="mt-4 inline-flex min-h-10 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground"
              >
                {t('create')}
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {mine.map((item) => (
                <BuyerRequirementCard
                  key={item.id}
                  requirement={item}
                  cropLabels={cropLabels}
                  labels={{
                    buyer: t('card.buyer'),
                    verifiedBuyer: t('card.verifiedBuyer'),
                    view: t('card.view'),
                    variety: t('form.variety'),
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
