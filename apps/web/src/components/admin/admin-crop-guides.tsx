'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
    AlertCircle,
    BookOpen,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Eye,
    FileText,
    Loader2,
    Pencil,
    Plus,
    RefreshCw,
    Search,
    SlidersHorizontal,
    X,
    XCircle,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import {
    adminCreateCropGuideApi,
    adminGetCropGuideApi,
    adminGetCropGuideFiltersApi,
    adminGetCropGuidesApi,
    adminUpdateCropGuideApi,
    adminUpdateCropGuideStatusApi,
    type AdminCropGuideContent,
    type AdminCropGuideDetails,
    type AdminCropGuideLocale,
    type AdminCropGuideListItem,
} from '@/services/admin-api/admin-crop-guides.api';

const PAGE_SIZE = 20;
const LOCALES: AdminCropGuideLocale[] = ['en', 'gu', 'hi'];
const SECTION_KEYS = ['overview', 'climate', 'soil', 'season', 'landPreparation', 'seedPlanting', 'sowingMethod', 'irrigation', 'nutrientManagement', 'weedManagement', 'pestDisease', 'harvesting', 'postHarvest', 'expectedYield', 'tips'];

type EditorState = {
    id?: string;
    slug: string;
    image: string;
    imageAlt: string;
    category: string;
    seasonKeys: string[];
    sortOrder: number;
    isPublished: boolean;
    sourceName: string;
    sourceUrl: string;
    contents: Record<AdminCropGuideLocale, AdminCropGuideContent>;
};

function emptyContent(locale: AdminCropGuideLocale): AdminCropGuideContent {
    return { locale, name: '', aliases: [], shortDescription: '', suitableSeason: '', sections: {} };
}

function toEditor(guide?: AdminCropGuideDetails): EditorState {
    const contents = Object.fromEntries(LOCALES.map((locale) => [locale, guide?.contents.find((content) => content.locale === locale) ?? emptyContent(locale)])) as Record<AdminCropGuideLocale, AdminCropGuideContent>;
    return { id: guide?.id, slug: guide?.slug ?? '', image: guide?.image ?? '', imageAlt: guide?.imageAlt ?? '', category: guide?.category ?? '', seasonKeys: guide?.seasonKeys ?? [], sortOrder: guide?.sortOrder ?? 0, isPublished: guide?.isPublished ?? false, sourceName: guide?.sourceName ?? '', sourceUrl: guide?.sourceUrl ?? '', contents };
}

function formatDate(value: string, locale: string) { return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value)); }

