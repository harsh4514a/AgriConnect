'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Truck,
  UserRound,
  X,
  XCircle,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { getLocalizedDomainName } from '@agri/domain-data';
import {
  adminGetTransportApi,
  adminGetTransportFiltersApi,
  adminGetTransportsApi,
  adminUpdateTransportStatusApi,
  type AdminTransportDetails,
  type AdminTransportListItem,
} from '@/services/admin-api/admin-transport.api';

const PAGE_SIZE = 20;
type AdminT = (key: string, values?: Record<string, string | number>) => string;

function formatDate(value: string, locale: string, withTime = false) {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', ...(withTime ? { timeStyle: 'short' } : {}) }).format(new Date(value));
}

function vehicleLabel(item: Pick<AdminTransportListItem, 'vehicleType' | 'customVehicleType'>, t: AdminT, locale: string) {
  if (item.customVehicleType?.trim()) return item.customVehicleType.trim();
  const localized = getLocalizedDomainName(item.vehicleType, locale, 'vehicleType');
  return localized !== item.vehicleType ? localized : t(`transportManagement.vehicleTypes.${item.vehicleType}` as never);
}

function transportLocation(item: { village?: { name: string } | null; taluka?: { name: string } | null; district: { name: string } }, locale: string) {
  return [
    getLocalizedDomainName(item.village?.name, locale, 'village'),
    getLocalizedDomainName(item.taluka?.name, locale, 'taluka'),
    getLocalizedDomainName(item.district.name, locale, 'district'),
  ].filter(Boolean).join(', ');
}

function StatusBadge({ active, t }: { active: boolean; t: AdminT }) {
  return <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold', active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-600')}><span className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-emerald-600' : 'bg-slate-400')} aria-hidden="true" />{active ? t('transportManagement.active') : t('transportManagement.inactive')}</span>;
}

function AvailabilityBadge({ available, t }: { available: boolean; t: AdminT }) {
  const Icon = available ? CheckCircle2 : XCircle;
  return <span className={cn('inline-flex items-center gap-1.5 text-xs font-bold', available ? 'text-emerald-700' : 'text-slate-500')}><Icon className="h-3.5 w-3.5" aria-hidden="true" />{available ? t('transportManagement.available') : t('transportManagement.unavailable')}</span>;
}

