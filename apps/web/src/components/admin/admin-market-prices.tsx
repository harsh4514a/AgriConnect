'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Database,
  Eye,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  TrendingUp,
  X,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Locale } from '@/i18n/config';
import { getLocalizedDomainName } from '@agri/domain-data';
import {
  adminGetMarketPriceRecordApi,
  adminGetMarketPricesApi,
  adminGetMarketPricesFiltersApi,
  type AdminMarketPriceItem,
  type AdminMarketPriceSyncInfo,
  type AdminMarketPricesFiltersResponse,
  type AdminMarketPricesSortBy,
  type AdminMarketPricesSortDir,
} from '@/services/admin-api/admin-market-prices.api';

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 25;
const DEBOUNCE_MS = 350;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getIntlLocale(locale: string) {
  if (locale === 'gu') return 'gu-IN';
  if (locale === 'hi') return 'hi-IN';
  return 'en-IN';
}

function formatDate(value: string | null | undefined, locale: string): string {
  if (!value) return '—';
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatDateTime(value: string | null | undefined, locale: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/** Format a price (₹/quintal) clearly for Admin display. */
function formatPrice(value: number, locale: string): string {
  return `₹${new Intl.NumberFormat(getIntlLocale(locale), {
    maximumFractionDigits: 2,
  }).format(value)}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <div className="space-y-2 p-4 sm:p-5" aria-busy="true" aria-label="Loading market prices">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-[60px] animate-pulse rounded-xl border border-slate-200 bg-white" />
      ))}
    </div>
  );
}

function SortButton({
  field,
  label,
  sortBy,
  sortDir,
  onSort,
}: {
  field: AdminMarketPricesSortBy;
  label: string;
  sortBy: AdminMarketPricesSortBy;
  sortDir: AdminMarketPricesSortDir;
  onSort: (field: AdminMarketPricesSortBy) => void;
}) {
  const active = sortBy === field;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={cn(
        'flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.1em] transition-colors',
        active ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-700',
      )}
      aria-label={`${label} ${active ? (sortDir === 'asc' ? '(ascending)' : '(descending)') : ''}`}
    >
      {label}
      {active ? (
        sortDir === 'asc' ? (
          <ArrowUp className="h-3 w-3" aria-hidden="true" />
        ) : (
          <ArrowDown className="h-3 w-3" aria-hidden="true" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40" aria-hidden="true" />
      )}
    </button>
  );
}

// ─── Sync Info Strip ──────────────────────────────────────────────────────────

function SyncInfoBar({
  info,
  locale,
  t,
}: {
  info: AdminMarketPriceSyncInfo | null;
  locale: string;
  t: ReturnType<typeof useTranslations<'admin'>>;
}) {
  if (!info) return null;

  const items = [
    {
      icon: Calendar,
      label: t('marketPrices.syncInfo.latestDataDate'),
      value: formatDate(info.latestDataDate, locale),
      highlight: true,
    },
    {
      icon: Clock,
      label: t('marketPrices.syncInfo.lastFetched'),
      value: formatDateTime(info.latestFetchedAt, locale),
    },
    {
      icon: Database,
      label: t('marketPrices.syncInfo.totalRecords'),
      value: info.totalRecords.toLocaleString(getIntlLocale(locale)),
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
      {items.map(({ icon: Icon, label, value, highlight }) => (
        <div key={label} className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
          <span className="text-xs text-slate-500">{label}:</span>
          <span
            className={cn(
              'text-xs font-bold',
              highlight ? 'text-emerald-800' : 'text-slate-700',
            )}
          >
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────

function DetailDrawer({
  open,
  record,
  loading,
  error,
  locale,
  t,
  onClose,
  onRetry,
}: {
  open: boolean;
  record: AdminMarketPriceItem | null;
  loading: boolean;
  error: boolean;
  locale: string;
  t: ReturnType<typeof useTranslations<'admin'>>;
  onClose: () => void;
  onRetry: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/35 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside
        className="flex h-full w-full max-w-lg flex-col overflow-hidden bg-[#f7f9f5] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mp-details-title"
      >
        {/* Drawer header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#123b2b] px-5 py-4 text-white">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-200">
              {t('marketPrices.detailsEyebrow')}
            </p>
            <h2 id="mp-details-title" className="mt-0.5 truncate text-lg font-bold">
              {record ? getLocalizedDomainName(record.commodity, locale, 'commodity') : t('marketPrices.detailsTitle')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-emerald-100 hover:bg-white/10"
            aria-label={t('marketPrices.closeDetails')}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Drawer body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          {loading ? (
            <div className="space-y-4" aria-busy="true">
              <div className="h-28 animate-pulse rounded-2xl bg-white" />
              <div className="h-40 animate-pulse rounded-2xl bg-white" />
              <div className="h-32 animate-pulse rounded-2xl bg-white" />
            </div>
          ) : error || !record ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
              <AlertCircle className="mx-auto h-6 w-6 text-red-600" aria-hidden="true" />
              <p className="mt-3 text-sm font-bold text-red-900">
                {t('marketPrices.detailsError')}
              </p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-3 text-sm font-bold text-red-700 underline-offset-2 hover:underline"
              >
                {t('marketPrices.retry')}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Commodity */}
              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                  <h3 className="text-sm font-bold text-slate-900">
                    {t('marketPrices.details.commoditySection')}
                  </h3>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {t('marketPrices.columns.commodity')}
                    </dt>
                    <dd className="mt-1 text-sm font-bold text-slate-800">{getLocalizedDomainName(record.commodity, locale, 'commodity')}</dd>
                  </div>
                  {record.variety ? (
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        {t('marketPrices.columns.variety')}
                      </dt>
                      <dd className="mt-1 text-sm font-bold text-slate-800">{getLocalizedDomainName(record.variety, locale, 'marketVariety')}</dd>
                    </div>
                  ) : null}
                  {record.grade ? (
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        {t('marketPrices.details.grade')}
                      </dt>
                      <dd className="mt-1 text-sm font-semibold text-slate-700">{getLocalizedDomainName(record.grade, locale, 'grade')}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {t('marketPrices.columns.dataDate')}
                    </dt>
                    <dd className="mt-1 text-sm font-bold text-emerald-700">
                      {formatDate(record.dataDate, locale)}
                    </dd>
                  </div>
                </dl>
              </section>

              {/* Prices */}
              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-bold text-slate-900">
                  {t('marketPrices.details.pricesSection')}
                </h3>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {t('marketPrices.details.priceUnit')}
                </p>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { key: 'minimumPrice', value: record.minimumPrice, color: 'text-slate-700' },
                    { key: 'modalPrice', value: record.modalPrice, color: 'text-emerald-700 text-base' },
                    { key: 'maximumPrice', value: record.maximumPrice, color: 'text-slate-700' },
                  ].map(({ key, value, color }) => (
                    <div
                      key={key}
                      className={cn(
                        'rounded-xl border p-3 text-center',
                        key === 'modalPrice'
                          ? 'border-emerald-200 bg-emerald-50/70'
                          : 'border-slate-100 bg-slate-50',
                      )}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        {t(`marketPrices.columns.${key}` as never)}
                      </p>
                      <p className={cn('mt-1 font-bold', color)}>
                        {formatPrice(value, locale)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Location */}
              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-bold text-slate-900">
                  {t('marketPrices.details.locationSection')}
                </h3>
                <dl className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {t('marketPrices.columns.market')}
                    </dt>
                    <dd className="mt-1 text-sm font-bold text-slate-800">{getLocalizedDomainName(record.market, locale, 'market')}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {t('marketPrices.columns.district')}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-700">{getLocalizedDomainName(record.district, locale, 'district')}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {t('marketPrices.details.state')}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-700">{getLocalizedDomainName(record.state, locale, 'state')}</dd>
                  </div>
                </dl>
              </section>

              {/* Source */}
              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-bold text-slate-900">
                  {t('marketPrices.details.sourceSection')}
                </h3>
                <dl className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {t('marketPrices.details.source')}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-700">{record.source}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {t('marketPrices.details.fetchedAt')}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-700">
                      {formatDateTime(record.fetchedAt, locale)}
                    </dd>
                  </div>
                </dl>
              </section>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AdminMarketPrices() {
  const t = useTranslations('admin');
  const locale = ((useParams()?.locale as Locale) || 'en') as Locale;

  // ── Data state ──────────────────────────────────────────────────────────────
  const [items, setItems] = useState<AdminMarketPriceItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 });
  const [syncInfo, setSyncInfo] = useState<AdminMarketPriceSyncInfo | null>(null);
  const [filters, setFilters] = useState<AdminMarketPricesFiltersResponse | null>(null);

  // ── Search & filter state ───────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('');
  const [market, setMarket] = useState('');
  const [commodity, setCommodity] = useState('');
  const [date, setDate] = useState('');
  const [sortBy, setSortBy] = useState<AdminMarketPricesSortBy>('commodity');
  const [sortDir, setSortDir] = useState<AdminMarketPricesSortDir>('asc');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filtersError, setFiltersError] = useState(false);

  // ── Detail drawer state ─────────────────────────────────────────────────────
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminMarketPriceItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(false);

  // ── Debounce search ─────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  // ── Load filter options once ────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    void adminGetMarketPricesFiltersApi()
      .then((data) => {
        if (!mounted) return;
        setFilters(data);
        setFiltersError(false);
      })
      .catch(() => {
        if (!mounted) return;
        setFiltersError(true);
      });
    return () => { mounted = false; };
  }, []);

  // ── Load records ────────────────────────────────────────────────────────────
  const loadRecords = useCallback(async (page: number) => {
    setLoading(true);
    setError(false);
    try {
      const res = await adminGetMarketPricesApi({
        page,
        pageSize: PAGE_SIZE,
        ...(search ? { search } : {}),
        ...(district ? { district } : {}),
        ...(market ? { market } : {}),
        ...(commodity ? { commodity } : {}),
        ...(date ? { date } : {}),
        sortBy,
        sortDir,
      });
      setItems(res.items);
      setPagination(res.pagination);
      setSyncInfo(res.syncInfo);
    } catch {
      setItems([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [search, district, market, commodity, date, sortBy, sortDir]);

  useEffect(() => { void loadRecords(1); }, [loadRecords]);

  // ── Keyboard close for drawer ───────────────────────────────────────────────
  useEffect(() => {
    if (!selectedId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedId(null);
        setSelected(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedId]);

  // ── Open detail drawer ──────────────────────────────────────────────────────
  const openDetail = async (id: string) => {
    setSelectedId(id);
    setSelected(null);
    setDetailError(false);
    setDetailLoading(true);
    try {
      setSelected(await adminGetMarketPriceRecordApi(id));
    } catch {
      setDetailError(true);
    } finally {
      setDetailLoading(false);
    }
  };

  const retryDetail = () => {
    if (selectedId) void openDetail(selectedId);
  };

  // ── Sorting ─────────────────────────────────────────────────────────────────
  const handleSort = (field: AdminMarketPricesSortBy) => {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  // ── Clear filters ───────────────────────────────────────────────────────────
  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setDistrict('');
    setMarket('');
    setCommodity('');
    setDate('');
    setSortBy('commodity');
    setSortDir('asc');
    setFiltersOpen(false);
  };

  // ── Computed ────────────────────────────────────────────────────────────────
  const filterCount = useMemo(
    () => [search, district, market, commodity, date].filter(Boolean).length,
    [search, district, market, commodity, date],
  );
  const from = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const to = Math.min(pagination.page * pagination.pageSize, pagination.total);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="space-y-5">
        {/* ── Header section ── */}
        <section className="rounded-2xl border border-[#cbd7cf] bg-[#f6f8f3] p-5 shadow-[0_12px_32px_rgba(20,55,38,0.06)] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                {t('marketPrices.eyebrow')}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">
                {t('marketPrices.title')}
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
                {t('marketPrices.subtitle')}
              </p>
            </div>
          </div>

          {/* Sync info */}
          <div className="mt-4 border-t border-[#d7e3d7] pt-4">
            {syncInfo ? (
              <SyncInfoBar info={syncInfo} locale={locale} t={t} />
            ) : !loading ? (
              <p className="text-xs text-slate-400">{t('marketPrices.syncInfo.unavailable')}</p>
            ) : (
              <div className="h-4 w-72 animate-pulse rounded bg-slate-200" />
            )}
          </div>
        </section>

        {/* ── Search + Filter toolbar ── */}
        <section className="rounded-2xl border border-[#cbd7cf] bg-[#f6f8f3] p-3 shadow-[0_10px_28px_rgba(20,55,38,0.045)] sm:p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            {/* Search */}
            <div className="min-w-0 flex-1">
              <label className="sr-only" htmlFor="admin-mp-search">
                {t('marketPrices.searchLabel')}
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="admin-mp-search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={t('marketPrices.searchPlaceholder')}
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50"
                />
              </div>
            </div>

            {/* Inline quick-filters (desktop) */}
            <div className="hidden items-center gap-2 xl:flex">
              <select
                aria-label={t('marketPrices.commodityFilter')}
                value={commodity}
                onChange={(e) => setCommodity(e.target.value)}
                className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500"
              >
                <option value="">{t('marketPrices.allCommodities')}</option>
                {filters?.commodities.map((c) => (
                  <option key={c} value={c}>{getLocalizedDomainName(c, locale, 'commodity')}</option>
                ))}
              </select>
              <select
                aria-label={t('marketPrices.dateFilter')}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500"
              >
                <option value="">{t('marketPrices.allDates')}</option>
                {filters?.availableDates.map((d) => (
                  <option key={d} value={d}>{formatDate(d, locale)}</option>
                ))}
              </select>
            </div>

            {/* Filters toggle */}
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-expanded={filtersOpen}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-bold text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/50"
            >
              <Filter className="h-4 w-4" aria-hidden="true" />
              {t('marketPrices.filters')}
              {filterCount > 0 ? (
                <span className="inline-flex min-w-5 justify-center rounded-full bg-emerald-700 px-1.5 py-0.5 text-[10px] text-white">
                  {filterCount}
                </span>
              ) : null}
            </button>

            {filterCount > 0 ? (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-bold text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                {t('marketPrices.clearFilters')}
              </button>
            ) : null}
          </div>

          {/* Expanded filter panel */}
          {filtersOpen ? (
            <div className="mt-3 grid gap-3 border-t border-slate-200/80 pt-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              {/* Commodity (mobile) */}
              <div className="xl:hidden">
                <label className="mb-1.5 block text-xs font-bold text-slate-600" htmlFor="mp-commodity">
                  {t('marketPrices.commodityFilter')}
                </label>
                <select
                  id="mp-commodity"
                  value={commodity}
                  onChange={(e) => setCommodity(e.target.value)}
                  className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500"
                >
                  <option value="">{t('marketPrices.allCommodities')}</option>
                  {filters?.commodities.map((c) => (
                    <option key={c} value={c}>{getLocalizedDomainName(c, locale, 'commodity')}</option>
                  ))}
                </select>
              </div>

              {/* Date (mobile) */}
              <div className="xl:hidden">
                <label className="mb-1.5 block text-xs font-bold text-slate-600" htmlFor="mp-date-mobile">
                  {t('marketPrices.dateFilter')}
                </label>
                <select
                  id="mp-date-mobile"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500"
                >
                  <option value="">{t('marketPrices.allDates')}</option>
                  {filters?.availableDates.map((d) => (
                    <option key={d} value={d}>{formatDate(d, locale)}</option>
                  ))}
                </select>
              </div>

              {/* District */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600" htmlFor="mp-district">
                  {t('marketPrices.districtFilter')}
                </label>
                <select
                  id="mp-district"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500"
                >
                  <option value="">{t('marketPrices.allDistricts')}</option>
                  {filters?.districts.map((d) => (
                    <option key={d} value={d}>{getLocalizedDomainName(d, locale, 'district')}</option>
                  ))}
                </select>
              </div>

              {/* Market */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600" htmlFor="mp-market">
                  {t('marketPrices.marketFilter')}
                </label>
                <select
                  id="mp-market"
                  value={market}
                  onChange={(e) => setMarket(e.target.value)}
                  className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500"
                >
                  <option value="">{t('marketPrices.allMarkets')}</option>
                  {filters?.markets.map((m) => (
                    <option key={m} value={m}>{getLocalizedDomainName(m, locale, 'market')}</option>
                  ))}
                </select>
              </div>

              {filtersError ? (
                <p className="flex items-center gap-1.5 text-xs font-medium text-amber-700 sm:col-span-2 xl:col-span-5">
                  <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('marketPrices.filtersError')}
                </p>
              ) : null}
            </div>
          ) : null}
        </section>

        {/* ── Table section ── */}
        <section className="overflow-hidden rounded-2xl border border-[#cbd7cf] bg-[#f8faf7] shadow-[0_12px_32px_rgba(20,55,38,0.05)]">
          {/* Table toolbar */}
          <div className="flex flex-col gap-2 border-b border-slate-200/80 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <p className="text-sm font-bold text-slate-900">
                {t('marketPrices.recordCount', { count: pagination.total })}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {t('marketPrices.showing', { from, to, total: pagination.total })}
              </p>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={() => void loadRecords(pagination.page)}
              className="inline-flex min-h-9 items-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:border-emerald-200 hover:text-emerald-700 disabled:opacity-60 sm:self-auto"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} aria-hidden="true" />
              {t('marketPrices.refresh')}
            </button>
          </div>

          {/* Error */}
          {error ? (
            <div role="alert" className="m-4 rounded-xl border border-red-200 bg-red-50 p-5 sm:m-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-bold text-red-900">{t('marketPrices.errorTitle')}</p>
                    <p className="mt-1 text-sm text-red-700">{t('marketPrices.loadError')}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void loadRecords(pagination.page)}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-200 bg-white px-3.5 text-sm font-bold text-red-700"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  {t('marketPrices.retry')}
                </button>
              </div>
            </div>

          /* Loading */
          ) : loading ? (
            <SkeletonRows />

          /* Empty */
          ) : items.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                {filterCount > 0 ? (
                  <Filter className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Database className="h-5 w-5" aria-hidden="true" />
                )}
              </div>
              <p className="mt-4 text-sm font-bold text-slate-900">
                {filterCount > 0 ? t('marketPrices.noResults') : t('marketPrices.noData')}
              </p>
              <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
                {filterCount > 0 ? t('marketPrices.noResultsHint') : t('marketPrices.noDataHint')}
              </p>
              {filterCount > 0 ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 text-sm font-bold text-emerald-700"
                >
                  {t('marketPrices.clearFilters')}
                </button>
              ) : null}
            </div>

          /* Data table */
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[900px] text-left" role="table">
                  <thead className="bg-[#eef3ed]">
                    <tr>
                      <th className="px-5 py-3.5" scope="col">
                        <SortButton
                          field="commodity"
                          label={t('marketPrices.columns.commodity')}
                          sortBy={sortBy}
                          sortDir={sortDir}
                          onSort={handleSort}
                        />
                      </th>
                      <th className="px-4 py-3.5" scope="col">
                        <SortButton
                          field="market"
                          label={t('marketPrices.columns.market')}
                          sortBy={sortBy}
                          sortDir={sortDir}
                          onSort={handleSort}
                        />
                      </th>
                      <th className="px-4 py-3.5" scope="col">
                        <SortButton
                          field="district"
                          label={t('marketPrices.columns.district')}
                          sortBy={sortBy}
                          sortDir={sortDir}
                          onSort={handleSort}
                        />
                      </th>
                      <th
                        className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500"
                        scope="col"
                      >
                        {t('marketPrices.columns.minimumPrice')}
                      </th>
                      <th className="px-4 py-3.5" scope="col">
                        <SortButton
                          field="modalPrice"
                          label={t('marketPrices.columns.modalPrice')}
                          sortBy={sortBy}
                          sortDir={sortDir}
                          onSort={handleSort}
                        />
                      </th>
                      <th
                        className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500"
                        scope="col"
                      >
                        {t('marketPrices.columns.maximumPrice')}
                      </th>
                      <th className="px-4 py-3.5" scope="col">
                        <SortButton
                          field="dataDate"
                          label={t('marketPrices.columns.dataDate')}
                          sortBy={sortBy}
                          sortDir={sortDir}
                          onSort={handleSort}
                        />
                      </th>
                      <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500" scope="col">
                        {t('marketPrices.columns.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70">
                    {items.map((item) => (
                      <tr
                        key={item.id}
                        className="bg-[#fbfcfa] transition hover:bg-emerald-50/30"
                      >
                        <td className="px-5 py-3.5">
                          <p className="min-w-[140px] truncate text-sm font-bold text-slate-900">
                            {getLocalizedDomainName(item.commodity, locale, 'commodity')}
                          </p>
                          {item.variety ? (
                            <p className="mt-0.5 truncate text-xs text-slate-400">{getLocalizedDomainName(item.variety, locale, 'marketVariety')}</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="min-w-[120px] truncate text-sm font-semibold text-slate-800">
                            {getLocalizedDomainName(item.market, locale, 'market')}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-slate-600">{getLocalizedDomainName(item.district, locale, 'district')}</td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">
                          {formatPrice(item.minimumPrice, locale)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <span className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-sm font-bold text-emerald-800">
                            {formatPrice(item.modalPrice, locale)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">
                          {formatPrice(item.maximumPrice, locale)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-xs font-medium text-slate-500">
                          {formatDate(item.dataDate, locale)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => void openDetail(item.id)}
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                          >
                            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                            {t('marketPrices.viewDetails')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="grid gap-3 p-3 lg:hidden sm:p-4">
                {items.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-[#fbfcfa] p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">{getLocalizedDomainName(item.commodity, locale, 'commodity')}</p>
                        {item.variety ? (
                          <p className="mt-0.5 truncate text-xs text-slate-400">{getLocalizedDomainName(item.variety, locale, 'marketVariety')}</p>
                        ) : null}
                        <p className="mt-1 text-xs text-slate-500">
                          {getLocalizedDomainName(item.market, locale, 'market')} · {getLocalizedDomainName(item.district, locale, 'district')}
                        </p>
                      </div>
                      <span className="inline-flex shrink-0 items-center rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-sm font-bold text-emerald-800">
                        {formatPrice(item.modalPrice, locale)}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-200 pt-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400">
                          {t('marketPrices.columns.minimumPrice')}
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-700">
                          {formatPrice(item.minimumPrice, locale)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400">
                          {t('marketPrices.columns.maximumPrice')}
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-700">
                          {formatPrice(item.maximumPrice, locale)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400">
                          {t('marketPrices.columns.dataDate')}
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-700">
                          {formatDate(item.dataDate, locale)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => void openDetail(item.id)}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#15583b] px-3 text-xs font-bold text-white"
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        {t('marketPrices.viewDetails')}
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex flex-col gap-3 border-t border-slate-200/80 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <p className="text-xs font-medium text-slate-500">
                  {t('marketPrices.page', { page: pagination.page, totalPages: pagination.totalPages })}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={pagination.page <= 1}
                    onClick={() => void loadRecords(pagination.page - 1)}
                    className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    {t('marketPrices.previous')}
                  </button>
                  <button
                    type="button"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => void loadRecords(pagination.page + 1)}
                    className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 disabled:opacity-40"
                  >
                    {t('marketPrices.next')}
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {/* ── Detail Drawer ── */}
      <DetailDrawer
        open={!!selectedId}
        record={selected}
        loading={detailLoading}
        error={detailError}
        locale={locale}
        t={t}
        onClose={() => { setSelectedId(null); setSelected(null); }}
        onRetry={retryDetail}
      />
    </>
  );
}
