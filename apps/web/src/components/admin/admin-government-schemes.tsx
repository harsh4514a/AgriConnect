'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
    AlertCircle,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    Eye,
    Landmark,
    Loader2,
    Pencil,
    Plus,
    RefreshCw,
    Search,
    SlidersHorizontal,
    Trash2,
    X,
    XCircle,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import {
    adminCreateGovernmentSchemeApi,
    adminDeleteGovernmentSchemeApi,
    adminGetGovernmentSchemeApi,
    adminGetGovernmentSchemeFiltersApi,
    adminGetGovernmentSchemesApi,
    adminUpdateGovernmentSchemeApi,
    adminUpdateGovernmentSchemeStatusApi,
    type AdminGovernmentSchemeContent,
    type AdminGovernmentSchemeDetails,
    type AdminGovernmentSchemeListItem,
    type AdminGovernmentSchemeLocale,
    type AdminGovernmentSchemePayload,
} from '@/services/admin-api/admin-government-schemes.api';

const PAGE_SIZE = 20;
const LOCALES: AdminGovernmentSchemeLocale[] = ['en', 'gu', 'hi'];
const CONTENT_FIELDS = ['benefits', 'eligibility', 'documents', 'applicationSteps', 'conditions'] as const;

type ContentField = (typeof CONTENT_FIELDS)[number];
type EditorSection = 'basic' | 'availability' | 'source' | 'content';
type SaveMsg = 'created' | 'updated' | 'error' | null;

type EditorState = {
    id?: string;
    slug: string;
    governmentLevel: 'central' | 'state';
    department: string;
    category: string;
    status: 'active' | 'closed' | 'upcoming';
    availableStates: string;
    applicationUrl: string;
    sourceUrl: string;
    lastVerifiedAt: string;
    isPublished: boolean;
    sortOrder: number;
    contents: Record<AdminGovernmentSchemeLocale, AdminGovernmentSchemeContent>;
};

function emptyContent(locale: AdminGovernmentSchemeLocale): AdminGovernmentSchemeContent {
    return { locale, name: '', shortDescription: '', description: '', benefits: [], eligibility: [], documents: [], applicationSteps: [], conditions: [], keywords: [] };
}

function toEditor(scheme?: AdminGovernmentSchemeDetails): EditorState {
    const contents = Object.fromEntries(
        LOCALES.map((locale) => [locale, scheme?.contents.find((c) => c.locale === locale) ?? emptyContent(locale)])
    ) as Record<AdminGovernmentSchemeLocale, AdminGovernmentSchemeContent>;
    return {
        id: scheme?.id,
        slug: scheme?.slug ?? '',
        governmentLevel: (scheme?.governmentLevel as 'central' | 'state') ?? 'central',
        department: scheme?.department ?? '',
        category: scheme?.category ?? '',
        status: (scheme?.status as 'active' | 'closed' | 'upcoming') ?? 'active',
        availableStates: scheme?.availableStates?.join(', ') ?? 'Gujarat',
        applicationUrl: scheme?.applicationUrl ?? '',
        sourceUrl: scheme?.sourceUrl ?? '',
        lastVerifiedAt: scheme?.lastVerifiedAt ? scheme.lastVerifiedAt.slice(0, 10) : '',
        isPublished: scheme?.isPublished ?? true,
        sortOrder: scheme?.sortOrder ?? 0,
        contents,
    };
}

