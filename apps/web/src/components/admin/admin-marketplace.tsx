'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Eye,
  Filter,
  Leaf,
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShoppingBasket,
  SlidersHorizontal,
  UserRound,
  X,
  XCircle,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Locale } from '@/i18n/config';
import { getLocalizedDomainName } from '@agri/domain-data';
import {
  adminGetMarketplaceApi,
  adminGetMarketplaceFiltersApi,
  adminGetMarketplaceListingApi,
  adminUpdateMarketplaceStatusApi,
  type AdminMarketplaceDetails,
  type AdminMarketplaceListItem,
  type AdminMarketplaceSort,
  type AdminMarketplaceStatus,
} from '@/services/admin-api/admin-marketplace.api';

const PAGE_SIZE = 20;

type AdminT = ReturnType<typeof useTranslations<'admin'>>;

function formatDate(value: string, locale: string, withTime = false) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    ...(withTime ? { timeStyle: 'short' } : {}),
  }).format(new Date(value));
}

function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

function cropLabel(item: Pick<AdminMarketplaceListItem, 'cropKey' | 'customCropName'>, t: AdminT, locale: string) {
  if (item.customCropName?.trim()) return item.customCropName.trim();
  const localized = getLocalizedDomainName(item.cropKey, locale, 'crop');
  return localized !== item.cropKey ? localized : t(`marketplace.crops.${item.cropKey}` as never);
}

function localizedLocation(location: { village?: string | null; taluka?: string | null; district?: string | null; state?: string | null }, locale: string) {
  return [
    getLocalizedDomainName(location.village, locale, 'village'),
    getLocalizedDomainName(location.taluka, locale, 'taluka'),
    getLocalizedDomainName(location.district, locale, 'district'),
    getLocalizedDomainName(location.state, locale, 'state'),
  ].filter(Boolean).join(', ');
}

function StatusBadge({ status, t }: { status: AdminMarketplaceStatus; t: AdminT }) {
  const config = {
    active: { icon: CheckCircle2, className: 'border-accent/30 bg-accent-soft text-accent' },
    sold: { icon: CircleDollarSign, className: 'border-warning/30 bg-warning/10 text-warning' },
    inactive: { icon: XCircle, className: 'border-border bg-surface-subtle text-muted-foreground' },
  }[status];
  const Icon = config.icon;

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold', config.className)}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {t(`marketplace.status.${status}` as never)}
    </span>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-2 p-4 sm:p-5" aria-busy="true">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="h-[72px] animate-pulse rounded-xl border border-border bg-surface" />
      ))}
    </div>
  );
}