export function AdminTransport() {
  const locale = (useParams()?.locale as string) || 'en';
  const rawT = useTranslations(locale === 'hi' ? 'api.transportManagement' : 'adminBuyerRequirementsLegacy.transportManagement');
  const t = ((key: string, values?: Record<string, string | number>) =>
    rawT(key.replace(/^transportManagement\./, '') as never, values as never)) as AdminT;
  const [items, setItems] = useState<AdminTransportListItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState<{ vehicleTypes: string[]; districts: { id: string; name: string }[]; talukas: { id: string; name: string }[]; villages: { id: string; name: string }[] }>({ vehicleTypes: [], districts: [], talukas: [], villages: [] });
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [talukaId, setTalukaId] = useState('');
  const [villageId, setVillageId] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [availability, setAvailability] = useState<'all' | 'available' | 'unavailable'>('all');
  const [activeStatus, setActiveStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminTransportDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<boolean | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [mutationMessage, setMutationMessage] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let mounted = true;
    void adminGetTransportFiltersApi().then((response) => { if (mounted) setFilters(response); }).catch(() => undefined);
    return () => { mounted = false; };
  }, []);

  const loadTransports = useCallback(async (page: number) => {
    setLoading(true); setError(false);
    try {
      const response = await adminGetTransportsApi({
        page, pageSize: PAGE_SIZE, sort,
        ...(search ? { search } : {}), ...(districtId ? { districtId } : {}), ...(talukaId ? { talukaId } : {}), ...(villageId ? { villageId } : {}), ...(vehicleType ? { vehicleType } : {}),
        ...(availability !== 'all' ? { isAvailable: availability === 'available' } : {}), ...(activeStatus !== 'all' ? { isActive: activeStatus === 'active' } : {}),
        ...(createdFrom ? { createdFrom: new Date(`${createdFrom}T00:00:00`).toISOString() } : {}), ...(createdTo ? { createdTo: new Date(new Date(`${createdTo}T00:00:00`).getTime() + 86400000).toISOString() } : {}),
      });
      setItems(response.items); setPagination(response.pagination);
    } catch { setItems([]); setError(true); } finally { setLoading(false); }
  }, [activeStatus, availability, createdFrom, createdTo, districtId, search, sort, talukaId, vehicleType, villageId]);

  useEffect(() => { void loadTransports(1); }, [loadTransports]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape' && !updatingStatus) { setPendingStatus(null); setSelectedId(null); setSelected(null); } };
    window.addEventListener('keydown', onKeyDown); return () => window.removeEventListener('keydown', onKeyDown);
  }, [updatingStatus]);

  const openDetails = async (id: string) => {
    setSelectedId(id); setSelected(null); setDetailsError(false); setMutationMessage(null); setDetailsLoading(true);
    try { setSelected(await adminGetTransportApi(id)); } catch { setDetailsError(true); } finally { setDetailsLoading(false); }
  };

  const confirmStatusChange = async () => {
    if (!selected || pendingStatus === null) return;
    setUpdatingStatus(true); setMutationMessage(null);
    try {
      await adminUpdateTransportStatusApi(selected.id, pendingStatus);
      setSelected((current) => current ? { ...current, isActive: pendingStatus } : current);
      setPendingStatus(null); setMutationMessage('success'); await loadTransports(pagination.page);
    } catch { setMutationMessage('error'); } finally { setUpdatingStatus(false); }
  };

  const clearFilters = () => { setSearchInput(''); setSearch(''); setDistrictId(''); setTalukaId(''); setVillageId(''); setVehicleType(''); setAvailability('all'); setActiveStatus('all'); setCreatedFrom(''); setCreatedTo(''); setSort('newest'); setFiltersOpen(false); };
  const filterCount = [search, districtId, talukaId, villageId, vehicleType, availability !== 'all' ? availability : '', activeStatus !== 'all' ? activeStatus : '', createdFrom, createdTo].filter(Boolean).length;
  const from = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const to = Math.min(pagination.page * pagination.pageSize, pagination.total);

  return <div className="space-y-5">
    <section className="rounded-2xl border border-[#cbd7cf] bg-[#f6f8f3] p-5 shadow-[0_12px_32px_rgba(20,55,38,0.06)] sm:p-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700"><Truck className="h-3.5 w-3.5" aria-hidden="true" />{t('transportManagement.eyebrow')}</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">{t('transportManagement.title')}</h1><p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">{t('transportManagement.subtitle')}</p></div><div className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-2.5"><p className="text-xs font-medium text-emerald-700">{t('transportManagement.total')}</p><p className="mt-0.5 text-lg font-bold text-emerald-950">{pagination.total.toLocaleString(locale)}</p></div></div></section>

    <section className="rounded-2xl border border-[#cbd7cf] bg-[#f6f8f3] p-3 shadow-[0_10px_28px_rgba(20,55,38,0.045)] sm:p-4"><div className="flex flex-col gap-3 xl:flex-row xl:items-center"><div className="min-w-0 flex-1"><label className="sr-only" htmlFor="admin-transport-search">{t('transportManagement.searchLabel')}</label><div className="relative"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" /><input id="admin-transport-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder={t('transportManagement.searchPlaceholder')} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50" /></div></div><div className="hidden items-center gap-2 xl:flex"><select aria-label={t('transportManagement.vehicleTypeFilter')} value={vehicleType} onChange={(event) => setVehicleType(event.target.value)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-emerald-500"><option value="">{t('transportManagement.allVehicleTypes')}</option>{filters.vehicleTypes.map((value) => <option key={value} value={value}>{getLocalizedDomainName(value, locale, 'vehicleType')}</option>)}</select><select aria-label={t('transportManagement.availabilityFilter')} value={availability} onChange={(event) => setAvailability(event.target.value as typeof availability)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-emerald-500"><option value="all">{t('transportManagement.allAvailability')}</option><option value="available">{t('transportManagement.available')}</option><option value="unavailable">{t('transportManagement.unavailable')}</option></select><select aria-label={t('transportManagement.sortLabel')} value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-emerald-500"><option value="newest">{t('transportManagement.newest')}</option><option value="oldest">{t('transportManagement.oldest')}</option></select></div><button type="button" onClick={() => setFiltersOpen((value) => !value)} aria-expanded={filtersOpen} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-bold text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/50"><SlidersHorizontal className="h-4 w-4" aria-hidden="true" />{t('transportManagement.filters')}{filterCount > 0 ? <span className="inline-flex min-w-5 justify-center rounded-full bg-emerald-700 px-1.5 py-0.5 text-[10px] text-white">{filterCount}</span> : null}</button>{filterCount > 0 ? <button type="button" onClick={clearFilters} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-bold text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" aria-hidden="true" />{t('transportManagement.clearFilters')}</button> : null}</div>
      {filtersOpen ? <div className="mt-3 grid gap-3 border-t border-slate-200/80 pt-3 sm:grid-cols-2 lg:grid-cols-4"><div><label className="mb-1.5 block text-xs font-bold text-slate-600" htmlFor="transport-district">{t('transportManagement.districtFilter')}</label><select id="transport-district" value={districtId} onChange={(event) => setDistrictId(event.target.value)} className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="">{t('transportManagement.allDistricts')}</option>{filters.districts.map((item) => <option key={item.id} value={item.id}>{getLocalizedDomainName(item.name, locale, 'district')}</option>)}</select></div><div><label className="mb-1.5 block text-xs font-bold text-slate-600" htmlFor="transport-taluka">{t('transportManagement.talukaFilter')}</label><select id="transport-taluka" value={talukaId} onChange={(event) => setTalukaId(event.target.value)} className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="">{t('transportManagement.allTalukas')}</option>{filters.talukas.map((item) => <option key={item.id} value={item.id}>{getLocalizedDomainName(item.name, locale, 'taluka')}</option>)}</select></div><div><label className="mb-1.5 block text-xs font-bold text-slate-600" htmlFor="transport-village">{t('transportManagement.villageFilter')}</label><select id="transport-village" value={villageId} onChange={(event) => setVillageId(event.target.value)} className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="">{t('transportManagement.allVillages')}</option>{filters.villages.map((item) => <option key={item.id} value={item.id}>{getLocalizedDomainName(item.name, locale, 'village')}</option>)}</select></div><div className="xl:hidden"><label className="mb-1.5 block text-xs font-bold text-slate-600" htmlFor="transport-type">{t('transportManagement.vehicleTypeFilter')}</label><select id="transport-type" value={vehicleType} onChange={(event) => setVehicleType(event.target.value)} className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="">{t('transportManagement.allVehicleTypes')}</option>{filters.vehicleTypes.map((value) => <option key={value} value={value}>{getLocalizedDomainName(value, locale, 'vehicleType')}</option>)}</select></div><div><label className="mb-1.5 block text-xs font-bold text-slate-600" htmlFor="transport-from">{t('transportManagement.dateFrom')}</label><input id="transport-from" type="date" value={createdFrom} onChange={(event) => setCreatedFrom(event.target.value)} className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" /></div><div><label className="mb-1.5 block text-xs font-bold text-slate-600" htmlFor="transport-to">{t('transportManagement.dateTo')}</label><input id="transport-to" type="date" value={createdTo} onChange={(event) => setCreatedTo(event.target.value)} className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" /></div><div className="xl:hidden"><label className="mb-1.5 block text-xs font-bold text-slate-600" htmlFor="transport-availability">{t('transportManagement.availabilityFilter')}</label><select id="transport-availability" value={availability} onChange={(event) => setAvailability(event.target.value as typeof availability)} className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="all">{t('transportManagement.allAvailability')}</option><option value="available">{t('transportManagement.available')}</option><option value="unavailable">{t('transportManagement.unavailable')}</option></select></div><div className="xl:hidden"><label className="mb-1.5 block text-xs font-bold text-slate-600" htmlFor="transport-status">{t('transportManagement.statusFilter')}</label><select id="transport-status" value={activeStatus} onChange={(event) => setActiveStatus(event.target.value as typeof activeStatus)} className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="all">{t('transportManagement.allStatuses')}</option><option value="active">{t('transportManagement.active')}</option><option value="inactive">{t('transportManagement.inactive')}</option></select></div></div> : null}
    </section>

    <section className="overflow-hidden rounded-2xl border border-[#cbd7cf] bg-[#f8faf7] shadow-[0_12px_32px_rgba(20,55,38,0.05)]"><div className="flex flex-col gap-2 border-b border-slate-200/80 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div><p className="text-sm font-bold text-slate-900">{t('transportManagement.listingCount', { count: pagination.total })}</p><p className="mt-0.5 text-xs text-slate-500">{t('transportManagement.showing', { from, to, total: pagination.total })}</p></div><button type="button" disabled={loading} onClick={() => void loadTransports(pagination.page)} className="inline-flex min-h-9 items-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 disabled:opacity-60 sm:self-auto"><RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} aria-hidden="true" />{t('transportManagement.refresh')}</button></div>
      {error ? <div role="alert" className="m-4 rounded-xl border border-red-200 bg-red-50 p-5"><div className="flex items-center justify-between gap-4"><div className="flex items-start gap-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" /><div><p className="text-sm font-bold text-red-900">{t('transportManagement.errorTitle')}</p><p className="mt-1 text-sm text-red-700">{t('transportManagement.loadError')}</p></div></div><button type="button" onClick={() => void loadTransports(pagination.page)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-200 bg-white px-3.5 text-sm font-bold text-red-700"><RefreshCw className="h-4 w-4" aria-hidden="true" />{t('transportManagement.retry')}</button></div></div> : loading ? <div className="space-y-2 p-4" aria-busy="true">{Array.from({ length: 7 }).map((_, index) => <div key={index} className="h-[70px] animate-pulse rounded-xl border border-slate-200 bg-white" />)}</div> : items.length === 0 ? <div className="px-6 py-16 text-center"><Truck className="mx-auto h-8 w-8 text-emerald-700" aria-hidden="true" /><p className="mt-4 text-sm font-bold text-slate-900">{t('transportManagement.noListings')}</p><p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{t('transportManagement.noListingsHint')}</p>{filterCount > 0 ? <button type="button" onClick={clearFilters} className="mt-4 text-sm font-bold text-emerald-700">{t('transportManagement.clearFilters')}</button> : null}</div> : <><div className="hidden overflow-x-auto lg:block"><table className="w-full min-w-[980px] text-left"><thead className="bg-[#eef3ed] text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500"><tr><th className="px-5 py-3.5">{t('transportManagement.columns.owner')}</th><th className="px-4 py-3.5">{t('transportManagement.columns.vehicle')}</th><th className="px-4 py-3.5">{t('transportManagement.columns.location')}</th><th className="px-4 py-3.5">{t('transportManagement.columns.availability')}</th><th className="px-4 py-3.5">{t('transportManagement.columns.status')}</th><th className="px-4 py-3.5">{t('transportManagement.columns.created')}</th><th className="px-5 py-3.5 text-right">{t('transportManagement.columns.actions')}</th></tr></thead><tbody className="divide-y divide-slate-200/70">{items.map((item) => <tr key={item.id} className="bg-[#fbfcfa] transition hover:bg-emerald-50/30"><td className="px-5 py-3.5"><p className="min-w-[150px] truncate text-sm font-bold text-slate-900">{item.owner?.name || item.contactName || item.businessName}</p><p className="mt-0.5 text-xs text-slate-500">{item.owner?.mobileNumber || item.phoneNumber}</p></td><td className="px-4 py-3.5"><p className="text-sm font-semibold text-slate-800">{vehicleLabel(item, t, locale)}</p>{item.isVerified ? <p className="mt-0.5 text-xs text-emerald-700">{t('transportManagement.verified')}</p> : null}</td><td className="px-4 py-3.5"><span className="flex max-w-[190px] items-start gap-1.5 text-xs text-slate-600"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" aria-hidden="true" /><span className="line-clamp-2">{transportLocation(item, locale)}</span></span></td><td className="px-4 py-3.5"><AvailabilityBadge available={item.isAvailable} t={t} /></td><td className="px-4 py-3.5"><StatusBadge active={item.isActive} t={t} /></td><td className="whitespace-nowrap px-4 py-3.5 text-xs font-medium text-slate-500">{formatDate(item.createdAt, locale)}</td><td className="px-5 py-3.5 text-right"><button type="button" onClick={() => void openDetails(item.id)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"><Eye className="h-3.5 w-3.5" aria-hidden="true" />{t('transportManagement.viewDetails')}</button></td></tr>)}</tbody></table></div><div className="grid gap-3 p-3 lg:hidden sm:p-4">{items.map((item) => <article key={item.id} className="rounded-xl border border-slate-200 bg-[#fbfcfa] p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-slate-900">{item.owner?.name || item.contactName || item.businessName}</p><p className="mt-1 text-xs text-slate-500">{vehicleLabel(item, t, locale)}</p></div><StatusBadge active={item.isActive} t={t} /></div><p className="mt-3 flex items-start gap-1.5 text-xs text-slate-500"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" aria-hidden="true" />{transportLocation(item, locale)}</p><div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3"><AvailabilityBadge available={item.isAvailable} t={t} /><button type="button" onClick={() => void openDetails(item.id)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-emerald-700 px-3 text-xs font-bold text-white"><Eye className="h-3.5 w-3.5" aria-hidden="true" />{t('transportManagement.viewDetails')}</button></div></article>)}</div><div className="flex flex-col gap-3 border-t border-slate-200/80 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5"><p className="text-xs font-medium text-slate-500">{t('transportManagement.page', { page: pagination.page, totalPages: pagination.totalPages })}</p><div className="flex gap-2"><button type="button" disabled={pagination.page <= 1} onClick={() => void loadTransports(pagination.page - 1)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 disabled:opacity-40"><ChevronLeft className="h-4 w-4" aria-hidden="true" />{t('transportManagement.previous')}</button><button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => void loadTransports(pagination.page + 1)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 disabled:opacity-40">{t('transportManagement.next')}<ChevronRight className="h-4 w-4" aria-hidden="true" /></button></div></div></>}
    </section>

    {selectedId ? <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35 backdrop-blur-[2px]" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !updatingStatus) { setSelectedId(null); setSelected(null); setPendingStatus(null); } }}><aside className="flex h-full w-full max-w-xl flex-col overflow-hidden bg-[#f7f9f5] shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="transport-details-title"><div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#123b2b] px-5 py-4 text-white"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-200">{t('transportManagement.detailsEyebrow')}</p><h2 id="transport-details-title" className="mt-0.5 truncate text-lg font-bold">{selected ? vehicleLabel(selected, t, locale) : t('transportManagement.detailsTitle')}</h2></div><button type="button" disabled={updatingStatus} onClick={() => { setSelectedId(null); setSelected(null); setPendingStatus(null); }} className="rounded-lg p-2 text-emerald-100 hover:bg-white/10 disabled:opacity-50" aria-label={t('transportManagement.closeDetails')}><X className="h-5 w-5" aria-hidden="true" /></button></div><div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">{detailsLoading ? <div className="space-y-4" aria-busy="true"><div className="h-32 animate-pulse rounded-2xl bg-white" /><div className="h-44 animate-pulse rounded-2xl bg-white" /></div> : detailsError || !selected ? <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center"><AlertCircle className="mx-auto h-6 w-6 text-red-600" aria-hidden="true" /><p className="mt-3 text-sm font-bold text-red-900">{t('transportManagement.detailsError')}</p><button type="button" onClick={() => selectedId && void openDetails(selectedId)} className="mt-3 text-sm font-bold text-red-700">{t('transportManagement.retry')}</button></div> : <div className="space-y-4"><section className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between gap-3"><div><h3 className="text-base font-bold text-slate-950">{vehicleLabel(selected, t, locale)}</h3>{selected.additionalDetails ? <p className="mt-1 text-sm leading-6 text-slate-500">{selected.additionalDetails}</p> : null}</div><StatusBadge active={selected.isActive} t={t} /></div><div className="mt-4"><AvailabilityBadge available={selected.isAvailable} t={t} /></div></section><section className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-2"><UserRound className="h-4 w-4 text-emerald-700" aria-hidden="true" /><h3 className="text-sm font-bold text-slate-900">{t('transportManagement.ownerSection')}</h3></div><p className="mt-3 text-sm font-bold text-slate-800">{selected.owner?.name || selected.contactName || selected.businessName}</p><a href={`tel:${selected.owner?.mobileNumber || selected.phoneNumber}`} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700"><Phone className="h-4 w-4" aria-hidden="true" />{selected.owner?.mobileNumber || selected.phoneNumber}</a></section><section className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-emerald-700" aria-hidden="true" /><h3 className="text-sm font-bold text-slate-900">{t('transportManagement.locationSection')}</h3></div><p className="mt-3 text-sm font-semibold text-slate-800">{transportLocation(selected, locale)}</p></section><section className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-emerald-700" aria-hidden="true" /><h3 className="text-sm font-bold text-slate-900">{t('transportManagement.recordSection')}</h3></div><dl className="mt-3 grid grid-cols-2 gap-4"><div><dt className="text-[11px] font-semibold text-slate-400">{t('transportManagement.created')}</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{formatDate(selected.createdAt, locale, true)}</dd></div><div><dt className="text-[11px] font-semibold text-slate-400">{t('transportManagement.updated')}</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{formatDate(selected.updatedAt, locale, true)}</dd></div></dl></section>{mutationMessage === 'success' ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{t('transportManagement.statusUpdateSuccess')}</p> : null}{mutationMessage === 'error' ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{t('transportManagement.statusUpdateError')}</p> : null}<section className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-bold text-slate-900">{t('transportManagement.manageSection')}</h3><p className="mt-1 text-xs text-slate-500">{t('transportManagement.manageHint')}</p></div></div><div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={selected.isActive || updatingStatus} onClick={() => setPendingStatus(true)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-emerald-200 px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">{t('transportManagement.activate')}</button><button type="button" disabled={!selected.isActive || updatingStatus} onClick={() => setPendingStatus(false)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-red-200 px-3 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50">{t('transportManagement.deactivate')}</button></div></section></div>}</div>{selected && pendingStatus !== null ? <div className="shrink-0 border-t border-slate-200 bg-white p-4"><div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-bold text-amber-950">{t('transportManagement.confirmTitle', { status: pendingStatus ? t('transportManagement.active') : t('transportManagement.inactive') })}</p><p className="mt-1 text-xs leading-5 text-amber-800">{t('transportManagement.confirmDescription')}</p><div className="mt-3 flex justify-end gap-2"><button type="button" disabled={updatingStatus} onClick={() => setPendingStatus(null)} className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600">{t('transportManagement.cancel')}</button><button type="button" disabled={updatingStatus} onClick={() => void confirmStatusChange()} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#15583b] px-3 text-xs font-bold text-white disabled:opacity-60">{updatingStatus ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}{t('transportManagement.confirmAction')}</button></div></div></div> : null}</aside></div> : null}
  </div>;
}