export function AdminCropGuides({ initialEditor }: { initialEditor?: 'create' | string } = {}) {
    const locale = (useParams()?.locale as string) || 'en';
    const router = useRouter();
    const t = useTranslations(locale === 'hi' ? 'api.cropGuide.admin' : 'cropGuide.admin');
    const cropT = useTranslations('cropGuide');
    const [items, setItems] = useState<AdminCropGuideListItem[]>([]);
    const [pagination, setPagination] = useState({ page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 });
    const [categories, setCategories] = useState<string[]>([]);
    const [seasons, setSeasons] = useState<string[]>([]);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [season, setSeason] = useState('');
    const [status, setStatus] = useState<'all' | 'published' | 'unpublished'>('all');
    const [sort, setSort] = useState<'newest' | 'oldest' | 'name'>('newest');
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [editor, setEditor] = useState<EditorState | null>(null);
    const [editorLoading, setEditorLoading] = useState(false);
    const [editorLocale, setEditorLocale] = useState<AdminCropGuideLocale>('en');
    const [activeGroup, setActiveGroup] = useState('overview');
    const [preview, setPreview] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<'created' | 'updated' | 'error' | null>(null);
    const [pendingStatus, setPendingStatus] = useState<{ id: string; next: boolean } | null>(null);
    const [statusLoading, setStatusLoading] = useState(false);

    useEffect(() => { const timer = window.setTimeout(() => setSearch(searchInput.trim()), 350); return () => window.clearTimeout(timer); }, [searchInput]);

    useEffect(() => { let mounted = true; void adminGetCropGuideFiltersApi().then((data) => { if (mounted) { setCategories(data.categories); setSeasons(data.seasons); } }).catch(() => undefined); return () => { mounted = false; }; }, []);

    const loadGuides = useCallback(async (page: number) => {
        setLoading(true); setError(false);
        try {
            const response = await adminGetCropGuidesApi({ page, pageSize: PAGE_SIZE, search: search || undefined, category: category || undefined, season: season || undefined, sort, ...(status !== 'all' ? { isPublished: status === 'published' } : {}) });
            setItems(response.items); setPagination(response.pagination);
        } catch { setItems([]); setError(true); } finally { setLoading(false); }
    }, [category, search, season, sort, status]);

    useEffect(() => { void loadGuides(1); }, [loadGuides]);

    const openEditor = useCallback(async (id?: string, fromRoute = false) => {
        if (id && !fromRoute) {
            router.push(`/${locale}/admin/crop-guide/${id}/edit`);
            return;
        }
        setSaveMessage(null); setPreview(false); setEditorLocale('en'); setActiveGroup('overview');
        if (!id) { setEditor(toEditor()); return; }
        setEditorLoading(true);
        try { setEditor(toEditor(await adminGetCropGuideApi(id))); } catch { setSaveMessage('error'); } finally { setEditorLoading(false); }
    }, [locale, router]);

    useEffect(() => {
        if (!initialEditor || editor || editorLoading) return;
        void openEditor(initialEditor === 'create' ? undefined : initialEditor, true);
    }, [editor, editorLoading, initialEditor, openEditor]);

    const updateEditor = (patch: Partial<EditorState>) => setEditor((current) => current ? { ...current, ...patch } : current);
    const currentContent = editor?.contents[editorLocale];
    const updateContent = (patch: Partial<AdminCropGuideContent>) => setEditor((current) => current ? { ...current, contents: { ...current.contents, [editorLocale]: { ...current.contents[editorLocale], ...patch } } } : current);
    const updateSection = (key: string, value: string) => updateContent({ sections: { ...(currentContent?.sections ?? {}), [key]: value.split('\n') } });

    const save = async () => {
        if (!editor || !editor.slug.trim() || !editor.category.trim() || !editor.sourceName.trim() || !editor.sourceUrl.trim()) { setSaveMessage('error'); return; }
        const contents = Object.values(editor.contents).filter((content) => content.name.trim() && content.shortDescription.trim());
        if (contents.length === 0) { setSaveMessage('error'); return; }
        setSaving(true); setSaveMessage(null);
        const payload = { slug: editor.slug.trim(), image: editor.image.trim(), imageAlt: editor.imageAlt.trim(), category: editor.category.trim(), seasonKeys: editor.seasonKeys, sortOrder: editor.sortOrder, isPublished: editor.isPublished, sourceName: editor.sourceName.trim(), sourceUrl: editor.sourceUrl.trim(), contents: contents.map((content) => ({ ...content, name: content.name.trim(), shortDescription: content.shortDescription.trim(), aliases: content.aliases.filter(Boolean) })) };
        try { const wasEditing = Boolean(editor.id); const saved = editor.id ? await adminUpdateCropGuideApi(editor.id, payload) : await adminCreateCropGuideApi(payload); setEditor(toEditor(saved)); setSaveMessage(wasEditing ? 'updated' : 'created'); if (!wasEditing) router.replace(`/${locale}/admin/crop-guide/${saved.id}/edit`); await loadGuides(pagination.page); } catch { setSaveMessage('error'); } finally { setSaving(false); }
    };

    const updateStatus = async () => {
        if (!pendingStatus) return;
        setStatusLoading(true);
        try { await adminUpdateCropGuideStatusApi(pendingStatus.id, pendingStatus.next); setItems((current) => current.map((item) => item.id === pendingStatus.id ? { ...item, isPublished: pendingStatus.next } : item)); setPendingStatus(null); } finally { setStatusLoading(false); }
    };

    const clearFilters = () => { setSearchInput(''); setSearch(''); setCategory(''); setSeason(''); setStatus('all'); setSort('newest'); setFiltersOpen(false); };
    const filterCount = [search, category, season, status !== 'all' ? status : ''].filter(Boolean).length;
    const from = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
    const to = Math.min(pagination.page * pagination.pageSize, pagination.total);

    if (editor || editorLoading) return <EditorView editor={editor} loading={editorLoading} locale={locale} t={t} editorLocale={editorLocale} setEditorLocale={setEditorLocale} currentContent={currentContent} updateEditor={updateEditor} updateContent={updateContent} updateSection={updateSection} activeGroup={activeGroup} setActiveGroup={setActiveGroup} preview={preview} setPreview={setPreview} saving={saving} saveMessage={saveMessage} save={save} close={() => router.push(`/${locale}/admin/crop-guide`)} />;

    return <div className="space-y-5">
        <section className="rounded-2xl border border-[#cbd7cf] bg-[#f6f8f3] p-5 shadow-[0_12px_32px_rgba(20,55,38,0.06)] sm:p-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700"><BookOpen className="h-3.5 w-3.5" aria-hidden="true" />{t('eyebrow')}</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">{t('title')}</h1><p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">{t('subtitle')}</p></div><button type="button" onClick={() => router.push(`/${locale}/admin/crop-guide/create`)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#15583b] px-4 text-sm font-bold text-white hover:bg-[#104a31]"><Plus className="h-4 w-4" aria-hidden="true" />{t('create')}</button></div></section>
        <section className="rounded-2xl border border-[#cbd7cf] bg-[#f6f8f3] p-3 shadow-[0_10px_28px_rgba(20,55,38,0.045)] sm:p-4"><div className="flex flex-col gap-3 xl:flex-row xl:items-center"><div className="min-w-0 flex-1"><label className="sr-only" htmlFor="admin-crop-search">{t('searchLabel')}</label><div className="relative"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" /><input id="admin-crop-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder={t('searchPlaceholder')} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50" /></div></div><div className="hidden items-center gap-2 xl:flex"><select aria-label={t('category')} value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="">{t('allCategories')}</option>{categories.map((value) => <option key={value} value={value}>{value}</option>)}</select><select aria-label={t('status')} value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="all">{t('allStatuses')}</option><option value="published">{t('published')}</option><option value="unpublished">{t('unpublished')}</option></select><select aria-label={t('sort')} value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="newest">{t('newest')}</option><option value="oldest">{t('oldest')}</option><option value="name">{t('nameSort')}</option></select></div><button type="button" onClick={() => setFiltersOpen((value) => !value)} aria-expanded={filtersOpen} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-bold text-slate-700"><SlidersHorizontal className="h-4 w-4" aria-hidden="true" />{t('filters')}{filterCount > 0 ? <span className="rounded-full bg-emerald-700 px-1.5 py-0.5 text-[10px] text-white">{filterCount}</span> : null}</button>{filterCount > 0 ? <button type="button" onClick={clearFilters} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-slate-500"><X className="h-4 w-4" aria-hidden="true" />{t('clearFilters')}</button> : null}</div>{filtersOpen ? <div className="mt-3 grid gap-3 border-t border-slate-200/80 pt-3 sm:grid-cols-2"><div><label className="mb-1.5 block text-xs font-bold text-slate-600" htmlFor="crop-category">{t('category')}</label><select id="crop-category" value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="">{t('allCategories')}</option>{categories.map((value) => <option key={value} value={value}>{value}</option>)}</select></div><div><label className="mb-1.5 block text-xs font-bold text-slate-600" htmlFor="crop-season">{t('season')}</label><select id="crop-season" value={season} onChange={(event) => setSeason(event.target.value)} className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="">{t('allSeasons')}</option>{seasons.map((value) => <option key={value} value={value}>{value}</option>)}</select></div></div> : null}</section>
        <section className="overflow-hidden rounded-2xl border border-[#cbd7cf] bg-[#f8faf7] shadow-[0_12px_32px_rgba(20,55,38,0.05)]"><div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3.5 sm:px-5"><div><p className="text-sm font-bold text-slate-900">{t('count', { count: pagination.total })}</p><p className="mt-0.5 text-xs text-slate-500">{t('showing', { from, to, total: pagination.total })}</p></div><button type="button" disabled={loading} onClick={() => void loadGuides(pagination.page)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600"><RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} aria-hidden="true" />{t('refresh')}</button></div>{error ? <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-5"><p className="text-sm font-bold text-red-900">{t('errorTitle')}</p><button type="button" onClick={() => void loadGuides(pagination.page)} className="mt-3 text-sm font-bold text-red-700">{t('retry')}</button></div> : loading ? <div className="space-y-2 p-4" aria-busy="true">{Array.from({ length: 7 }).map((_, index) => <div key={index} className="h-16 animate-pulse rounded-xl bg-white" />)}</div> : items.length === 0 ? <div className="px-6 py-16 text-center"><BookOpen className="mx-auto h-8 w-8 text-emerald-700" aria-hidden="true" /><p className="mt-4 text-sm font-bold text-slate-900">{t('noGuides')}</p><p className="mt-1 text-sm text-slate-500">{t('noGuidesHint')}</p></div> : <><div className="hidden overflow-x-auto lg:block"><table className="w-full min-w-[900px] text-left"><thead className="bg-[#eef3ed] text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500"><tr><th className="px-5 py-3.5">{t('columns.crop')}</th><th className="px-4 py-3.5">{t('columns.category')}</th><th className="px-4 py-3.5">{t('columns.languages')}</th><th className="px-4 py-3.5">{t('columns.status')}</th><th className="px-4 py-3.5">{t('columns.updated')}</th><th className="px-5 py-3.5 text-right">{t('columns.actions')}</th></tr></thead><tbody className="divide-y divide-slate-200/70">{items.map((item) => <GuideRow key={item.id} item={item} locale={locale} t={t} cropT={cropT} onEdit={() => void openEditor(item.id)} onStatus={() => setPendingStatus({ id: item.id, next: !item.isPublished })} />)}</tbody></table></div><div className="grid gap-3 p-3 lg:hidden">{items.map((item) => <GuideCard key={item.id} item={item} locale={locale} t={t} cropT={cropT} onEdit={() => void openEditor(item.id)} onStatus={() => setPendingStatus({ id: item.id, next: !item.isPublished })} />)}</div><div className="flex items-center justify-between border-t border-slate-200/80 px-4 py-3.5 sm:px-5"><p className="text-xs text-slate-500">{t('page', { page: pagination.page, totalPages: pagination.totalPages })}</p><div className="flex gap-2"><button type="button" disabled={pagination.page <= 1} onClick={() => void loadGuides(pagination.page - 1)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold disabled:opacity-40"><ChevronLeft className="h-4 w-4" />{t('previous')}</button><button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => void loadGuides(pagination.page + 1)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold disabled:opacity-40">{t('next')}<ChevronRight className="h-4 w-4" /></button></div></div></>}</section>
        {pendingStatus ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4" role="presentation"><div className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-5 shadow-2xl" role="dialog" aria-modal="true"><h2 className="text-lg font-bold text-slate-950">{t('confirmStatusTitle', { action: pendingStatus.next ? t('publish') : t('unpublish') })}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{t('confirmStatusDescription')}</p><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setPendingStatus(null)} className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm font-bold">{t('cancel')}</button><button type="button" disabled={statusLoading} onClick={() => void updateStatus()} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-700 px-3 text-sm font-bold text-white disabled:opacity-60">{statusLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{t('confirm')}</button></div></div></div> : null}
    </div>;
}

function GuideRow({ item, locale, t, cropT, onEdit, onStatus }: { item: AdminCropGuideListItem; locale: string; t: ReturnType<typeof useTranslations<'cropGuide.admin'>>; cropT: ReturnType<typeof useTranslations<'cropGuide'>>; onEdit: () => void; onStatus: () => void }) {
    const localizedName = item.contents.find((content) => content.locale === locale)?.name || item.contents[0]?.name || item.slug;
    const categoryKey = `categories.${item.category}`;
    const localizedCategory = cropT.has(categoryKey) ? cropT(categoryKey) : item.category;
    return <tr className="bg-[#fbfcfa] transition hover:bg-emerald-50/30"><td className="px-5 py-3.5"><p className="text-sm font-bold text-slate-900">{localizedName}</p><p className="mt-0.5 text-xs text-slate-500">{item.slug}</p></td><td className="px-4 py-3.5 text-sm text-slate-700">{localizedCategory}</td><td className="px-4 py-3.5"><Completeness locales={item.availableLocales} t={t} /></td><td className="px-4 py-3.5"><Status active={item.isPublished} t={t} /></td><td className="px-4 py-3.5 text-xs text-slate-500">{formatDate(item.updatedAt, locale)}</td><td className="px-5 py-3.5 text-right"><div className="inline-flex gap-2"><button type="button" onClick={onEdit} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold"><Pencil className="h-3.5 w-3.5" />{t('edit')}</button><button type="button" onClick={onStatus} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label={item.isPublished ? t('unpublish') : t('publish')}>{item.isPublished ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}</button></div></td></tr>;
}

function GuideCard({ item, locale, t, cropT, onEdit, onStatus }: { item: AdminCropGuideListItem; locale: string; t: ReturnType<typeof useTranslations<'cropGuide.admin'>>; cropT: ReturnType<typeof useTranslations<'cropGuide'>>; onEdit: () => void; onStatus: () => void }) { const localizedName = item.contents.find((content) => content.locale === locale)?.name || item.contents[0]?.name || item.slug; const categoryKey = `categories.${item.category}`; const localizedCategory = cropT.has(categoryKey) ? cropT(categoryKey) : item.category; return <article className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-slate-900">{localizedName}</p><p className="mt-1 text-xs text-slate-500">{localizedCategory} · {item.slug}</p></div><Status active={item.isPublished} t={t} /></div><div className="mt-3"><Completeness locales={item.availableLocales} t={t} /></div><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={onEdit} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-emerald-700 px-3 text-xs font-bold text-white"><Pencil className="h-3.5 w-3.5" />{t('edit')}</button><button type="button" onClick={onStatus} className="rounded-lg border border-slate-200 p-2" aria-label={item.isPublished ? t('unpublish') : t('publish')}>{item.isPublished ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}</button></div></article>; }

function Status({ active, t }: { active: boolean; t: ReturnType<typeof useTranslations<'cropGuide.admin'>> }) { return <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold', active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-600')}><span className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-emerald-600' : 'bg-slate-400')} />{active ? t('published') : t('unpublished')}</span>; }
function Completeness({ locales, t }: { locales: AdminCropGuideLocale[]; t: ReturnType<typeof useTranslations<'cropGuide.admin'>> }) { return <div className="flex flex-wrap gap-1.5">{LOCALES.map((locale) => <span key={locale} className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold', locales.includes(locale) ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}><span>{t(`locales.${locale}`)}</span>{locales.includes(locale) ? '✓' : '!'}</span>)}</div>; }

function EditorView({ editor, loading, locale, t, editorLocale, setEditorLocale, currentContent, updateEditor, updateContent, updateSection, activeGroup, setActiveGroup, preview, setPreview, saving, saveMessage, save, close }: { editor: EditorState | null; loading: boolean; locale: string; t: ReturnType<typeof useTranslations<'cropGuide.admin'>>; editorLocale: AdminCropGuideLocale; setEditorLocale: (locale: AdminCropGuideLocale) => void; currentContent?: AdminCropGuideContent; updateEditor: (patch: Partial<EditorState>) => void; updateContent: (patch: Partial<AdminCropGuideContent>) => void; updateSection: (key: string, value: string) => void; activeGroup: string; setActiveGroup: (key: string) => void; preview: boolean; setPreview: (value: boolean) => void; saving: boolean; saveMessage: 'created' | 'updated' | 'error' | null; save: () => Promise<void>; close: () => void }) {
    if (loading || !editor) return <div className="space-y-4" aria-busy="true"><div className="h-12 animate-pulse rounded-xl bg-slate-200" /><div className="h-96 animate-pulse rounded-2xl bg-slate-200" /></div>;
    const setText = (key: keyof AdminCropGuideContent, value: string) => updateContent({ [key]: value } as Partial<AdminCropGuideContent>);
    return <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><button type="button" onClick={close} className="text-sm font-bold text-emerald-700">← {t('back')}</button><div className="flex gap-2"><button type="button" onClick={() => setPreview(!preview)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold"><Eye className="h-4 w-4" />{t('preview')}</button><button type="button" disabled={saving} onClick={() => void save()} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{saving ? t('saving') : t('save')}</button></div></div>{saveMessage ? <div role={saveMessage === 'error' ? 'alert' : 'status'} className={cn('rounded-xl border px-4 py-3 text-sm font-semibold', saveMessage === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800')}>{saveMessage === 'error' ? t('saveError') : saveMessage === 'created' ? t('created') : t('updated')}</div> : null}<div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]"><main className="space-y-5"><section className="rounded-2xl border border-[#cbd7cf] bg-[#f6f8f3] p-5"><h1 className="text-2xl font-bold text-slate-950">{editor.id ? t('edit') : t('create')}</h1><p className="mt-1 text-sm text-slate-500">{t('basic')}</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label={t('slug')} value={editor.slug} onChange={(value) => updateEditor({ slug: value })} required /><Field label={t('categoryLabel')} value={editor.category} onChange={(value) => updateEditor({ category: value })} required /><Field label={t('image')} value={editor.image} onChange={(value) => updateEditor({ image: value })} /><Field label={t('imageAlt')} value={editor.imageAlt} onChange={(value) => updateEditor({ imageAlt: value })} /><Field label={t('sourceName')} value={editor.sourceName} onChange={(value) => updateEditor({ sourceName: value })} required /><Field label={t('sourceUrl')} value={editor.sourceUrl} onChange={(value) => updateEditor({ sourceUrl: value })} required /></div><label className="mt-4 block text-xs font-bold text-slate-600">{t('seasons')}<input value={editor.seasonKeys.join(', ')} onChange={(event) => updateEditor({ seasonKeys: event.target.value.split(',').map((value) => value.trim()).filter(Boolean) })} className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" /></label></section><section className="rounded-2xl border border-[#cbd7cf] bg-[#f6f8f3] p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-slate-950">{t('localization')}</h2><p className="mt-1 text-sm text-slate-500">{t('completeness')}</p></div><div className="flex gap-1 rounded-lg bg-slate-200/70 p-1">{LOCALES.map((value) => <button type="button" key={value} onClick={() => setEditorLocale(value)} className={cn('rounded-md px-3 py-2 text-xs font-bold', editorLocale === value ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500')}>{t(`locales.${value}`)}</button>)}</div></div><div className="mt-5 grid gap-4"><Field label={t('name')} value={currentContent?.name ?? ''} onChange={(value) => setText('name', value)} required /><Field label={t('aliases')} value={currentContent?.aliases.join(', ') ?? ''} onChange={(value) => setText('aliases', value)} /><Field label={t('shortDescription')} value={currentContent?.shortDescription ?? ''} onChange={(value) => setText('shortDescription', value)} textarea /><Field label={t('suitableSeason')} value={currentContent?.suitableSeason ?? ''} onChange={(value) => setText('suitableSeason', value)} /></div><div className="mt-6"><h3 className="text-sm font-bold text-slate-900">{t('sectionLabel')}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{t('sectionHint')}</p><div className="mt-4 space-y-2">{SECTION_KEYS.map((key) => <div key={key} className="rounded-xl border border-slate-200 bg-white"><button type="button" onClick={() => setActiveGroup(activeGroup === key ? '' : key)} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-bold text-slate-800">{t(`sectionKeys.${key}`)}<span>{activeGroup === key ? '−' : '+'}</span></button>{activeGroup === key ? <textarea value={(currentContent?.sections[key] ?? []).join('\n')} onChange={(event) => updateSection(key, event.target.value)} rows={5} className="w-full resize-y border-t border-slate-200 px-4 py-3 text-sm leading-6 outline-none focus:ring-2 focus:ring-emerald-100" /> : null}</div>)}</div></div></section></main><aside className="space-y-4 xl:sticky xl:top-5 xl:self-start">{preview ? <section className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">{t('previewTitle')}</p><h2 className="mt-2 text-xl font-bold text-slate-950">{currentContent?.name || t('previewEmpty')}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{currentContent?.shortDescription}</p>{Object.entries(currentContent?.sections ?? {}).filter(([, points]) => points.some(Boolean)).slice(0, 5).map(([key, points]) => <div key={key} className="mt-5 border-t border-slate-100 pt-4"><h3 className="text-sm font-bold text-slate-800">{t(`sectionKeys.${key}`)}</h3><ul className="mt-2 space-y-1 text-sm leading-6 text-slate-600">{points.filter(Boolean).map((point) => <li key={point}>• {point}</li>)}</ul></div>)}</section> : <section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2 text-sm font-bold text-slate-900"><FileText className="h-4 w-4 text-emerald-700" />{t('details')}</div><p className="mt-3 text-sm leading-6 text-slate-500">{t('sectionHint')}</p></section>}</aside></div></div>;
}

function Field({ label, value, onChange, textarea = false, required = false }: { label: string; value: string; onChange: (value: string) => void; textarea?: boolean; required?: boolean }) { const input = textarea ? <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} className="mt-1.5 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50" /> : <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50" />; return <label className="block text-xs font-bold text-slate-600">{label}{required ? <span className="ml-1 text-red-500">*</span> : null}{input}</label>; }