export function AdminMarketplace() {
  const t = useTranslations('admin');
  const locale = ((useParams()?.locale as Locale) || 'en') as Locale;

  const [items, setItems] = useState<AdminMarketplaceListItem[]>([]);
  const [summary, setSummary] = useState({ total: 0, active: 0, inactive: 0, sold: 0, recentlyAdded: 0 });
  const [pagination, setPagination] = useState({ page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 });
  const [cropKeys, setCropKeys] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [cropKey, setCropKey] = useState('');
  const [district, setDistrict] = useState('');
  const [status, setStatus] = useState<'all' | AdminMarketplaceStatus>('all');
  const [listedFrom, setListedFrom] = useState('');
  const [listedTo, setListedTo] = useState('');
  const [sort, setSort] = useState<AdminMarketplaceSort>('newest');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filtersError, setFiltersError] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminMarketplaceDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<AdminMarketplaceStatus | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [mutationMessage, setMutationMessage] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let mounted = true;
    void adminGetMarketplaceFiltersApi()
      .then((response) => {
        if (!mounted) return;
        setCropKeys(response.cropKeys);
        setDistricts(response.districts);
        setFiltersError(false);
      })
      .catch(() => {
        if (!mounted) return;
        setCropKeys([]);
        setDistricts([]);
        setFiltersError(true);
      });
    return () => { mounted = false; };
  }, []);

  const loadListings = useCallback(async (page: number) => {
    setLoading(true);
    setError(false);
    try {
      const response = await adminGetMarketplaceApi({
        page,
        pageSize: PAGE_SIZE,
        ...(search ? { search } : {}),
        ...(cropKey ? { cropKey } : {}),
        ...(district ? { district } : {}),
        ...(status !== 'all' ? { status } : {}),
        ...(listedFrom ? { listedFrom: new Date(`${listedFrom}T00:00:00`).toISOString() } : {}),
        ...(listedTo ? { listedTo: new Date(new Date(`${listedTo}T00:00:00`).getTime() + 86400000).toISOString() } : {}),
        sort,
      });
      setItems(response.items);
      setPagination(response.pagination);
      setSummary(response.summary);
    } catch {
      setItems([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [cropKey, district, listedFrom, listedTo, search, sort, status]);

  useEffect(() => { void loadListings(1); }, [loadListings]);

  useEffect(() => {
    if (!selectedId && !pendingStatus) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !updatingStatus) {
        setPendingStatus(null);
        setSelectedId(null);
        setSelected(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pendingStatus, selectedId, updatingStatus]);

  const openDetails = async (id: string) => {
    setSelectedId(id);
    setSelected(null);
    setDetailsError(false);
    setMutationMessage(null);
    setDetailsLoading(true);
    try {
      setSelected(await adminGetMarketplaceListingApi(id));
    } catch {
      setDetailsError(true);
    } finally {
      setDetailsLoading(false);
    }
  };

  const confirmStatusChange = async () => {
    if (!selected || !pendingStatus) return;
    setUpdatingStatus(true);
    setMutationMessage(null);
    try {
      await adminUpdateMarketplaceStatusApi(selected.id, pendingStatus);
      setSelected((current) => current ? { ...current, status: pendingStatus } : current);
      setPendingStatus(null);
      setMutationMessage('success');
      await loadListings(pagination.page);
    } catch {
      setMutationMessage('error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setCropKey('');
    setDistrict('');
    setStatus('all');
    setListedFrom('');
    setListedTo('');
    setSort('newest');
    setFiltersOpen(false);
  };

  const filterCount = [search, cropKey, district, status !== 'all' ? status : '', listedFrom, listedTo].filter(Boolean).length;
  const from = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const to = Math.min(pagination.page * pagination.pageSize, pagination.total);

  const summaryCards = useMemo(() => [
    { key: 'total', value: summary.total, icon: ShoppingBasket, className: 'border-border bg-surface' },
    { key: 'active', value: summary.active, icon: CheckCircle2, className: 'border-emerald-100 bg-accent-soft/70' },
    { key: 'inactive', value: summary.inactive + summary.sold, icon: XCircle, className: 'border-border bg-surface-subtle/70' },
    { key: 'recentlyAdded', value: summary.recentlyAdded, icon: Clock3, className: 'border-amber-100 bg-warning/10' },
  ] as const, [summary]);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_12px_32px_rgba(20,55,38,0.06)] sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
              <Leaf className="h-3.5 w-3.5" aria-hidden="true" />{t('marketplace.eyebrow')}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-[28px]">{t('marketplace.title')}</h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">{t('marketplace.subtitle')}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {summaryCards.map(({ key, value, icon: Icon, className }) => (
              <div key={key} className={cn('min-w-[110px] rounded-xl border px-3 py-2.5', className)}>
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground"><Icon className="h-3.5 w-3.5" aria-hidden="true" />{t(`marketplace.summary.${key}` as never)}</p>
                <p className="mt-1 text-lg font-bold text-foreground">{value.toLocaleString(locale)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[0_10px_28px_rgba(20,55,38,0.045)] sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="min-w-0 flex-1">
            <label className="sr-only" htmlFor="admin-marketplace-search">{t('marketplace.searchLabel')}</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input id="admin-marketplace-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder={t('marketplace.searchPlaceholder')} className="min-h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-focus focus:ring-4 focus:ring-focus" />
            </div>
          </div>
          <div className="hidden items-center gap-2 xl:flex">
            <select aria-label={t('marketplace.cropFilter')} value={cropKey} onChange={(event) => setCropKey(event.target.value)} className="min-h-11 rounded-xl border border-border bg-surface px-3 text-sm font-medium text-foreground outline-none focus:border-focus">
              <option value="">{t('marketplace.allCrops')}</option>
              {cropKeys.map((key) => <option key={key} value={key}>{cropLabel({ cropKey: key, customCropName: null }, t, locale)}</option>)}
            </select>
            <select aria-label={t('marketplace.statusFilter')} value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="min-h-11 rounded-xl border border-border bg-surface px-3 text-sm font-medium text-foreground outline-none focus:border-focus">
              <option value="all">{t('marketplace.allStatuses')}</option>
              <option value="active">{t('marketplace.status.active')}</option>
              <option value="sold">{t('marketplace.status.sold')}</option>
              <option value="inactive">{t('marketplace.status.inactive')}</option>
            </select>
            <select aria-label={t('marketplace.sortLabel')} value={sort} onChange={(event) => setSort(event.target.value as AdminMarketplaceSort)} className="min-h-11 rounded-xl border border-border bg-surface px-3 text-sm font-medium text-foreground outline-none focus:border-focus">
              <option value="newest">{t('marketplace.newest')}</option>
              <option value="oldest">{t('marketplace.oldest')}</option>
            </select>
          </div>
          <button type="button" onClick={() => setFiltersOpen((value) => !value)} aria-expanded={filtersOpen} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3.5 text-sm font-bold text-foreground hover:border-accent/30 hover:bg-accent-soft/50">
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />{t('marketplace.filters')}
            {filterCount > 0 ? <span className="inline-flex min-w-5 justify-center rounded-full bg-accent px-1.5 py-0.5 text-[10px] text-accent-foreground">{filterCount}</span> : null}
          </button>
          {filterCount > 0 ? <button type="button" onClick={clearFilters} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-bold text-muted-foreground hover:bg-surface-subtle"><X className="h-4 w-4" aria-hidden="true" />{t('marketplace.clearFilters')}</button> : null}
        </div>

        {filtersOpen ? (
          <div className="mt-3 grid gap-3 border-t border-border/80 pt-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            <div className="xl:hidden">
              <label className="mb-1.5 block text-xs font-bold text-muted-foreground" htmlFor="marketplace-crop">{t('marketplace.cropFilter')}</label>
              <select id="marketplace-crop" value={cropKey} onChange={(event) => setCropKey(event.target.value)} className="min-h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-focus"><option value="">{t('marketplace.allCrops')}</option>{cropKeys.map((key) => <option key={key} value={key}>{cropLabel({ cropKey: key, customCropName: null }, t, locale)}</option>)}</select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-muted-foreground" htmlFor="marketplace-district">{t('marketplace.districtFilter')}</label>
              <select id="marketplace-district" value={district} onChange={(event) => setDistrict(event.target.value)} className="min-h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-focus"><option value="">{t('marketplace.allDistricts')}</option>{districts.map((value) => <option key={value} value={value}>{getLocalizedDomainName(value, locale, 'district')}</option>)}</select>
            </div>
            <div><label className="mb-1.5 block text-xs font-bold text-muted-foreground" htmlFor="marketplace-from">{t('marketplace.dateFrom')}</label><input id="marketplace-from" type="date" value={listedFrom} onChange={(event) => setListedFrom(event.target.value)} className="min-h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-focus" /></div>
            <div><label className="mb-1.5 block text-xs font-bold text-muted-foreground" htmlFor="marketplace-to">{t('marketplace.dateTo')}</label><input id="marketplace-to" type="date" value={listedTo} onChange={(event) => setListedTo(event.target.value)} className="min-h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-focus" /></div>
            <div className="xl:hidden"><label className="mb-1.5 block text-xs font-bold text-muted-foreground" htmlFor="marketplace-status">{t('marketplace.statusFilter')}</label><select id="marketplace-status" value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="min-h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-focus"><option value="all">{t('marketplace.allStatuses')}</option><option value="active">{t('marketplace.status.active')}</option><option value="sold">{t('marketplace.status.sold')}</option><option value="inactive">{t('marketplace.status.inactive')}</option></select></div>
            {filtersError ? <p className="flex items-center gap-1.5 text-xs font-medium text-warning sm:col-span-2 xl:col-span-5"><AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />{t('marketplace.filtersError')}</p> : null}
          </div>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_12px_32px_rgba(20,55,38,0.05)]">
        <div className="flex flex-col gap-2 border-b border-border/80 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div><p className="text-sm font-bold text-foreground">{t('marketplace.listingCount', { count: pagination.total })}</p><p className="mt-0.5 text-xs text-muted-foreground">{t('marketplace.showing', { from, to, total: pagination.total })}</p></div>
          <button type="button" disabled={loading} onClick={() => void loadListings(pagination.page)} className="inline-flex min-h-9 items-center gap-1.5 self-start rounded-lg border border-border bg-surface px-3 text-xs font-bold text-muted-foreground hover:border-accent/30 hover:text-accent disabled:opacity-60 sm:self-auto"><RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} aria-hidden="true" />{t('marketplace.refresh')}</button>
        </div>

        {error ? (
          <div role="alert" className="m-4 rounded-xl border border-danger/30 bg-danger-soft p-5 sm:m-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden="true" /><div><p className="text-sm font-bold text-danger">{t('marketplace.errorTitle')}</p><p className="mt-1 text-sm text-danger">{t('marketplace.loadError')}</p></div></div><button type="button" onClick={() => void loadListings(pagination.page)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-danger/30 bg-surface px-3.5 text-sm font-bold text-danger"><RefreshCw className="h-4 w-4" aria-hidden="true" />{t('marketplace.retry')}</button></div></div>
        ) : loading ? <SkeletonRows /> : items.length === 0 ? (
          <div className="px-6 py-16 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent"><Filter className="h-5 w-5" aria-hidden="true" /></div><p className="mt-4 text-sm font-bold text-foreground">{t('marketplace.noListings')}</p><p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">{t('marketplace.noListingsHint')}</p>{filterCount > 0 ? <button type="button" onClick={clearFilters} className="mt-4 text-sm font-bold text-accent">{t('marketplace.clearFilters')}</button> : null}</div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1000px] text-left">
                <thead className="bg-[var(--surface-subtle)] text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground"><tr><th className="px-5 py-3.5">{t('marketplace.columns.crop')}</th><th className="px-4 py-3.5">{t('marketplace.columns.farmer')}</th><th className="px-4 py-3.5">{t('marketplace.columns.location')}</th><th className="px-4 py-3.5">{t('marketplace.columns.quantity')}</th><th className="px-4 py-3.5">{t('marketplace.columns.price')}</th><th className="px-4 py-3.5">{t('marketplace.columns.status')}</th><th className="px-4 py-3.5">{t('marketplace.columns.listed')}</th><th className="px-5 py-3.5 text-right">{t('marketplace.columns.actions')}</th></tr></thead>
                <tbody className="divide-y divide-border/70">
                  {items.map((item) => <tr key={item.id} className="bg-[var(--surface)] transition hover:bg-accent-soft/30">
                    <td className="px-5 py-3.5"><div className="flex min-w-[190px] items-center gap-3"><div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-border bg-surface-subtle">{item.image ? <Image src={item.image} alt={item.imageAlt || ''} fill sizes="44px" className="object-cover" /> : <Leaf className="m-auto h-5 w-5 text-muted-foreground" />}</div><div className="min-w-0"><p className="truncate text-sm font-bold text-foreground">{cropLabel(item, t, locale)}</p>{item.variety ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{getLocalizedDomainName(item.variety, locale, 'variety')}</p> : null}</div></div></td>
                    <td className="px-4 py-3.5"><p className="min-w-[150px] truncate text-sm font-semibold text-foreground">{item.farmer.name || item.farmerName}</p><p className="mt-0.5 text-xs text-muted-foreground">{item.mobileNumber}</p></td>
                    <td className="px-4 py-3.5"><div className="flex max-w-[190px] items-start gap-1.5 text-xs text-muted-foreground"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" /><span className="line-clamp-2">{localizedLocation(item, locale)}</span></div></td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm font-semibold text-foreground">{item.quantity.toLocaleString(locale)} {getLocalizedDomainName(item.unit, locale, 'unit')}</td>
                    <td className="whitespace-nowrap px-4 py-3.5"><p className="text-sm font-bold text-foreground">{formatCurrency(item.price, locale)}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{item.primaryUnit}</p></td>
                    <td className="px-4 py-3.5"><StatusBadge status={item.status} t={t} /></td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs font-medium text-muted-foreground">{formatDate(item.createdAt, locale)}</td>
                    <td className="px-5 py-3.5 text-right"><button type="button" onClick={() => void openDetails(item.id)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-bold text-muted-foreground hover:border-accent/30 hover:bg-accent-soft hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"><Eye className="h-3.5 w-3.5" aria-hidden="true" />{t('marketplace.viewDetails')}</button></td>
                  </tr>)}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-3 lg:hidden sm:p-4">
              {items.map((item) => <article key={item.id} className="rounded-xl border border-border bg-[var(--surface)] p-4 shadow-sm"><div className="flex items-start gap-3"><div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border bg-surface-subtle">{item.image ? <Image src={item.image} alt={item.imageAlt || ''} fill sizes="48px" className="object-cover" /> : <Leaf className="m-auto h-5 w-5 text-muted-foreground" />}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-bold text-foreground">{cropLabel(item, t, locale)}</p>{item.variety ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{getLocalizedDomainName(item.variety, locale, 'variety')}</p> : null}</div><StatusBadge status={item.status} t={t} /></div><p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-foreground"><UserRound className="h-3.5 w-3.5 text-accent" aria-hidden="true" />{item.farmer.name || item.farmerName}</p><p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />{localizedLocation(item, locale)}</p></div></div><div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3"><div><p className="text-[10px] font-bold uppercase text-muted-foreground">{t('marketplace.columns.quantity')}</p><p className="mt-1 text-xs font-bold text-foreground">{item.quantity.toLocaleString(locale)} {getLocalizedDomainName(item.unit, locale, 'unit')}</p></div><div><p className="text-[10px] font-bold uppercase text-muted-foreground">{t('marketplace.columns.price')}</p><p className="mt-1 text-xs font-bold text-foreground">{formatCurrency(item.price, locale)}</p></div><div><p className="text-[10px] font-bold uppercase text-muted-foreground">{t('marketplace.columns.listed')}</p><p className="mt-1 text-xs font-bold text-foreground">{formatDate(item.createdAt, locale)}</p></div></div><div className="mt-3 flex items-center justify-between gap-2"><a href={`tel:${item.mobileNumber}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-accent/30 bg-accent-soft px-3 text-xs font-bold text-accent"><Phone className="h-3.5 w-3.5" aria-hidden="true" />{t('marketplace.callFarmer')}</a><button type="button" onClick={() => void openDetails(item.id)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-bold text-accent-foreground"><Eye className="h-3.5 w-3.5" aria-hidden="true" />{t('marketplace.viewDetails')}</button></div></article>)}
            </div>

            <div className="flex flex-col gap-3 border-t border-border/80 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5"><p className="text-xs font-medium text-muted-foreground">{t('marketplace.page', { page: pagination.page, totalPages: pagination.totalPages })}</p><div className="flex gap-2"><button type="button" disabled={pagination.page <= 1} onClick={() => void loadListings(pagination.page - 1)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-border bg-surface px-3 text-xs font-bold text-muted-foreground disabled:opacity-40"><ChevronLeft className="h-4 w-4" aria-hidden="true" />{t('marketplace.previous')}</button><button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => void loadListings(pagination.page + 1)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-border bg-surface px-3 text-xs font-bold text-muted-foreground disabled:opacity-40">{t('marketplace.next')}<ChevronRight className="h-4 w-4" aria-hidden="true" /></button></div></div>
          </>
        )}
      </section>

      {selectedId ? <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35 backdrop-blur-[2px]" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !updatingStatus) { setSelectedId(null); setSelected(null); } }}>
        <aside className="flex h-full w-full max-w-xl flex-col overflow-hidden bg-[var(--surface)] shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="marketplace-details-title">
          <div className="flex shrink-0 items-center justify-between border-b border-border bg-[var(--hero)] px-5 py-4 text-[var(--hero-foreground)]"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--hero-muted)]">{t('marketplace.detailsEyebrow')}</p><h2 id="marketplace-details-title" className="mt-0.5 truncate text-lg font-bold">{selected ? cropLabel(selected, t, locale) : t('marketplace.detailsTitle')}</h2></div><button type="button" disabled={updatingStatus} onClick={() => { setSelectedId(null); setSelected(null); setPendingStatus(null); }} className="rounded-lg p-2 text-[var(--hero-muted)] hover:bg-surface/10 disabled:opacity-50" aria-label={t('marketplace.closeDetails')}><X className="h-5 w-5" aria-hidden="true" /></button></div>
          <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
            {detailsLoading ? <div className="space-y-4" aria-busy="true"><div className="h-28 animate-pulse rounded-2xl bg-surface" /><div className="h-40 animate-pulse rounded-2xl bg-surface" /><div className="h-40 animate-pulse rounded-2xl bg-surface" /></div> : detailsError || !selected ? <div className="rounded-2xl border border-danger/30 bg-danger-soft p-5 text-center"><AlertCircle className="mx-auto h-6 w-6 text-danger" aria-hidden="true" /><p className="mt-3 text-sm font-bold text-danger">{t('marketplace.detailsError')}</p><button type="button" onClick={() => selectedId && void openDetails(selectedId)} className="mt-3 text-sm font-bold text-danger">{t('marketplace.retry')}</button></div> : <div className="space-y-4">
              <section className="rounded-2xl border border-border bg-surface p-4"><div className="flex gap-4"><div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-surface-subtle">{selected.image ? <Image src={selected.image} alt={selected.imageAlt || ''} fill sizes="80px" className="object-cover" /> : <Leaf className="m-auto h-6 w-6 text-muted-foreground" />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-base font-bold text-foreground">{cropLabel(selected, t, locale)}</h3><StatusBadge status={selected.status} t={t} /></div>{selected.variety ? <p className="mt-1 text-sm text-muted-foreground">{getLocalizedDomainName(selected.variety, locale, 'variety')}</p> : null}<p className="mt-2 text-xs text-muted-foreground">{t('marketplace.listedOn', { date: formatDate(selected.createdAt, locale, true) })}</p></div></div></section>
              <section className="rounded-2xl border border-border bg-surface p-4"><div className="flex items-center gap-2"><ShoppingBasket className="h-4 w-4 text-accent" aria-hidden="true" /><h3 className="text-sm font-bold text-foreground">{t('marketplace.produceSection')}</h3></div><dl className="mt-4 grid grid-cols-2 gap-4"><div><dt className="text-[11px] font-semibold text-muted-foreground">{t('marketplace.columns.quantity')}</dt><dd className="mt-1 text-sm font-bold text-foreground">{selected.quantity.toLocaleString(locale)} {getLocalizedDomainName(selected.unit, locale, 'unit')}</dd></div><div><dt className="text-[11px] font-semibold text-muted-foreground">{t('marketplace.columns.price')}</dt><dd className="mt-1 text-sm font-bold text-foreground">{formatCurrency(selected.price, locale)} <span className="font-normal text-muted-foreground">/ {getLocalizedDomainName(selected.primaryUnit, locale, 'unit')}</span></dd></div>{selected.qualityGrade ? <div><dt className="text-[11px] font-semibold text-muted-foreground">{t('marketplace.quality')}</dt><dd className="mt-1 text-sm font-semibold text-foreground">{getLocalizedDomainName(selected.qualityGrade, locale, 'grade')}</dd></div> : null}{selected.cropDate ? <div><dt className="text-[11px] font-semibold text-muted-foreground">{t('marketplace.cropDate')}</dt><dd className="mt-1 text-sm font-semibold text-foreground">{selected.cropDate}</dd></div> : null}</dl>{selected.description ? <p className="mt-4 border-t border-border pt-4 text-sm leading-6 text-muted-foreground">{selected.description}</p> : null}</section>
              <section className="rounded-2xl border border-border bg-surface p-4"><div className="flex items-center gap-2"><UserRound className="h-4 w-4 text-accent" aria-hidden="true" /><h3 className="text-sm font-bold text-foreground">{t('marketplace.farmerSection')}</h3></div><div className="mt-4 flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-foreground">{selected.farmer.name || selected.farmerName}</p><p className="mt-1 text-xs text-muted-foreground">{selected.farmer.mobileNumber}</p></div><a href={`tel:${selected.farmer.mobileNumber}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-bold text-accent-foreground"><Phone className="h-3.5 w-3.5" aria-hidden="true" />{t('marketplace.callFarmer')}</a></div><div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3"><div><p className="text-[10px] font-bold uppercase text-muted-foreground">{t('marketplace.farmerListings')}</p><p className="mt-1 text-sm font-bold text-foreground">{selected.farmer.activity.listings}</p></div><div><p className="text-[10px] font-bold uppercase text-muted-foreground">{t('marketplace.farmerRequirements')}</p><p className="mt-1 text-sm font-bold text-foreground">{selected.farmer.activity.buyerRequirements}</p></div><div><p className="text-[10px] font-bold uppercase text-muted-foreground">{t('marketplace.farmerTransport')}</p><p className="mt-1 text-sm font-bold text-foreground">{selected.farmer.activity.transportListings}</p></div></div></section>
              <section className="rounded-2xl border border-border bg-surface p-4"><div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-accent" aria-hidden="true" /><h3 className="text-sm font-bold text-foreground">{t('marketplace.locationSection')}</h3></div><p className="mt-3 text-sm font-semibold text-foreground">{localizedLocation(selected, locale)}</p></section>
              {mutationMessage === 'success' ? <p role="status" className="rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm font-semibold text-accent">{t('marketplace.statusUpdateSuccess')}</p> : null}
              {mutationMessage === 'error' ? <p role="alert" className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">{t('marketplace.statusUpdateError')}</p> : null}
              <section className="rounded-2xl border border-border bg-surface p-4"><div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-bold text-foreground">{t('marketplace.manageSection')}</h3><p className="mt-1 text-xs text-muted-foreground">{t('marketplace.manageHint')}</p></div><SlidersHorizontal className="h-4 w-4 text-muted-foreground" aria-hidden="true" /></div><div className="mt-4 flex flex-wrap gap-2">{(['active', 'sold', 'inactive'] as const).map((nextStatus) => <button key={nextStatus} type="button" disabled={selected.status === nextStatus || updatingStatus} onClick={() => setPendingStatus(nextStatus)} className={cn('inline-flex min-h-10 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50', nextStatus === 'inactive' ? 'border-danger/30 text-danger hover:bg-danger-soft' : nextStatus === 'sold' ? 'border-warning/30 text-warning hover:bg-warning/10' : 'border-accent/30 text-accent hover:bg-accent-soft')}>{updatingStatus && pendingStatus === nextStatus ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}{t(`marketplace.actions.${nextStatus}` as never)}</button>)}</div></section>
            </div>}
          </div>
          {selected && pendingStatus ? <div className="shrink-0 border-t border-border bg-surface p-4"><div className="rounded-xl border border-warning/30 bg-warning/10 p-4"><p className="text-sm font-bold text-warning">{t('marketplace.confirmTitle', { status: t(`marketplace.status.${pendingStatus}` as never) })}</p><p className="mt-1 text-xs leading-5 text-warning">{t('marketplace.confirmDescription')}</p><div className="mt-3 flex justify-end gap-2"><button type="button" disabled={updatingStatus} onClick={() => setPendingStatus(null)} className="min-h-9 rounded-lg border border-border bg-surface px-3 text-xs font-bold text-muted-foreground">{t('marketplace.cancel')}</button><button type="button" disabled={updatingStatus} onClick={() => void confirmStatusChange()} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-bold text-accent-foreground disabled:opacity-60">{updatingStatus ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}{t('marketplace.confirmAction')}</button></div></div></div> : null}
        </aside>
      </div> : null}
    </div>
  );
}
