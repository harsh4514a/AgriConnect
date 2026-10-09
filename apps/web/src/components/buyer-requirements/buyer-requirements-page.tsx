'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  SlidersHorizontal,
  X,
  RefreshCw,
  ClipboardList,
} from 'lucide-react';
import { useParams } from 'next/navigation';
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

export function BuyerRequirementsPage() {
  const t = useTranslations('buyerRequirements');
  const params = useParams();
  const locale = ((params?.locale as string) || 'en') as Locale;

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
    [districtOptions],
  );

  const load = useCallback(async () => {
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

      const response = await getBuyerRequirements(query);
      setItems(response.items);
      setTotalPages(Math.max(1, response.totalPages));
      setTotal(response.total);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, district, cropKey]);

  const loadMine = useCallback(async () => {
    setMineLoading(true);

    try {
      setMine(await getMyBuyerRequirements());
    } catch {
      toast.error(t('errors.load'));
    } finally {
      setMineLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (tab === 'find') {
      void load();
    } else {
      void loadMine();
    }
  }, [tab, load, loadMine]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, district, cropKey]);

  const clearFilters = () => {
    setSearch('');
    setDistrict('');
    setCropKey('');
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {t('title')}
          </h1>
          <p className="mt-1 text-sm text-emerald-100">
            {t('subtitle')}
          </p>
        </div>

        <Link
          href={`/${locale}/dashboard/buyer-requirements/create`}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          {t('create')}
        </Link>
      </div>

      <div className="mt-6 flex gap-2 rounded-xl bg-slate-100 p-1 sm:w-fit">
        <button
          onClick={() => setTab('find')}
          className={`min-h-10 rounded-lg px-4 text-sm font-semibold ${
            tab === 'find'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500'
          }`}
        >
          {t('tabs.find')}
        </button>

        <button
          onClick={() => setTab('mine')}
          className={`min-h-10 rounded-lg px-4 text-sm font-semibold ${
            tab === 'mine'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500'
          }`}
        >
          {t('tabs.mine')}
        </button>
      </div>

      {tab === 'find' ? (
        <>
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                />

                {search ? (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
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
                  className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
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
                  className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
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
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {t('filters.title')}
              </button>
            </div>

            {showFilters ? (
              <div className="mt-3 grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2 lg:hidden">
                <select
                  value={cropKey}
                  onChange={(event) => setCropKey(event.target.value)}
                  className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
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
                  className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
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
                  className="h-11 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 sm:col-span-2"
                >
                  {t('filters.clear')}
                </button>
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-emerald-100/80">
            <span>
              {total} {t('results')}
            </span>

            {search || district || cropKey ? (
              <button
                onClick={clearFilters}
                className="font-semibold text-emerald-200 hover:text-white"
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
                  className="h-52 animate-pulse rounded-2xl bg-slate-100"
                />
              ))}
            </div>
          ) : error ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
              <ClipboardList className="mx-auto h-8 w-8 text-red-500" />
              <p className="mt-3 font-semibold text-red-900">
                {t('errors.title')}
              </p>

              <button
                onClick={() => void load()}
                className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-red-700 shadow-sm"
              >
                <RefreshCw className="h-4 w-4" />
                {t('errors.retry')}
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <ClipboardList className="mx-auto h-9 w-9 text-slate-300" />
              <p className="mt-3 font-semibold text-slate-900">
                {t('empty.title')}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {t('empty.description')}
              </p>

              {search || district || cropKey ? (
                <button
                  onClick={clearFilters}
                  className="mt-4 text-sm font-semibold text-emerald-700"
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

                  <span className="text-sm text-slate-600">
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
                  className="h-52 animate-pulse rounded-2xl bg-slate-100"
                />
              ))}
            </div>
          ) : mine.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <ClipboardList className="mx-auto h-9 w-9 text-slate-300" />
              <p className="mt-3 font-semibold text-slate-900">
                {t('mine.emptyTitle')}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {t('mine.emptyDescription')}
              </p>

              <Link
                href={`/${locale}/dashboard/buyer-requirements/create`}
                className="mt-4 inline-flex min-h-10 items-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white"
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
