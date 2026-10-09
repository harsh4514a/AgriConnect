'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
    AlertCircle,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Eye,
    FileText,
    MapPin,
    Phone,
    RefreshCw,
    Search,
    SlidersHorizontal,
    UserRound,
    X,
} from 'lucide-react';
import {
    adminGetBuyerRequirementApi,
    adminGetBuyerRequirementFiltersApi,
    adminGetBuyerRequirementsApi,
    type AdminBuyerRequirementDetails,
    type AdminBuyerRequirementListItem,
} from '@/services/admin-api/admin-buyer-requirements.api';
import { cn } from '@/utils/cn';
import { getLocalizedDomainName } from '@agri/domain-data';

const PAGE_SIZE = 20;

type AdminT = ReturnType<typeof useTranslations<'admin'>>;

function formatDate(value: string, locale: string, withTime = false) {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', ...(withTime ? { timeStyle: 'short' } : {}) }).format(new Date(value));
}

function cropLabel(item: Pick<AdminBuyerRequirementListItem, 'cropKey' | 'customCropName'>, t: AdminT, locale: string) {
    if (item.customCropName?.trim()) return item.customCropName.trim();
    const localized = getLocalizedDomainName(item.cropKey, locale, 'crop');
    return localized !== item.cropKey ? localized : t(`buyerRequirements.crops.${item.cropKey}` as never);
}

function localizedLocation(location: { village?: string | null; taluka?: string | null; district?: string | null }, locale: string) {
    return [
        getLocalizedDomainName(location.village, locale, 'village'),
        getLocalizedDomainName(location.taluka, locale, 'taluka'),
        getLocalizedDomainName(location.district, locale, 'district'),
    ].filter(Boolean).join(', ');
}

function StatusBadge({ status, t }: { status: string; t: AdminT }) {
    const tone = status === 'active' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : status === 'fulfilled' ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-100 text-slate-600';
    return <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs font-bold', tone)}>{t(`buyerRequirements.status.${status}` as never)}</span>;
}

