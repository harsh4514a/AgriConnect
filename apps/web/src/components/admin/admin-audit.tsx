'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowUpDown,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Eye,
  FileCode,
  Filter,
  Globe,
  KeyRound,
  Landmark,
  Loader2,
  Lock,
  RefreshCw,
  Search,
  Server,
  Shield,
  ShieldCheck,
  ShoppingBasket,
  Truck,
  User,
  UserCheck,
  UserCog,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import {
  adminGetAuditFiltersApi,
  adminGetAuditLogApi,
  adminGetAuditLogsApi,
  type AdminAuditActorOption,
  type AdminAuditDetails,
  type AdminAuditListItem,
  type AdminAuditPagination,
} from '@/services/admin-api/admin-audit.api';

const PAGE_SIZE = 20;

function formatTimestamp(isoString: string, locale: string) {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'medium',
    }).format(d);
  } catch {
    return isoString;
  }
}

function formatUtcTimestamp(isoString: string) {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toUTCString();
  } catch {
    return isoString;
  }
}

function getActionBadgeStyle(action: string) {
  if (action.includes('LOGIN')) {
    return 'bg-blue-50 text-blue-700 border-blue-200';
  }
  if (action.includes('USER')) {
    return 'bg-warning/10 text-warning border-warning/30';
  }
  if (action.includes('LISTING')) {
    return 'bg-accent-soft text-accent border-accent/30';
  }
  if (action.includes('CROP_GUIDE')) {
    return 'bg-teal-50 text-teal-700 border-teal-200';
  }
  if (action.includes('GOVERNMENT_SCHEME')) {
    return 'bg-sky-50 text-sky-700 border-sky-200';
  }
  if (action.includes('TRANSPORT')) {
    return 'bg-violet-50 text-violet-700 border-violet-200';
  }
  return 'bg-surface-subtle text-foreground border-border';
}

function ActionIcon({ action, className }: { action: string; className?: string }) {
  if (action.includes('LOGIN')) return <KeyRound className={className} aria-hidden="true" />;
  if (action.includes('USER')) return <UserCog className={className} aria-hidden="true" />;
  if (action.includes('LISTING')) return <ShoppingBasket className={className} aria-hidden="true" />;
  if (action.includes('CROP_GUIDE')) return <BookOpen className={className} aria-hidden="true" />;
  if (action.includes('GOVERNMENT_SCHEME')) return <Landmark className={className} aria-hidden="true" />;
  if (action.includes('TRANSPORT')) return <Truck className={className} aria-hidden="true" />;
  return <Activity className={className} aria-hidden="true" />;
}