function formatDate(value: string, locale: string) {
    try { return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value)); }
    catch { return value; }
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function AdminGovernmentSchemes({ initialEditor }: { initialEditor?: 'create' | string } = {}) {
    const locale = (useParams()?.locale as string) || 'en';
    const router = useRouter();
    const t = useTranslations('governmentSchemes.admin');
    const gsT = useTranslations('governmentSchemes');

    // List state
    const [items, setItems] = useState<AdminGovernmentSchemeListItem[]>([]);
    const [pagination, setPagination] = useState({ page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 });
    const [categories, setCategories] = useState<string[]>([]);
    const [levels, setLevels] = useState<string[]>([]);
    const [statuses, setStatuses] = useState<string[]>([]);
    const [states, setStates] = useState<string[]>([]);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [level, setLevel] = useState('');
    const [status, setStatus] = useState('');
    const [publishFilter, setPublishFilter] = useState<'all' | 'published' | 'unpublished'>('all');
    const [stateFilter, setStateFilter] = useState('');
    const [sort, setSort] = useState<'newest' | 'oldest' | 'name' | 'sortOrder'>('newest');
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Editor state
    const [editor, setEditor] = useState<EditorState | null>(null);
    const [editorLoading, setEditorLoading] = useState(false);
    const [editorLocale, setEditorLocale] = useState<AdminGovernmentSchemeLocale>('en');
    const [activeSection, setActiveSection] = useState<EditorSection>('basic');
    const [preview, setPreview] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState<SaveMsg>(null);

    // Dialogs
    const [pendingStatus, setPendingStatus] = useState<{ id: string; next: boolean } | null>(null);
    const [statusLoading, setStatusLoading] = useState(false);
    const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteMsg, setDeleteMsg] = useState<'deleted' | 'error' | null>(null);

    const saveMsgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Debounce search
    useEffect(() => {
        const timer = window.setTimeout(() => setSearch(searchInput.trim()), 350);
        return () => window.clearTimeout(timer);
    }, [searchInput]);

    // Load filters
    useEffect(() => {
        let mounted = true;
        void adminGetGovernmentSchemeFiltersApi().then((data) => {
            if (!mounted) return;
            setCategories(data.categories);
            setLevels(data.governmentLevels);
            setStatuses(data.statuses);
            setStates(data.states);
        }).catch(() => undefined);
        return () => { mounted = false; };
    }, []);

    const loadSchemes = useCallback(async (page: number) => {
        setLoading(true); setError(false);
        try {
            const resp = await adminGetGovernmentSchemesApi({
                page, pageSize: PAGE_SIZE,
                search: search || undefined,
                category: category || undefined,
                governmentLevel: level || undefined,
                status: status || undefined,
                state: stateFilter || undefined,
                sort,
                ...(publishFilter !== 'all' ? { isPublished: publishFilter === 'published' } : {}),
            });
            setItems(resp.items);
            setPagination(resp.pagination);
        } catch { setItems([]); setError(true); }
        finally { setLoading(false); }
    }, [category, level, publishFilter, search, sort, stateFilter, status]);

    useEffect(() => { void loadSchemes(1); }, [loadSchemes]);

    // Editor open/close
    const openEditor = async (id?: string, fromRoute = false) => {
        if (id && !fromRoute) {
            router.push(`/${locale}/admin/government-schemes/${id}/edit`);
            return;
        }
        setSaveMsg(null); setPreview(false); setEditorLocale('en'); setActiveSection('basic');
        if (!id) { setEditor(toEditor()); return; }
        setEditorLoading(true);
        try { setEditor(toEditor(await adminGetGovernmentSchemeApi(id))); }
        catch { setSaveMsg('error'); }
        finally { setEditorLoading(false); }
    };

    useEffect(() => {
        if (!initialEditor || editor || editorLoading) return;
        void openEditor(initialEditor === 'create' ? undefined : initialEditor, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialEditor]);

    const updateEditor = (patch: Partial<EditorState>) => setEditor((cur) => cur ? { ...cur, ...patch } : cur);
    const currentContent = editor?.contents[editorLocale];
    const updateContent = (patch: Partial<AdminGovernmentSchemeContent>) =>
        setEditor((cur) => cur ? { ...cur, contents: { ...cur.contents, [editorLocale]: { ...cur.contents[editorLocale], ...patch } } } : cur);

    // Save
    const save = async () => {
        if (!editor) return;
        if (!editor.slug.trim() || !editor.department.trim() || !editor.sourceUrl.trim() || !editor.category.trim()) {
            setSaveMsg('error'); return;
        }
        const contents = Object.values(editor.contents).filter((c) => c.name.trim() && c.shortDescription.trim() && c.description.trim());
        if (contents.length === 0) { setSaveMsg('error'); return; }

        setSaving(true); setSaveMsg(null);
        if (saveMsgTimer.current) clearTimeout(saveMsgTimer.current);

        const payload: AdminGovernmentSchemePayload = {
            slug: editor.slug.trim(),
            governmentLevel: editor.governmentLevel,
            department: editor.department.trim(),
            category: editor.category.trim(),
            status: editor.status,
            availableStates: editor.availableStates.split(',').map((s) => s.trim()).filter(Boolean),
            applicationUrl: editor.applicationUrl.trim() || null,
            sourceUrl: editor.sourceUrl.trim(),
            lastVerifiedAt: editor.lastVerifiedAt || null,
            isPublished: editor.isPublished,
            sortOrder: editor.sortOrder,
            contents: contents.map((c) => ({
                ...c,
                name: c.name.trim(),
                shortDescription: c.shortDescription.trim(),
                description: c.description.trim(),
                keywords: typeof c.keywords === 'string'
                    ? (c.keywords as string).split(',').map((k: string) => k.trim()).filter(Boolean)
                    : (c.keywords ?? []),
            })),
        };

        try {
            const wasEditing = Boolean(editor.id);
            const saved = editor.id
                ? await adminUpdateGovernmentSchemeApi(editor.id, payload)
                : await adminCreateGovernmentSchemeApi(payload);
            setEditor(toEditor(saved));
            setSaveMsg(wasEditing ? 'updated' : 'created');
            if (!wasEditing) router.replace(`/${locale}/admin/government-schemes/${saved.id}/edit`);
            await loadSchemes(pagination.page);
        } catch { setSaveMsg('error'); }
        finally {
            setSaving(false);
            saveMsgTimer.current = setTimeout(() => setSaveMsg(null), 5000);
        }
    };

    // Status toggle
    const updateStatus = async () => {
        if (!pendingStatus) return;
        setStatusLoading(true);
        try {
            await adminUpdateGovernmentSchemeStatusApi(pendingStatus.id, pendingStatus.next);
            setItems((cur) => cur.map((item) => item.id === pendingStatus.id ? { ...item, isPublished: pendingStatus.next } : item));
            setPendingStatus(null);
        } finally { setStatusLoading(false); }
    };

    // Delete
    const executeDelete = async () => {
        if (!pendingDelete) return;
        setDeleteLoading(true);
        try {
            await adminDeleteGovernmentSchemeApi(pendingDelete.id);
            setDeleteMsg('deleted');
            setPendingDelete(null);
            await loadSchemes(pagination.page);
            setTimeout(() => setDeleteMsg(null), 4000);
        } catch { setDeleteMsg('error'); }
        finally { setDeleteLoading(false); }
    };

    const clearFilters = () => {
        setSearchInput(''); setSearch(''); setCategory(''); setLevel(''); setStatus('');
        setPublishFilter('all'); setStateFilter(''); setSort('newest'); setFiltersOpen(false);
    };

    const filterCount = [search, category, level, status, stateFilter, publishFilter !== 'all' ? publishFilter : ''].filter(Boolean).length;
    const from = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
    const to = Math.min(pagination.page * pagination.pageSize, pagination.total);

    // Show editor
    if (editor || editorLoading) {
        return (
            <EditorView
                editor={editor}
                loading={editorLoading}
                uiLocale={locale}
                t={t}
                gsT={gsT}
                editorLocale={editorLocale}
                setEditorLocale={setEditorLocale}
                currentContent={currentContent}
                updateEditor={updateEditor}
                updateContent={updateContent}
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                preview={preview}
                setPreview={setPreview}
                saving={saving}
                saveMsg={saveMsg}
                save={save}
                close={() => router.push(`/${locale}/admin/government-schemes`)}
            />
        );
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <section className="rounded-2xl border border-[#cbd7cf] bg-[#f6f8f3] p-5 shadow-[0_12px_32px_rgba(20,55,38,0.06)] sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                            <Landmark className="h-3.5 w-3.5" aria-hidden="true" />
                            {t('eyebrow')}
                        </p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">{t('title')}</h1>
                        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">{t('subtitle')}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => router.push(`/${locale}/admin/government-schemes/create`)}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#15583b] px-4 text-sm font-bold text-white shadow-sm hover:bg-[#104a31] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
                    >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        {t('create')}
                    </button>
                </div>
            </section>

            {/* Delete feedback */}
            {deleteMsg && (
                <div role={deleteMsg === 'error' ? 'alert' : 'status'} className={cn('rounded-xl border px-4 py-3 text-sm font-semibold', deleteMsg === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800')}>
                    {deleteMsg === 'error' ? t('deleteError') : t('deleted')}
                </div>
            )}

            {/* Search + Filters */}
            <section className="rounded-2xl border border-[#cbd7cf] bg-[#f6f8f3] p-3 shadow-[0_10px_28px_rgba(20,55,38,0.045)] sm:p-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                    {/* Search */}
                    <div className="min-w-0 flex-1">
                        <label className="sr-only" htmlFor="admin-scheme-search">{t('searchLabel')}</label>
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                            <input
                                id="admin-scheme-search"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder={t('searchPlaceholder')}
                                className="min-h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50"
                            />
                        </div>
                    </div>
                    {/* Inline filters (desktop) */}
                    <div className="hidden items-center gap-2 xl:flex">
                        <select aria-label={t('category')} value={category} onChange={(e) => setCategory(e.target.value)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none">
                            <option value="">{t('allCategories')}</option>
                            {categories.map((c) => <option key={c} value={c}>{gsT.has(`categories.${c}` as never) ? gsT(`categories.${c}` as never) : c}</option>)}
                        </select>
                        <select aria-label={t('level')} value={level} onChange={(e) => setLevel(e.target.value)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none">
                            <option value="">{t('allLevels')}</option>
                            {levels.map((l) => <option key={l} value={l}>{gsT.has(`levels.${l}` as never) ? gsT(`levels.${l}` as never) : l}</option>)}
                        </select>
                        <select aria-label={t('status')} value={publishFilter} onChange={(e) => setPublishFilter(e.target.value as typeof publishFilter)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none">
                            <option value="all">{t('allStatuses')}</option>
                            <option value="published">{t('published')}</option>
                            <option value="unpublished">{t('unpublished')}</option>
                        </select>
                        <select aria-label={t('sort')} value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none">
                            <option value="newest">{t('newest')}</option>
                            <option value="oldest">{t('oldest')}</option>
                            <option value="name">{t('nameSort')}</option>
                            <option value="sortOrder">{t('sortOrder')}</option>
                        </select>
                    </div>
                    <button type="button" onClick={() => setFiltersOpen((v) => !v)} aria-expanded={filtersOpen} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                        {t('filters')}
                        {filterCount > 0 ? <span className="rounded-full bg-emerald-700 px-1.5 py-0.5 text-[10px] text-white">{filterCount}</span> : null}
                    </button>
                    {filterCount > 0 ? (
                        <button type="button" onClick={clearFilters} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-slate-500 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                            <X className="h-4 w-4" aria-hidden="true" />
                            {t('clearFilters')}
                        </button>
                    ) : null}
                </div>

                {/* Expanded filters */}
                {filtersOpen && (
                    <div className="mt-3 grid gap-3 border-t border-slate-200/80 pt-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div>
                            <label className="mb-1.5 block text-xs font-bold text-slate-600" htmlFor="f-category">{t('category')}</label>
                            <select id="f-category" value={category} onChange={(e) => setCategory(e.target.value)} className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none">
                                <option value="">{t('allCategories')}</option>
                                {categories.map((c) => <option key={c} value={c}>{gsT.has(`categories.${c}` as never) ? gsT(`categories.${c}` as never) : c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-bold text-slate-600" htmlFor="f-level">{t('level')}</label>
                            <select id="f-level" value={level} onChange={(e) => setLevel(e.target.value)} className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none">
                                <option value="">{t('allLevels')}</option>
                                {levels.map((l) => <option key={l} value={l}>{gsT.has(`levels.${l}` as never) ? gsT(`levels.${l}` as never) : l}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-bold text-slate-600" htmlFor="f-status">{t('status')}</label>
                            <select id="f-status" value={status} onChange={(e) => setStatus(e.target.value)} className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none">
                                <option value="">{t('allStatuses')}</option>
                                {statuses.map((s) => <option key={s} value={s}>{gsT.has(`statuses.${s}` as never) ? gsT(`statuses.${s}` as never) : s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-bold text-slate-600" htmlFor="f-state">{t('state')}</label>
                            <select id="f-state" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none">
                                <option value="">{t('allStates')}</option>
                                {states.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-bold text-slate-600" htmlFor="f-published">{t('published')}</label>
                            <select id="f-published" value={publishFilter} onChange={(e) => setPublishFilter(e.target.value as typeof publishFilter)} className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none">
                                <option value="all">{t('allStatuses')}</option>
                                <option value="published">{t('published')}</option>
                                <option value="unpublished">{t('unpublished')}</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-bold text-slate-600" htmlFor="f-sort">{t('sort')}</label>
                            <select id="f-sort" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none">
                                <option value="newest">{t('newest')}</option>
                                <option value="oldest">{t('oldest')}</option>
                                <option value="name">{t('nameSort')}</option>
                                <option value="sortOrder">{t('sortOrder')}</option>
                            </select>
                        </div>
                    </div>
                )}
            </section>

            {/* Table */}
            <section className="overflow-hidden rounded-2xl border border-[#cbd7cf] bg-[#f8faf7] shadow-[0_12px_32px_rgba(20,55,38,0.05)]">
                <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3.5 sm:px-5">
                    <div>
                        <p className="text-sm font-bold text-slate-900">{t('count', { count: pagination.total })}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{t('showing', { from, to, total: pagination.total })}</p>
                    </div>
                    <button type="button" disabled={loading} onClick={() => void loadSchemes(pagination.page)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                        <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} aria-hidden="true" />
                        {t('refresh')}
                    </button>
                </div>

                {error ? (
                    <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-5">
                        <div className="flex items-center gap-2.5">
                            <AlertCircle className="h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
                            <p className="text-sm font-bold text-red-900">{t('errorTitle')}</p>
                        </div>
                        <button type="button" onClick={() => void loadSchemes(pagination.page)} className="mt-3 text-sm font-bold text-red-700 hover:text-red-800 focus-visible:outline-none">
                            {t('retry')}
                        </button>
                    </div>
                ) : loading ? (
                    <div className="space-y-2 p-4" aria-busy="true">
                        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-white" />)}
                    </div>
                ) : items.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                        <Landmark className="mx-auto h-9 w-9 text-emerald-700/40" aria-hidden="true" />
                        <p className="mt-4 text-sm font-bold text-slate-900">{t('noSchemes')}</p>
                        <p className="mt-1 text-sm text-slate-500">{t('noSchemesHint')}</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden overflow-x-auto lg:block">
                            <table className="w-full min-w-[980px] text-left">
                                <thead className="bg-[#eef3ed] text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
                                    <tr>
                                        <th className="px-5 py-3.5">{t('columns.scheme')}</th>
                                        <th className="px-4 py-3.5">{t('columns.department')}</th>
                                        <th className="px-4 py-3.5">{t('columns.category')}</th>
                                        <th className="px-4 py-3.5">{t('columns.level')}</th>
                                        <th className="px-4 py-3.5">{t('columns.languages')}</th>
                                        <th className="px-4 py-3.5">{t('columns.published')}</th>
                                        <th className="px-4 py-3.5">{t('columns.updated')}</th>
                                        <th className="px-5 py-3.5 text-right">{t('columns.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200/70">
                                    {items.map((item) => (
                                        <SchemeRow
                                            key={item.id}
                                            item={item}
                                            uiLocale={locale}
                                            t={t}
                                            gsT={gsT}
                                            onEdit={() => void openEditor(item.id)}
                                            onStatus={() => setPendingStatus({ id: item.id, next: !item.isPublished })}
                                            onDelete={() => {
                                                const name = item.contents.find((c) => c.locale === locale)?.name || item.slug;
                                                setPendingDelete({ id: item.id, name });
                                            }}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="grid gap-3 p-3 lg:hidden">
                            {items.map((item) => (
                                <SchemeCard
                                    key={item.id}
                                    item={item}
                                    uiLocale={locale}
                                    t={t}
                                    gsT={gsT}
                                    onEdit={() => void openEditor(item.id)}
                                    onStatus={() => setPendingStatus({ id: item.id, next: !item.isPublished })}
                                    onDelete={() => {
                                        const name = item.contents.find((c) => c.locale === locale)?.name || item.slug;
                                        setPendingDelete({ id: item.id, name });
                                    }}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between border-t border-slate-200/80 px-4 py-3.5 sm:px-5">
                            <p className="text-xs text-slate-500">{t('page', { page: pagination.page, totalPages: pagination.totalPages })}</p>
                            <div className="flex gap-2">
                                <button type="button" disabled={pagination.page <= 1} onClick={() => void loadSchemes(pagination.page - 1)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold disabled:opacity-40 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />{t('previous')}
                                </button>
                                <button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => void loadSchemes(pagination.page + 1)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold disabled:opacity-40 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                                    {t('next')}<ChevronRight className="h-4 w-4" aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </section>

            {/* Publish/Unpublish dialog */}
            {pendingStatus && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="presentation">
                    <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-6 shadow-2xl" role="dialog" aria-modal="true">
                        <h2 className="text-base font-bold text-slate-950">{t('confirmStatusTitle', { action: pendingStatus.next ? t('publish') : t('unpublish') })}</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{t('confirmStatusDescription')}</p>
                        <div className="mt-5 flex justify-end gap-2">
                            <button type="button" onClick={() => setPendingStatus(null)} className="min-h-10 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">{t('cancel')}</button>
                            <button type="button" disabled={statusLoading} onClick={() => void updateStatus()} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white disabled:opacity-60 hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                                {statusLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                                {t('confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete dialog */}
            {pendingDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="presentation">
                    <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-2xl" role="dialog" aria-modal="true">
                        <h2 className="text-base font-bold text-slate-950">{t('confirmDeleteTitle')}</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{t('confirmDeleteDescription')}</p>
                        <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">{pendingDelete.name}</p>
                        <div className="mt-5 flex justify-end gap-2">
                            <button type="button" onClick={() => setPendingDelete(null)} className="min-h-10 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">{t('cancel')}</button>
                            <button type="button" disabled={deleteLoading} onClick={() => void executeDelete()} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-bold text-white disabled:opacity-60 hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
                                {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
                                {t('confirmDelete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

type Tf = ReturnType<typeof useTranslations<'governmentSchemes.admin'>>;
type TgS = ReturnType<typeof useTranslations<'governmentSchemes'>>;

function SchemeRow({ item, uiLocale, t, gsT, onEdit, onStatus, onDelete }: {
    item: AdminGovernmentSchemeListItem; uiLocale: string; t: Tf; gsT: TgS;
    onEdit: () => void; onStatus: () => void; onDelete: () => void;
}) {
    const name = item.contents.find((c) => c.locale === uiLocale)?.name || item.contents[0]?.name || item.slug;
    const catKey = `categories.${item.category}` as never;
    const localCategory = gsT.has(catKey) ? gsT(catKey) : item.category;
    const levelKey = `levels.${item.governmentLevel}` as never;
    const localLevel = gsT.has(levelKey) ? gsT(levelKey) : item.governmentLevel;

    return (
        <tr className="bg-[#fbfcfa] transition-colors hover:bg-emerald-50/30">
            <td className="px-5 py-3.5">
                <p className="text-sm font-bold text-slate-900">{name}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">{item.slug}</p>
            </td>
            <td className="px-4 py-3.5 text-xs text-slate-600 max-w-[180px]">
                <span className="line-clamp-2">{item.department}</span>
            </td>
            <td className="px-4 py-3.5">
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{localCategory}</span>
            </td>
            <td className="px-4 py-3.5">
                <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold', item.governmentLevel === 'central' ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-indigo-200 bg-indigo-50 text-indigo-700')}>
                    {localLevel}
                </span>
            </td>
            <td className="px-4 py-3.5"><Completeness locales={item.availableLocales} t={t} /></td>
            <td className="px-4 py-3.5"><PublishBadge published={item.isPublished} t={t} /></td>
            <td className="px-4 py-3.5 text-xs text-slate-500">{formatDate(item.updatedAt, uiLocale)}</td>
            <td className="px-5 py-3.5 text-right">
                <div className="inline-flex items-center gap-1.5">
                    <button type="button" onClick={onEdit} aria-label={t('edit')} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />{t('edit')}
                    </button>
                    <button type="button" onClick={onStatus} aria-label={item.isPublished ? t('unpublish') : t('publish')} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                        {item.isPublished ? <XCircle className="h-4 w-4" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                    </button>
                    <button type="button" onClick={onDelete} aria-label={t('delete')} className="rounded-lg p-2 text-red-400 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                </div>
            </td>
        </tr>
    );
}

function SchemeCard({ item, uiLocale, t, gsT, onEdit, onStatus, onDelete }: {
    item: AdminGovernmentSchemeListItem; uiLocale: string; t: Tf; gsT: TgS;
    onEdit: () => void; onStatus: () => void; onDelete: () => void;
}) {
    const name = item.contents.find((c) => c.locale === uiLocale)?.name || item.contents[0]?.name || item.slug;
    const catKey = `categories.${item.category}` as never;
    const localCategory = gsT.has(catKey) ? gsT(catKey) : item.category;
    const levelKey = `levels.${item.governmentLevel}` as never;
    const localLevel = gsT.has(levelKey) ? gsT(levelKey) : item.governmentLevel;

    return (
        <article className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">{name}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">{item.slug}</p>
                    <p className="mt-1 text-xs text-slate-500 line-clamp-1">{item.department}</p>
                </div>
                <PublishBadge published={item.isPublished} t={t} />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">{localCategory}</span>
                <span className={cn('rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', item.governmentLevel === 'central' ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-indigo-200 bg-indigo-50 text-indigo-700')}>
                    {localLevel}
                </span>
            </div>
            <div className="mt-3"><Completeness locales={item.availableLocales} t={t} /></div>
            <div className="mt-4 flex items-center justify-between">
                <p className="text-[11px] text-slate-400">{formatDate(item.updatedAt, uiLocale)}</p>
                <div className="flex gap-2">
                    <button type="button" onClick={onEdit} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-emerald-700 px-3 text-xs font-bold text-white hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />{t('edit')}
                    </button>
                    <button type="button" onClick={onStatus} aria-label={item.isPublished ? t('unpublish') : t('publish')} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                        {item.isPublished ? <XCircle className="h-4 w-4" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                    </button>
                    <button type="button" onClick={onDelete} aria-label={t('delete')} className="rounded-lg border border-red-100 p-2 text-red-400 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                </div>
            </div>
        </article>
    );
}

function PublishBadge({ published, t }: { published: boolean; t: Tf }) {
    return (
        <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold', published ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-500')}>
            <span className={cn('h-1.5 w-1.5 rounded-full', published ? 'bg-emerald-600' : 'bg-slate-400')} />
            {published ? t('published') : t('unpublished')}
        </span>
    );
}

function Completeness({ locales, t }: { locales: AdminGovernmentSchemeLocale[]; t: Tf }) {
    return (
        <div className="flex flex-wrap gap-1.5" role="list" aria-label={t('completeness.label')}>
            {LOCALES.map((locale) => (
                <span key={locale} role="listitem" className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold', locales.includes(locale) ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>
                    {t(`locales.${locale}`)}{locales.includes(locale) ? ' ✓' : ' !'}
                </span>
            ))}
        </div>
    );
}

// ─── Editor ───────────────────────────────────────────────────────────────────

function EditorView({
    editor, loading, uiLocale, t, gsT, editorLocale, setEditorLocale,
    currentContent, updateEditor, updateContent, activeSection, setActiveSection,
    preview, setPreview, saving, saveMsg, save, close,
}: {
    editor: EditorState | null; loading: boolean; uiLocale: string; t: Tf; gsT: TgS;
    editorLocale: AdminGovernmentSchemeLocale; setEditorLocale: (l: AdminGovernmentSchemeLocale) => void;
    currentContent?: AdminGovernmentSchemeContent;
    updateEditor: (patch: Partial<EditorState>) => void;
    updateContent: (patch: Partial<AdminGovernmentSchemeContent>) => void;
    activeSection: EditorSection; setActiveSection: (s: EditorSection) => void;
    preview: boolean; setPreview: (v: boolean) => void;
    saving: boolean; saveMsg: SaveMsg; save: () => Promise<void>; close: () => void;
}) {
    if (loading || !editor) {
        return (
            <div className="space-y-4" aria-busy="true">
                <div className="h-12 animate-pulse rounded-xl bg-slate-200" />
                <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />
            </div>
        );
    }

    const SECTIONS: { key: EditorSection; label: string }[] = [
        { key: 'basic', label: t('sections.basic') },
        { key: 'availability', label: t('sections.availability') },
        { key: 'source', label: t('sections.source') },
        { key: 'content', label: t('sections.content') },
    ];

    const localeCompleteness = LOCALES.map((loc) => {
        const c = editor.contents[loc];
        const ok = !!(c?.name?.trim() && c?.shortDescription?.trim() && c?.description?.trim());
        return { locale: loc, ok };
    });

    const currentKeywords = Array.isArray(currentContent?.keywords)
        ? (currentContent!.keywords as string[]).join(', ')
        : (currentContent?.keywords ?? '');

    return (
        <div className="space-y-5">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <button type="button" onClick={close} className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 hover:text-emerald-800 focus-visible:outline-none">
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" /> {t('back')}
                </button>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setPreview(!preview)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        {preview ? t('previewExit') : t('preview')}
                    </button>
                    <button type="button" disabled={saving} onClick={() => void save()} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white disabled:opacity-60 hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                        {saving ? t('saving') : t('save')}
                    </button>
                </div>
            </div>

            {/* Save feedback */}
            {saveMsg && (
                <div role={saveMsg === 'error' ? 'alert' : 'status'} className={cn('rounded-xl border px-4 py-3 text-sm font-semibold', saveMsg === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800')}>
                    {saveMsg === 'error' ? t('saveError') : saveMsg === 'created' ? t('created') : t('updated')}
                </div>
            )}

            {/* Preview */}
            {preview ? (
                <SchemePreview editor={editor} editorLocale={editorLocale} t={t} gsT={gsT} />
            ) : (
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <main className="min-w-0 space-y-5">
                        {/* Section nav */}
                        <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-100/60 p-1">
                            {SECTIONS.map(({ key, label }) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setActiveSection(key)}
                                    className={cn(
                                        'rounded-lg px-3 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
                                        activeSection === key ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                    )}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* BASIC */}
                        {activeSection === 'basic' && (
                            <section className="rounded-2xl border border-[#cbd7cf] bg-[#f6f8f3] p-5">
                                <h2 className="text-lg font-bold text-slate-950">{t('sections.basic')}</h2>
                                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                    <Field label={t('fields.slug')} hint={t('fields.slugHint')} value={editor.slug} onChange={(v) => updateEditor({ slug: v })} required />
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600" htmlFor="ed-level">{t('fields.level')} <span className="text-red-500">*</span></label>
                                        <select id="ed-level" value={editor.governmentLevel} onChange={(e) => updateEditor({ governmentLevel: e.target.value as 'central' | 'state' })} className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-50">
                                            <option value="central">{t('fields.central')}</option>
                                            <option value="state">{t('fields.state')}</option>
                                        </select>
                                    </div>
                                    <Field label={t('fields.department')} placeholder={t('fields.departmentPlaceholder')} value={editor.department} onChange={(v) => updateEditor({ department: v })} required className="sm:col-span-2" />
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600" htmlFor="ed-category">{t('fields.category')} <span className="text-red-500">*</span></label>
                                        <select id="ed-category" value={editor.category} onChange={(e) => updateEditor({ category: e.target.value })} className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-50">
                                            <option value="">{t('allCategories')}</option>
                                            {['financial-assistance','farmer-insurance','irrigation','seeds-inputs','farm-equipment','soil-fertilizer','horticulture','animal-husbandry','dairy','fisheries','other-agriculture-support'].map((c) => (
                                                <option key={c} value={c}>{gsT.has(`categories.${c}` as never) ? gsT(`categories.${c}` as never) : c}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600" htmlFor="ed-status">{t('fields.status')} <span className="text-red-500">*</span></label>
                                        <select id="ed-status" value={editor.status} onChange={(e) => updateEditor({ status: e.target.value as 'active' | 'closed' | 'upcoming' })} className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-50">
                                            {(['active','closed','upcoming'] as const).map((s) => <option key={s} value={s}>{gsT.has(`statuses.${s}` as never) ? gsT(`statuses.${s}` as never) : s}</option>)}
                                        </select>
                                    </div>
                                    <Field label={t('fields.sortOrder')} type="number" value={String(editor.sortOrder)} onChange={(v) => updateEditor({ sortOrder: Number(v) || 0 })} />
                                    <div className="flex items-center gap-3 pt-1">
                                        <input id="ed-published" type="checkbox" checked={editor.isPublished} onChange={(e) => updateEditor({ isPublished: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                                        <label htmlFor="ed-published" className="text-xs font-bold text-slate-700">{t('fields.isPublished')}</label>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* AVAILABILITY */}
                        {activeSection === 'availability' && (
                            <section className="rounded-2xl border border-[#cbd7cf] bg-[#f6f8f3] p-5">
                                <h2 className="text-lg font-bold text-slate-950">{t('sections.availability')}</h2>
                                <div className="mt-5">
                                    <Field label={t('fields.availableStates')} value={editor.availableStates} onChange={(v) => updateEditor({ availableStates: v })} hint="Comma-separated. e.g. Gujarat, Rajasthan" />
                                </div>
                            </section>
                        )}

                        {/* SOURCE */}
                        {activeSection === 'source' && (
                            <section className="rounded-2xl border border-[#cbd7cf] bg-[#f6f8f3] p-5">
                                <h2 className="text-lg font-bold text-slate-950">{t('sections.source')}</h2>
                                <div className="mt-5 grid gap-4">
                                    <Field label={t('fields.sourceUrl')} placeholder={t('fields.sourceUrlPlaceholder')} value={editor.sourceUrl} onChange={(v) => updateEditor({ sourceUrl: v })} required />
                                    <Field label={t('fields.applicationUrl')} placeholder={t('fields.applicationUrlPlaceholder')} value={editor.applicationUrl} onChange={(v) => updateEditor({ applicationUrl: v })} />
                                    <Field label={t('fields.lastVerifiedAt')} type="date" value={editor.lastVerifiedAt} onChange={(v) => updateEditor({ lastVerifiedAt: v })} />
                                </div>
                            </section>
                        )}

                        {/* CONTENT (Localized) */}
                        {activeSection === 'content' && (
                            <section className="rounded-2xl border border-[#cbd7cf] bg-[#f6f8f3] p-5">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-950">{t('sections.localization')}</h2>
                                        <p className="mt-1 text-sm text-slate-500">{t('completeness.label')}</p>
                                    </div>
                                    {/* Language tabs */}
                                    <div className="flex gap-1 rounded-lg bg-slate-200/70 p-1" role="tablist" aria-label="Language tabs">
                                        {LOCALES.map((loc) => {
                                            const c = editor.contents[loc];
                                            const ok = !!(c?.name?.trim() && c?.shortDescription?.trim() && c?.description?.trim());
                                            return (
                                                <button
                                                    key={loc}
                                                    type="button"
                                                    role="tab"
                                                    aria-selected={editorLocale === loc}
                                                    onClick={() => setEditorLocale(loc)}
                                                    className={cn(
                                                        'flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
                                                        editorLocale === loc ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                                    )}
                                                >
                                                    {t(`locales.${loc}`)}
                                                    <span className={cn('h-1.5 w-1.5 rounded-full', ok ? 'bg-emerald-500' : 'bg-amber-400')} aria-hidden="true" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="mt-5 space-y-4">
                                    <Field label={t('fields.name')} value={currentContent?.name ?? ''} onChange={(v) => updateContent({ name: v })} required />
                                    <Field label={t('fields.shortDescription')} hint={t('fields.shortDescriptionHint')} value={currentContent?.shortDescription ?? ''} onChange={(v) => updateContent({ shortDescription: v })} textarea required />
                                    <Field label={t('fields.description')} value={currentContent?.description ?? ''} onChange={(v) => updateContent({ description: v })} textarea required rows={5} />
                                </div>

                                <div className="mt-6 space-y-3">
                                    {CONTENT_FIELDS.map((field) => (
                                        <ContentFieldAccordion
                                            key={field}
                                            fieldKey={field}
                                            label={t(`sections.${field}`)}
                                            hint={t(`fields.${field}Hint`)}
                                            value={currentContent?.[field] ?? []}
                                            onChange={(arr) => updateContent({ [field]: arr })}
                                        />
                                    ))}
                                    {/* Keywords */}
                                    <Field
                                        label={t('fields.keywords')}
                                        value={currentKeywords}
                                        onChange={(v) => updateContent({ keywords: v.split(',').map((k) => k.trim()).filter(Boolean) })}
                                    />
                                </div>
                            </section>
                        )}
                    </main>

                    {/* Sidebar */}
                    <aside className="space-y-4 xl:sticky xl:top-5 xl:self-start">
                        {/* Completeness */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-5">
                            <h3 className="text-sm font-bold text-slate-900">{t('completeness.label')}</h3>
                            <div className="mt-3 space-y-2">
                                {localeCompleteness.map(({ locale: loc, ok }) => (
                                    <div key={loc} className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-slate-700">{t(`locales.${loc}`)}</span>
                                        <span className={cn('font-bold', ok ? 'text-emerald-700' : 'text-amber-600')}>{ok ? `✓ ${t('completeness.complete')}` : `⚠ ${t('completeness.incomplete')}`}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Quick facts */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-5">
                            <h3 className="text-sm font-bold text-slate-900 mb-3">{t('sections.source')}</h3>
                            {editor.sourceUrl && (
                                <a href={editor.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 focus-visible:outline-none">
                                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                                    {t('fields.sourceUrl')}
                                </a>
                            )}
                            {editor.applicationUrl && (
                                <a href={editor.applicationUrl} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-800 focus-visible:outline-none">
                                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                                    {t('fields.applicationUrl')}
                                </a>
                            )}
                            {editor.lastVerifiedAt && (
                                <p className="mt-2 text-xs text-slate-500">{t('fields.lastVerifiedAt')}: <span className="font-bold">{editor.lastVerifiedAt}</span></p>
                            )}
                        </section>
                    </aside>
                </div>
            )}
        </div>
    );
}

function ContentFieldAccordion({ fieldKey, label, hint, value, onChange }: {
    fieldKey: ContentField; label: string; hint: string;
    value: string[]; onChange: (arr: string[]) => void;
}) {
    const [open, setOpen] = useState(false);
    const text = Array.isArray(value) ? value.join('\n') : '';
    return (
        <div className="rounded-xl border border-slate-200 bg-white">
            <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-bold text-slate-800 hover:bg-slate-50 focus-visible:outline-none" aria-expanded={open}>
                <span>{label}</span>
                <span className="ml-2 text-slate-400">{open ? '−' : '+'}</span>
            </button>
            {open && (
                <div className="border-t border-slate-200 px-4 pb-3 pt-2">
                    <p className="mb-2 text-xs text-slate-500">{hint}</p>
                    <textarea
                        value={text}
                        onChange={(e) => onChange(e.target.value.split('\n'))}
                        rows={5}
                        className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-6 text-slate-800 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50"
                    />
                </div>
            )}
        </div>
    );
}

function SchemePreview({ editor, editorLocale, t, gsT }: { editor: EditorState; editorLocale: AdminGovernmentSchemeLocale; t: Tf; gsT: TgS }) {
    const content = editor.contents[editorLocale];
    const levelKey = `levels.${editor.governmentLevel}` as never;
    const catKey = `categories.${editor.category}` as never;
    const statusKey = `statuses.${editor.status}` as never;

    return (
        <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">{t('previewTitle')}</p>
            {!content?.name ? (
                <p className="mt-3 text-sm text-slate-400 italic">{t('previewEmpty')}</p>
            ) : (
                <>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                            {gsT.has(catKey) ? gsT(catKey) : editor.category}
                        </span>
                        <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-semibold text-sky-700">
                            {gsT.has(levelKey) ? gsT(levelKey) : editor.governmentLevel}
                        </span>
                        <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold', editor.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                            {gsT.has(statusKey) ? gsT(statusKey) : editor.status}
                        </span>
                    </div>
                    <h2 className="mt-3 text-xl font-bold text-slate-950">{content.name}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{content.shortDescription}</p>
                    {content.description && <p className="mt-3 text-sm leading-6 text-slate-500">{content.description}</p>}
                    {(content.benefits ?? []).filter(Boolean).length > 0 && (
                        <div className="mt-5 border-t border-slate-100 pt-4">
                            <h3 className="text-sm font-bold text-slate-900">{t('sections.benefits')}</h3>
                            <ul className="mt-2 space-y-1.5 text-sm leading-6 text-slate-600">
                                {(content.benefits as string[]).filter(Boolean).map((b, i) => <li key={i}>• {b}</li>)}
                            </ul>
                        </div>
                    )}
                    {(content.eligibility ?? []).filter(Boolean).length > 0 && (
                        <div className="mt-4 border-t border-slate-100 pt-4">
                            <h3 className="text-sm font-bold text-slate-900">{t('sections.eligibility')}</h3>
                            <ul className="mt-2 space-y-1.5 text-sm leading-6 text-slate-600">
                                {(content.eligibility as string[]).filter(Boolean).map((e, i) => <li key={i}>• {e}</li>)}
                            </ul>
                        </div>
                    )}
                    {editor.sourceUrl && (
                        <div className="mt-5 border-t border-slate-100 pt-4">
                            <a href={editor.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 hover:text-emerald-800">
                                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                                {gsT('openOfficialPortal')}
                            </a>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function Field({ label, value, onChange, textarea = false, required = false, hint, placeholder, type = 'text', rows = 3, className = '' }: {
    label: string; value: string; onChange: (v: string) => void;
    textarea?: boolean; required?: boolean; hint?: string; placeholder?: string;
    type?: string; rows?: number; className?: string;
}) {
    const id = `field-${label.replace(/\s+/g, '-').toLowerCase()}`;
    const input = textarea ? (
        <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder} className="mt-1.5 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50" />
    ) : (
        <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50" />
    );
    return (
        <label className={cn('block text-xs font-bold text-slate-600', className)}>
            {label}{required && <span className="ml-1 text-red-500" aria-hidden="true">*</span>}
            {hint && <span className="ml-1.5 text-[11px] font-normal text-slate-400">{hint}</span>}
            {input}
        </label>
    );
}