export function AdminBuyerRequirements() {
    const t = useTranslations('admin');
    const locale = (useParams()?.locale as string) || 'en';
    const [items, setItems] = useState<AdminBuyerRequirementListItem[]>([]);
    const [pagination, setPagination] = useState({ page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 });
    const [cropKeys, setCropKeys] = useState<string[]>([]);
    const [districts, setDistricts] = useState<string[]>([]);
    const [statuses, setStatuses] = useState<string[]>([]);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [cropKey, setCropKey] = useState('');
    const [district, setDistrict] = useState('');
    const [status, setStatus] = useState('');
    const [createdFrom, setCreatedFrom] = useState('');
    const [createdTo, setCreatedTo] = useState('');
    const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selected, setSelected] = useState<AdminBuyerRequirementDetails | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState(false);

    useEffect(() => {
        const timer = window.setTimeout(() => setSearch(searchInput.trim()), 350);
        return () => window.clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        let mounted = true;
        void adminGetBuyerRequirementFiltersApi().then((response) => {
            if (!mounted) return;
            setCropKeys(response.cropKeys);
            setDistricts(response.districts);
            setStatuses(response.statuses);
        }).catch(() => undefined);
        return () => { mounted = false; };
    }, []);

    const loadRequirements = useCallback(async (page: number) => {
        setLoading(true);
        setError(false);
        try {
            const response = await adminGetBuyerRequirementsApi({
                page, pageSize: PAGE_SIZE, sort,
                ...(search ? { search } : {}),
                ...(cropKey ? { cropKey } : {}),
                ...(district ? { district } : {}),
                ...(status ? { status } : {}),
                ...(createdFrom ? { createdFrom: new Date(`${createdFrom}T00:00:00`).toISOString() } : {}),
                ...(createdTo ? { createdTo: new Date(new Date(`${createdTo}T00:00:00`).getTime() + 86400000).toISOString() } : {}),
            });
            setItems(response.items);
            setPagination(response.pagination);
        } catch {
            setItems([]);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [createdFrom, createdTo, cropKey, district, search, sort, status]);

    useEffect(() => { void loadRequirements(1); }, [loadRequirements]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') { setSelectedId(null); setSelected(null); }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    const openDetails = async (id: string) => {
        setSelectedId(id); setSelected(null); setDetailsError(false); setDetailsLoading(true);
        try { setSelected(await adminGetBuyerRequirementApi(id)); } catch { setDetailsError(true); } finally { setDetailsLoading(false); }
    };

    const clearFilters = () => {
        setSearchInput(''); setSearch(''); setCropKey(''); setDistrict(''); setStatus(''); setCreatedFrom(''); setCreatedTo(''); setSort('newest'); setFiltersOpen(false);
    };

    const filterCount = [search, cropKey, district, status, createdFrom, createdTo].filter(Boolean).length;
    const from = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
    const to = Math.min(pagination.page * pagination.pageSize, pagination.total);

    return (
        <div className="space-y-5">
            <section className="rounded-2xl border border-[#cbd7cf] bg-[#f6f8f3] p-5 shadow-[0_12px_32px_rgba(20,55,38,0.06)] sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div><p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700"><FileText className="h-3.5 w-3.5" aria-hidden="true" />{t('buyerRequirements.eyebrow')}</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">{t('buyerRequirements.title')}</h1><p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">{t('buyerRequirements.subtitle')}</p></div>
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-2.5"><p className="text-xs font-medium text-emerald-700">{t('buyerRequirements.total')}</p><p className="mt-0.5 text-lg font-bold text-emerald-950">{pagination.total.toLocaleString(locale)}</p></div>
                </div>
            </section>

            <section className="rounded-2xl border border-[#cbd7cf] bg-[#f6f8f3] p-3 shadow-[0_10px_28px_rgba(20,55,38,0.045)] sm:p-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                    <div className="min-w-0 flex-1"><label className="sr-only" htmlFor="admin-requirement-search">{t('buyerRequirements.searchLabel')}</label><div className="relative"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" /><input id="admin-requirement-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder={t('buyerRequirements.searchPlaceholder')} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50" /></div></div>
                    <div className="hidden items-center gap-2 xl:flex"><select aria-label={t('buyerRequirements.cropFilter')} value={cropKey} onChange={(event) => setCropKey(event.target.value)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500"><option value="">{t('buyerRequirements.allCrops')}</option>{cropKeys.map((key) => <option key={key} value={key}>{cropLabel({ cropKey: key, customCropName: null }, t, locale)}</option>)}</select><select aria-label={t('buyerRequirements.statusFilter')} value={status} onChange={(event) => setStatus(event.target.value)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500"><option value="">{t('buyerRequirements.allStatuses')}</option>{statuses.map((value) => <option key={value} value={value}>{t(`buyerRequirements.status.${value}` as never)}</option>)}</select><select aria-label={t('buyerRequirements.sortLabel')} value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500"><option value="newest">{t('buyerRequirements.newest')}</option><option value="oldest">{t('buyerRequirements.oldest')}</option></select></div>
                    <button type="button" onClick={() => setFiltersOpen((value) => !value)} aria-expanded={filtersOpen} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-bold text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/50"><SlidersHorizontal className="h-4 w-4" aria-hidden="true" />{t('buyerRequirements.filters')}{filterCount > 0 ? <span className="inline-flex min-w-5 justify-center rounded-full bg-emerald-700 px-1.5 py-0.5 text-[10px] text-white">{filterCount}</span> : null}</button>
                    {filterCount > 0 ? <button type="button" onClick={clearFilters} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-bold text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" aria-hidden="true" />{t('buyerRequirements.clearFilters')}</button> : null}
                </div>
                {filtersOpen ? <div className="mt-3 grid gap-3 border-t border-slate-200/80 pt-3 sm:grid-cols-2 lg:grid-cols-4"><div className="xl:hidden"><label className="mb-1.5 block text-xs font-bold text-slate-600" htmlFor="requirement-crop">{t('buyerRequirements.cropFilter')}</label><select id="requirement-crop" value={cropKey} onChange={(event) => setCropKey(event.target.value)} className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="">{t('buyerRequirements.allCrops')}</option>{cropKeys.map((key) => <option key={key} value={key}>{cropLabel({ cropKey: key, customCropName: null }, t, locale)}</option>)}</select></div><div><label className="mb-1.5 block text-xs font-bold text-slate-600" htmlFor="requirement-district">{t('buyerRequirements.districtFilter')}</label><select id="requirement-district" value={district} onChange={(event) => setDistrict(event.target.value)} className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="">{t('buyerRequirements.allDistricts')}</option>{districts.map((value) => <option key={value} value={value}>{getLocalizedDomainName(value, locale, 'district')}</option>)}</select></div><div><label className="mb-1.5 block text-xs font-bold text-slate-600" htmlFor="requirement-from">{t('buyerRequirements.dateFrom')}</label><input id="requirement-from" type="date" value={createdFrom} onChange={(event) => setCreatedFrom(event.target.value)} className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" /></div><div><label className="mb-1.5 block text-xs font-bold text-slate-600" htmlFor="requirement-to">{t('buyerRequirements.dateTo')}</label><input id="requirement-to" type="date" value={createdTo} onChange={(event) => setCreatedTo(event.target.value)} className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" /></div><div className="xl:hidden"><label className="mb-1.5 block text-xs font-bold text-slate-600" htmlFor="requirement-status">{t('buyerRequirements.statusFilter')}</label><select id="requirement-status" value={status} onChange={(event) => setStatus(event.target.value)} className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="">{t('buyerRequirements.allStatuses')}</option>{statuses.map((value) => <option key={value} value={value}>{t(`buyerRequirements.status.${value}` as never)}</option>)}</select></div></div> : null}
            </section>

            <section className="overflow-hidden rounded-2xl border border-[#cbd7cf] bg-[#f8faf7] shadow-[0_12px_32px_rgba(20,55,38,0.05)]"><div className="flex flex-col gap-2 border-b border-slate-200/80 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div><p className="text-sm font-bold text-slate-900">{t('buyerRequirements.requirementCount', { count: pagination.total })}</p><p className="mt-0.5 text-xs text-slate-500">{t('buyerRequirements.showing', { from, to, total: pagination.total })}</p></div><button type="button" disabled={loading} onClick={() => void loadRequirements(pagination.page)} className="inline-flex min-h-9 items-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 disabled:opacity-60 sm:self-auto"><RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} aria-hidden="true" />{t('buyerRequirements.refresh')}</button></div>
                {error ? <div role="alert" className="m-4 rounded-xl border border-red-200 bg-red-50 p-5"><div className="flex items-center justify-between gap-4"><div className="flex items-start gap-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" /><div><p className="text-sm font-bold text-red-900">{t('buyerRequirements.errorTitle')}</p><p className="mt-1 text-sm text-red-700">{t('buyerRequirements.loadError')}</p></div></div><button type="button" onClick={() => void loadRequirements(pagination.page)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-200 bg-white px-3.5 text-sm font-bold text-red-700"><RefreshCw className="h-4 w-4" aria-hidden="true" />{t('buyerRequirements.retry')}</button></div></div> : loading ? <div className="space-y-2 p-4" aria-busy="true">{Array.from({ length: 7 }).map((_, index) => <div key={index} className="h-[70px] animate-pulse rounded-xl border border-slate-200 bg-white" />)}</div> : items.length === 0 ? <div className="px-6 py-16 text-center"><FileText className="mx-auto h-8 w-8 text-emerald-700" aria-hidden="true" /><p className="mt-4 text-sm font-bold text-slate-900">{t('buyerRequirements.noRequirements')}</p><p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{t('buyerRequirements.noRequirementsHint')}</p>{filterCount > 0 ? <button type="button" onClick={clearFilters} className="mt-4 text-sm font-bold text-emerald-700">{t('buyerRequirements.clearFilters')}</button> : null}</div> : <><div className="hidden overflow-x-auto lg:block"><table className="w-full min-w-[900px] text-left"><thead className="bg-[#eef3ed] text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500"><tr><th className="px-5 py-3.5">{t('buyerRequirements.columns.crop')}</th><th className="px-4 py-3.5">{t('buyerRequirements.columns.buyer')}</th><th className="px-4 py-3.5">{t('buyerRequirements.columns.quantity')}</th><th className="px-4 py-3.5">{t('buyerRequirements.columns.location')}</th><th className="px-4 py-3.5">{t('buyerRequirements.columns.status')}</th><th className="px-4 py-3.5">{t('buyerRequirements.columns.posted')}</th><th className="px-5 py-3.5 text-right">{t('buyerRequirements.columns.actions')}</th></tr></thead><tbody className="divide-y divide-slate-200/70">{items.map((item) => <tr key={item.id} className="bg-[#fbfcfa] transition hover:bg-emerald-50/30"><td className="px-5 py-3.5"><p className="text-sm font-bold text-slate-900">{cropLabel(item, t, locale)}</p>{item.variety ? <p className="mt-0.5 text-xs text-slate-500">{getLocalizedDomainName(item.variety, locale, 'variety')}</p> : null}</td><td className="px-4 py-3.5"><p className="min-w-[150px] truncate text-sm font-semibold text-slate-800">{item.buyer.name || t('buyerRequirements.noName')}</p><p className="mt-0.5 text-xs text-slate-500">{item.buyer.mobileNumber}</p></td><td className="whitespace-nowrap px-4 py-3.5 text-sm font-semibold text-slate-700">{item.quantity.toLocaleString(locale)} {getLocalizedDomainName(item.unit, locale, 'unit')}</td><td className="px-4 py-3.5"><span className="flex max-w-[190px] items-start gap-1.5 text-xs text-slate-600"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" aria-hidden="true" /><span className="line-clamp-2">{localizedLocation(item, locale)}</span></span></td><td className="px-4 py-3.5"><StatusBadge status={item.status} t={t} /></td><td className="whitespace-nowrap px-4 py-3.5 text-xs font-medium text-slate-500">{formatDate(item.createdAt, locale)}</td><td className="px-5 py-3.5 text-right"><button type="button" onClick={() => void openDetails(item.id)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"><Eye className="h-3.5 w-3.5" aria-hidden="true" />{t('buyerRequirements.viewDetails')}</button></td></tr>)}</tbody></table></div><div className="grid gap-3 p-3 lg:hidden sm:p-4">{items.map((item) => <article key={item.id} className="rounded-xl border border-slate-200 bg-[#fbfcfa] p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-slate-900">{cropLabel(item, t, locale)}</p>{item.variety ? <p className="mt-0.5 text-xs text-slate-500">{getLocalizedDomainName(item.variety, locale, 'variety')}</p> : null}</div><StatusBadge status={item.status} t={t} /></div><p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-700"><UserRound className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />{item.buyer.name || t('buyerRequirements.noName')}</p><p className="mt-1 flex items-start gap-1.5 text-xs text-slate-500"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" aria-hidden="true" />{localizedLocation(item, locale)}</p><div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3"><span className="text-xs font-bold text-slate-700">{item.quantity.toLocaleString(locale)} {getLocalizedDomainName(item.unit, locale, 'unit')}</span><button type="button" onClick={() => void openDetails(item.id)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-emerald-700 px-3 text-xs font-bold text-white"><Eye className="h-3.5 w-3.5" aria-hidden="true" />{t('buyerRequirements.viewDetails')}</button></div></article>)}</div><div className="flex flex-col gap-3 border-t border-slate-200/80 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5"><p className="text-xs font-medium text-slate-500">{t('buyerRequirements.page', { page: pagination.page, totalPages: pagination.totalPages })}</p><div className="flex gap-2"><button type="button" disabled={pagination.page <= 1} onClick={() => void loadRequirements(pagination.page - 1)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 disabled:opacity-40"><ChevronLeft className="h-4 w-4" aria-hidden="true" />{t('buyerRequirements.previous')}</button><button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => void loadRequirements(pagination.page + 1)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 disabled:opacity-40">{t('buyerRequirements.next')}<ChevronRight className="h-4 w-4" aria-hidden="true" /></button></div></div></>}
            </section>

            {selectedId ? <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35 backdrop-blur-[2px]" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setSelectedId(null); setSelected(null); } }}><aside className="flex h-full w-full max-w-xl flex-col overflow-hidden bg-[#f7f9f5] shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="requirement-details-title"><div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#123b2b] px-5 py-4 text-white"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-200">{t('buyerRequirements.detailsEyebrow')}</p><h2 id="requirement-details-title" className="mt-0.5 truncate text-lg font-bold">{selected ? cropLabel(selected, t, locale) : t('buyerRequirements.detailsTitle')}</h2></div><button type="button" onClick={() => { setSelectedId(null); setSelected(null); }} className="rounded-lg p-2 text-emerald-100 hover:bg-white/10" aria-label={t('buyerRequirements.closeDetails')}><X className="h-5 w-5" aria-hidden="true" /></button></div><div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">{detailsLoading ? <div className="space-y-4" aria-busy="true"><div className="h-32 animate-pulse rounded-2xl bg-white" /><div className="h-44 animate-pulse rounded-2xl bg-white" /></div> : detailsError || !selected ? <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center"><AlertCircle className="mx-auto h-6 w-6 text-red-600" aria-hidden="true" /><p className="mt-3 text-sm font-bold text-red-900">{t('buyerRequirements.detailsError')}</p><button type="button" onClick={() => selectedId && void openDetails(selectedId)} className="mt-3 text-sm font-bold text-red-700">{t('buyerRequirements.retry')}</button></div> : <div className="space-y-4"><section className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between gap-3"><div><h3 className="text-base font-bold text-slate-950">{cropLabel(selected, t, locale)}</h3>{selected.variety ? <p className="mt-1 text-sm text-slate-500">{getLocalizedDomainName(selected.variety, locale, 'variety')}</p> : null}</div><StatusBadge status={selected.status} t={t} /></div><dl className="mt-4 grid grid-cols-2 gap-4"><div><dt className="text-[11px] font-semibold text-slate-400">{t('buyerRequirements.quantity')}</dt><dd className="mt-1 text-sm font-bold text-slate-800">{selected.quantity.toLocaleString(locale)} {getLocalizedDomainName(selected.unit, locale, 'unit')}</dd></div><div><dt className="text-[11px] font-semibold text-slate-400">{t('buyerRequirements.posted')}</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{formatDate(selected.createdAt, locale)}</dd></div></dl></section><section className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-2"><UserRound className="h-4 w-4 text-emerald-700" aria-hidden="true" /><h3 className="text-sm font-bold text-slate-900">{t('buyerRequirements.buyerSection')}</h3></div><p className="mt-3 text-sm font-bold text-slate-800">{selected.buyer.name || t('buyerRequirements.noName')}</p><a href={`tel:${selected.contactNumber}`} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700"><Phone className="h-4 w-4" aria-hidden="true" />{selected.contactNumber}</a></section><section className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-emerald-700" aria-hidden="true" /><h3 className="text-sm font-bold text-slate-900">{t('buyerRequirements.locationSection')}</h3></div><p className="mt-3 text-sm font-semibold text-slate-800">{localizedLocation(selected, locale)}</p></section>{selected.additionalRequirements ? <section className="rounded-2xl border border-slate-200 bg-white p-4"><h3 className="text-sm font-bold text-slate-900">{t('buyerRequirements.additionalSection')}</h3><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{selected.additionalRequirements}</p></section> : null}<section className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-emerald-700" aria-hidden="true" /><h3 className="text-sm font-bold text-slate-900">{t('buyerRequirements.timelineSection')}</h3></div><dl className="mt-3 grid grid-cols-2 gap-4"><div><dt className="text-[11px] font-semibold text-slate-400">{t('buyerRequirements.created')}</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{formatDate(selected.createdAt, locale, true)}</dd></div><div><dt className="text-[11px] font-semibold text-slate-400">{t('buyerRequirements.updated')}</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{formatDate(selected.updatedAt, locale, true)}</dd></div></dl></section></div>}</div></aside></div> : null}
        </div>
    );
}