export function AdminAudit() {
  const t = useTranslations('admin.activity');
  const locale = (useParams()?.locale as string) || 'en';

  const [logs, setLogs] = useState<AdminAuditListItem[]>([]);
  const [pagination, setPagination] = useState<AdminAuditPagination>({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('all');
  const [resource, setResource] = useState('all');
  const [actorId, setActorId] = useState('all');
  const [status, setStatus] = useState<'all' | 'SUCCESS' | 'FAILED'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');

  const [filterOptions, setFilterOptions] = useState<{
    actions: string[];
    resources: string[];
    actors: AdminAuditActorOption[];
  }>({
    actions: [],
    resources: [],
    actors: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(false);

  // Detail drawer state
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AdminAuditDetails | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  // Load filter options on mount
  useEffect(() => {
    let isMounted = true;
    async function loadFilters() {
      try {
        const data = await adminGetAuditFiltersApi();
        if (isMounted) {
          setFilterOptions(data);
        }
      } catch {
        // Non-blocking fallback
      }
    }
    loadFilters();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch audit records
  const fetchLogs = useCallback(
    async (pageToLoad: number, isRefresh = false) => {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(false);

      try {
        const response = await adminGetAuditLogsApi({
          page: pageToLoad,
          pageSize: PAGE_SIZE,
          search: search || undefined,
          action: action !== 'all' ? action : undefined,
          resource: resource !== 'all' ? resource : undefined,
          actorId: actorId !== 'all' ? actorId : undefined,
          status: status !== 'all' ? status : undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          sort,
        });

        setLogs(response.items);
        setPagination(response.pagination);
      } catch {
        setError(true);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [search, action, resource, actorId, status, dateFrom, dateTo, sort],
  );

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  // Fetch individual audit detail when drawer opens
  useEffect(() => {
    if (!selectedLogId) {
      setSelectedLog(null);
      return;
    }

    let isMounted = true;
    setIsDetailsLoading(true);
    setDetailsError(false);

    adminGetAuditLogApi(selectedLogId)
      .then((data) => {
        if (isMounted) setSelectedLog(data);
      })
      .catch(() => {
        if (isMounted) setDetailsError(true);
      })
      .finally(() => {
        if (isMounted) setIsDetailsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedLogId]);

  // Esc key listener to close details drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedLogId) {
        setSelectedLogId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLogId]);

  const hasActiveFilters = useMemo(() => {
    return (
      Boolean(search) ||
      action !== 'all' ||
      resource !== 'all' ||
      actorId !== 'all' ||
      status !== 'all' ||
      Boolean(dateFrom) ||
      Boolean(dateTo) ||
      sort !== 'newest'
    );
  }, [search, action, resource, actorId, status, dateFrom, dateTo, sort]);

  const handleClearFilters = () => {
    setSearchInput('');
    setSearch('');
    setAction('all');
    setResource('all');
    setActorId('all');
    setStatus('all');
    setDateFrom('');
    setDateTo('');
    setSort('newest');
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatFallback = (val: string) => {
    if (!val) return '';
    return val
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const translateAction = (act: string) => {
    if (!act) return '';
    const key = `actions.${act}` as never;
    return t.has(key) ? t(key) : formatFallback(act);
  };

  const translateResource = (res: string) => {
    if (!res) return '';
    const key = `resources.${res}` as never;
    return t.has(key) ? t(key) : formatFallback(res);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">
            {t('eyebrow')}
          </span>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t('title')}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-2xl">{t('subtitle')}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchLogs(pagination.page, true)}
            disabled={isLoading || isRefreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-surface-subtle focus:outline-none focus:ring-2 focus:ring-focus disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-accent' : 'text-muted-foreground'}`}
              aria-hidden="true"
            />
            <span>{t('refresh')}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search box */}
          <div className="relative flex-1">
            <Search
              className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('searchPlaceholder')}
              aria-label={t('searchLabel')}
              className="w-full rounded-xl border border-border bg-surface-subtle/50 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder-slate-400 transition focus:border-focus focus:bg-surface focus:outline-none focus:ring-4 focus:ring-focus"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-muted-foreground"
                aria-label={t('clearFilters')}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick counts */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {t('totalRecords', { count: pagination.total })}
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="ml-3 inline-flex items-center gap-1 font-semibold text-accent hover:text-accent"
              >
                <X className="h-3.5 w-3.5" />
                {t('clearFilters')}
              </button>
            )}
          </div>
        </div>

        {/* Filter controls row */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6 pt-2 border-t border-border text-xs">
          {/* Action filter */}
          <div>
            <label className="block mb-1 font-medium text-muted-foreground">{t('actionFilter')}</label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus"
            >
              <option value="all">{t('allActions')}</option>
              {filterOptions.actions.map((act) => (
                <option key={act} value={act}>
                  {translateAction(act)}
                </option>
              ))}
            </select>
          </div>

          {/* Resource filter */}
          <div>
            <label className="block mb-1 font-medium text-muted-foreground">{t('resourceFilter')}</label>
            <select
              value={resource}
              onChange={(e) => setResource(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus"
            >
              <option value="all">{t('allResources')}</option>
              {filterOptions.resources.map((res) => (
                <option key={res} value={res}>
                  {translateResource(res)}
                </option>
              ))}
            </select>
          </div>

          {/* Actor filter */}
          <div>
            <label className="block mb-1 font-medium text-muted-foreground">{t('actorFilter')}</label>
            <select
              value={actorId}
              onChange={(e) => setActorId(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus"
            >
              <option value="all">{t('allActors')}</option>
              {filterOptions.actors.map((act) => (
                <option key={act.id} value={act.id}>
                  {act.username}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <label className="block mb-1 font-medium text-muted-foreground">{t('statusFilter')}</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus"
            >
              <option value="all">{t('allStatuses')}</option>
              <option value="SUCCESS">{t('successStatus')}</option>
              <option value="FAILED">{t('failedStatus')}</option>
            </select>
          </div>

          {/* Date from */}
          <div>
            <label className="block mb-1 font-medium text-muted-foreground">{t('dateFrom')}</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-foreground focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus"
            />
          </div>

          {/* Date to */}
          <div>
            <label className="block mb-1 font-medium text-muted-foreground">{t('dateTo')}</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-foreground focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-sm">
          <div className="space-y-4">
            <div className="h-6 w-48 animate-pulse rounded bg-surface-subtle" />
            <div className="space-y-2.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl border border-border bg-surface-subtle" />
              ))}
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-danger-soft/50 p-12 text-center shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-danger">
            <AlertCircle className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground">{t('errorTitle')}</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-md">{t('errorSubtitle')}</p>
          <button
            type="button"
            onClick={() => fetchLogs(pagination.page)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm hover:bg-accent-strong transition"
          >
            <RefreshCw className="h-4 w-4" />
            {t('retry')}
          </button>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface p-12 text-center shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-subtle text-muted-foreground">
            {hasActiveFilters ? <Filter className="h-6 w-6" /> : <Activity className="h-6 w-6" />}
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground">
            {hasActiveFilters ? t('noResultsTitle') : t('emptyTitle')}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-md">
            {hasActiveFilters ? t('noResultsSubtitle') : t('emptySubtitle')}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-surface-subtle transition"
            >
              <X className="h-4 w-4" />
              {t('clearFilters')}
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-muted-foreground">
              <thead className="border-b border-border bg-surface-subtle/75 text-xs font-semibold text-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3.5">
                    {t('columns.timestamp')}
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    {t('columns.action')}
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    {t('columns.resource')}
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    {t('columns.actor')}
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    {t('columns.description')}
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    {t('columns.status')}
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-right">
                    {t('columns.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const badgeClass = getActionBadgeStyle(log.action);
                  return (
                    <tr
                      key={log.id}
                      className="group transition-colors hover:bg-accent-soft/20"
                    >
                      {/* Timestamp */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs text-muted-foreground font-mono">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                          <span>{formatTimestamp(log.createdAt, locale)}</span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${badgeClass}`}
                        >
                          <ActionIcon action={log.action} className="h-3.5 w-3.5" />
                          <span>{translateAction(log.action)}</span>
                        </span>
                      </td>

                      {/* Resource */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">
                            {translateResource(log.resource)}
                          </span>
                          {log.resourceId && (
                            <span className="text-[11px] font-mono text-muted-foreground truncate max-w-[120px]" title={log.resourceId}>
                              ID: {log.resourceId.slice(0, 8)}…
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actor */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-subtle text-muted-foreground font-semibold text-xs border border-border">
                            {log.actorName ? log.actorName.slice(0, 2).toUpperCase() : 'SYS'}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {log.actorName || 'System'}
                            </span>
                            <span className="text-[10px] text-muted-foreground capitalize">
                              {log.actorType}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="px-4 py-3.5 text-xs text-foreground max-w-sm truncate" title={log.description}>
                        {log.description}
                      </td>

                      {/* Status */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        {log.status === 'SUCCESS' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent border border-accent/30">
                            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                            {t('successStatus')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2 py-0.5 text-[11px] font-medium text-danger border border-danger/30">
                            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                            {t('failedStatus')}
                          </span>
                        )}
                      </td>

                      {/* View Details button */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedLogId(log.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-foreground shadow-sm transition hover:bg-accent-soft hover:text-accent hover:border-accent/30 focus:outline-none focus:ring-2 focus:ring-focus"
                        >
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{t('viewDetails')}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col gap-3 border-t border-border bg-surface-subtle/50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
            <div>
              {t('showing', {
                from: Math.min((pagination.page - 1) * pagination.pageSize + 1, pagination.total),
                to: Math.min(pagination.page * pagination.pageSize, pagination.total),
                total: pagination.total,
              })}
            </div>

            <div className="flex items-center gap-2">
              <span>
                {t('page', {
                  page: pagination.page,
                  totalPages: pagination.totalPages,
                })}
              </span>

              <div className="inline-flex rounded-lg border border-border bg-surface shadow-sm">
                <button
                  type="button"
                  onClick={() => fetchLogs(pagination.page - 1)}
                  disabled={pagination.page <= 1 || isLoading}
                  className="inline-flex items-center gap-1 rounded-l-lg px-3 py-1.5 text-foreground hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-40 transition"
                  aria-label={t('previous')}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('previous')}</span>
                </button>
                <div className="w-px bg-border" />
                <button
                  type="button"
                  onClick={() => fetchLogs(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages || isLoading}
                  className="inline-flex items-center gap-1 rounded-r-lg px-3 py-1.5 text-foreground hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-40 transition"
                  aria-label={t('next')}
                >
                  <span className="hidden sm:inline">{t('next')}</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Slide-Over Drawer */}
      {selectedLogId && (
        <div
          className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm transition-opacity"
          aria-modal="true"
          role="dialog"
          onClick={() => setSelectedLogId(null)}
        >
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div
              className="w-screen max-w-xl transform bg-surface shadow-2xl transition ease-in-out sm:duration-300 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-border bg-surface-subtle/75 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-accent">
                    <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">{t('detailsTitle')}</h2>
                    <p className="text-xs text-muted-foreground">{t('detailsSubtitle')}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLogId(null)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-surface-subtle hover:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-focus"
                  aria-label={t('closeDetails')}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Immutable Notice Banner */}
                <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-3.5 text-xs text-warning">
                  <Lock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" aria-hidden="true" />
                  <span>{t('immutableNotice')}</span>
                </div>

                {isDetailsLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin text-accent" />
                    <span className="text-xs">{t('searchLabel')}</span>
                  </div>
                ) : detailsError || !selectedLog ? (
                  <div className="rounded-xl border border-danger/30 bg-danger-soft p-6 text-center text-xs text-danger">
                    <AlertCircle className="mx-auto h-6 w-6 text-danger mb-2" />
                    {t('errorSubtitle')}
                  </div>
                ) : (
                  <>
                    {/* Action & Status Card */}
                    <div className="rounded-xl border border-border bg-surface-subtle/50 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {t('details.actionSection')}
                        </span>
                        {selectedLog.status === 'SUCCESS' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-accent">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {t('successStatus')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-danger">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {t('failedStatus')}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                        <div>
                          <span className="text-muted-foreground">{t('details.action')}:</span>
                          <p className="font-semibold text-foreground mt-0.5">
                            {translateAction(selectedLog.action)}
                          </p>
                          <span className="text-[11px] font-mono text-muted-foreground">{selectedLog.action}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('details.resource')}:</span>
                          <p className="font-semibold text-foreground mt-0.5">
                            {translateResource(selectedLog.resource)}
                          </p>
                          {selectedLog.resourceId && (
                            <span className="text-[11px] font-mono text-muted-foreground block truncate" title={selectedLog.resourceId}>
                              ID: {selectedLog.resourceId}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border/60 text-xs">
                        <span className="text-muted-foreground">{t('columns.description')}:</span>
                        <p className="font-medium text-foreground mt-1 leading-relaxed bg-surface p-2.5 rounded-lg border border-border">
                          {selectedLog.description}
                        </p>
                      </div>
                    </div>

                    {/* Actor Information Card */}
                    <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t('details.actorSection')}
                      </span>

                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent font-bold border border-accent/30 text-sm">
                          {selectedLog.actorName ? selectedLog.actorName.slice(0, 2).toUpperCase() : 'SYS'}
                        </div>
                        <div className="text-xs flex-1">
                          <p className="font-semibold text-foreground text-sm">
                            {selectedLog.actorName || 'System'}
                          </p>
                          <p className="text-muted-foreground capitalize">{selectedLog.actorType}</p>
                          {selectedLog.actorId && (
                            <p className="text-[11px] font-mono text-muted-foreground truncate">
                              ID: {selectedLog.actorId}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Request Context & Timestamps */}
                    <div className="rounded-xl border border-border bg-surface p-4 space-y-3 text-xs">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t('details.contextSection')}
                      </span>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between py-1 border-b border-border">
                          <span className="text-muted-foreground">{t('details.timestamp')}:</span>
                          <span className="font-medium text-foreground font-mono">
                            {formatTimestamp(selectedLog.createdAt, locale)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between py-1 border-b border-border">
                          <span className="text-muted-foreground">{t('details.timestampUtc')}:</span>
                          <span className="font-medium text-foreground font-mono text-[11px]">
                            {formatUtcTimestamp(selectedLog.createdAt)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between py-1 border-b border-border">
                          <span className="text-muted-foreground">{t('details.ipAddress')}:</span>
                          <span className="font-medium text-foreground font-mono">
                            {selectedLog.ipAddress || '—'}
                          </span>
                        </div>

                        <div className="py-1">
                          <span className="text-muted-foreground block mb-1">{t('details.userAgent')}:</span>
                          <p className="font-mono text-[11px] text-muted-foreground bg-surface-subtle p-2 rounded border border-border break-all">
                            {selectedLog.userAgent || '—'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between py-1 border-t border-border pt-2">
                          <span className="text-muted-foreground">{t('details.logId')}:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] text-muted-foreground">
                              {selectedLog.id}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(selectedLog.id, 'id')}
                              className="text-muted-foreground hover:text-accent p-1"
                              title={t('details.copyJson')}
                            >
                              {copiedKey === 'id' ? (
                                <Check className="h-3.5 w-3.5 text-accent" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Metadata JSON Card */}
                    <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <FileCode className="h-3.5 w-3.5" />
                          {t('details.metadataSection')}
                        </span>
                        {selectedLog.metadata && (
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(
                                JSON.stringify(selectedLog.metadata, null, 2),
                                'meta',
                              )
                            }
                            className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent font-medium"
                          >
                            {copiedKey === 'meta' ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-accent" />
                                <span>{t('details.copied')}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                <span>{t('details.copyJson')}</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 ? (
                        <pre className="rounded-xl border border-border bg-slate-900 p-3.5 text-xs text-emerald-400 font-mono overflow-x-auto max-h-72">
                          {JSON.stringify(selectedLog.metadata, null, 2)}
                        </pre>
                      ) : (
                        <p className="text-xs text-muted-foreground italic bg-surface-subtle p-3 rounded-lg border border-border">
                          {t('details.metadataEmpty')}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="border-t border-border bg-surface-subtle px-6 py-3.5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedLogId(null)}
                  className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground shadow-sm hover:bg-surface-subtle transition"
                >
                  {t('closeDetails')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
