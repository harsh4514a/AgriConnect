'use client';

import { AdaptiveLink as Link } from '@/components/performance/adaptive-link';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Landmark,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  getGovernmentSchemes,
  type GovernmentSchemeCard,
  type GovernmentSchemeLevel,
  type GovernmentSchemeStatus,
} from '@/services/api/government-schemes.api';
import { useLocale } from '@/i18n/use-locale';
import { cn } from '@/utils/cn';

export function GovernmentSchemesHome() {
  const t = useTranslations('governmentSchemes');
  const locale = useLocale();

  const [items, setItems] = useState<GovernmentSchemeCard[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [levels, setLevels] = useState<GovernmentSchemeLevel[]>([]);
  const [statuses, setStatuses] = useState<GovernmentSchemeStatus[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState<GovernmentSchemeLevel | ''>('');
  const [status, setStatus] = useState<GovernmentSchemeStatus | ''>('active');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const requestId = useRef(0);

  useEffect(() => {
    setPage(1);
  }, [search, category, level, status, locale]);

  useEffect(() => {
    const id = ++requestId.current;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(false);

      try {
        const data = await getGovernmentSchemes({
          locale,
          search: search.trim() || undefined,
          category: category || undefined,
          governmentLevel: level || undefined,
          status: status || undefined,
          state: 'Gujarat',
          page,
          limit: 12,
          signal: controller.signal,
        });

        if (id !== requestId.current) return;
        setItems(data.items);
        setCategories(data.categories);
        setLevels(data.governmentLevels);
        setStatuses(data.statuses);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      } catch (requestError) {
        if (controller.signal.aborted || id !== requestId.current) return;
        setError(true);
        setItems([]);
      } finally {
        if (!controller.signal.aborted && id === requestId.current) {
          setLoading(false);
        }
      }
    }, 280);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [search, category, level, status, page, locale, retryKey]);

  const hasFilters = Boolean(search || category || level || status !== 'active');

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setLevel('');
    setStatus('active');
    setPage(1);
  };

  return (
    <div className="space-y-3">
      <h1 className="sr-only">{t('title')}</h1>

      <section
        aria-label={t('searchLabel')}
        className="rounded-2xl border border-border bg-surface p-3 shadow-sm"
      >
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchLabel')}
            className="h-11 w-full rounded-xl border border-border bg-surface-subtle pl-12 pr-11 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-focus/50 focus:ring-2 focus:ring-focus"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label={t('clearSearch')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted-foreground hover:bg-surface-subtle hover:text-foreground focus:outline-none focus:ring-2 focus:ring-focus"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <FilterSelect
            label={t('filters.category')}
            value={category}
            onChange={(value) => {
              setCategory(value);
              setPage(1);
            }}
            options={categories.map((value) => ({ value, label: t(`categories.${value}` as never, { defaultValue: value }) }))}
            allLabel={t('filters.allCategories')}
          />
          <FilterSelect
            label={t('filters.level')}
            value={level}
            onChange={(value) => {
              setLevel(value as GovernmentSchemeLevel | '');
              setPage(1);
            }}
            options={levels.map((value) => ({ value, label: t(`levels.${value}` as never) }))}
            allLabel={t('filters.allLevels')}
          />
          <FilterSelect
            label={t('filters.status')}
            value={status}
            onChange={(value) => {
              setStatus(value as GovernmentSchemeStatus | '');
              setPage(1);
            }}
            options={statuses.map((value) => ({ value, label: t(`statuses.${value}` as never) }))}
            allLabel={t('filters.allStatuses')}
          />
        </div>

        {hasFilters && (
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
            <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{t('filters.applied')}</span>
            </div>
            <button
              type="button"
              onClick={clearFilters}
              className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-accent hover:bg-surface-subtle focus:outline-none focus:ring-2 focus:ring-focus"
            >
              {t('filters.clear')}
            </button>
          </div>
        )}
      </section>

      <section aria-live="polite" aria-busy={loading}>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">{hasFilters ? t('resultsTitle') : t('featuredTitle')}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{t('resultsSubtitle')}</p>
          </div>
          {!loading && <span className="shrink-0 text-xs text-muted-foreground">{t('count', { count: total })}</span>}
        </div>

        {loading ? (
          <SchemeSkeleton />
        ) : error ? (
          <StateMessage
            icon={<ShieldCheck className="h-10 w-10 text-accent/60" aria-hidden="true" />}
            title={t('states.errorTitle')}
            description={t('states.errorDescription')}
            action={t('states.retry')}
            onAction={() => setRetryKey((current) => current + 1)}
          />
        ) : items.length === 0 ? (
          <StateMessage
            icon={<Landmark className="h-10 w-10 text-accent/60" aria-hidden="true" />}
            title={hasFilters ? t('states.noResultsTitle') : t('states.emptyTitle')}
            description={hasFilters ? t('states.noResultsDescription') : t('states.emptyDescription')}
            action={hasFilters ? t('filters.clear') : undefined}
            onAction={hasFilters ? clearFilters : undefined}
          />
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((scheme) => (
                <SchemeCard key={scheme.slug} scheme={scheme} locale={locale} />
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                previousLabel={t('pagination.previous')}
                nextLabel={t('pagination.next')}
                pageLabel={t('pagination.page', { page, totalPages })}
              />
            )}
          </>
        )}
      </section>

      <div className="rounded-xl border border-warning/25 bg-warning/10 p-3 text-xs leading-5 text-muted-foreground">
        <strong className="font-semibold text-warning">{t('verificationNoticeTitle')}</strong>{' '}
        {t('verificationNotice')}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  allLabel: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block px-1 text-[11px] font-semibold text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-focus/50 focus:ring-2 focus:ring-focus"
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SchemeCard({
  scheme,
  locale,
}: {
  scheme: GovernmentSchemeCard;
  locale: string;
}) {
  const t = useTranslations('governmentSchemes');
  return (
    <Link
      href={`/${locale}/dashboard/government-schemes/${scheme.slug}`}
      prefetch={false}
      className="group flex min-h-[180px] flex-col rounded-2xl border border-border bg-surface p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-focus"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Landmark className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full bg-surface-subtle px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
              {t(`categories.${scheme.category}` as never, { defaultValue: scheme.category })}
            </span>
            <span className="rounded-full bg-surface-subtle px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
              {t(`levels.${scheme.governmentLevel}` as never)}
            </span>
          </div>
          <h3 className="mt-3 text-base font-bold leading-6 text-foreground">{scheme.name}</h3>
        </div>
      </div>

      <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{scheme.shortDescription}</p>

      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className={cn(
            'rounded-full px-2.5 py-1 font-semibold',
            scheme.status === 'active' ? 'bg-accent-soft text-accent' : 'bg-surface-subtle text-muted-foreground',
          )}>
            {t(`statuses.${scheme.status}` as never)}
          </span>
          {scheme.lastVerifiedAt && (
            <span className="text-muted-foreground">{t('verified')}</span>
          )}
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-accent">
          {t('viewDetails')}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

function SchemeSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="min-h-[180px] rounded-2xl border border-border bg-surface p-4">
          <div className="flex gap-3">
            <div className="h-11 w-11 animate-pulse rounded-xl bg-surface-subtle" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-surface-subtle" />
              <div className="h-5 w-3/4 animate-pulse rounded bg-surface-subtle" />
            </div>
          </div>
          <div className="mt-5 h-16 animate-pulse rounded bg-surface-subtle" />
          <div className="mt-5 h-5 w-28 animate-pulse rounded bg-surface-subtle" />
        </div>
      ))}
    </div>
  );
}

function StateMessage({
  icon,
  title,
  description,
  action,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface-subtle px-6 py-12 text-center">
      {icon}
      <h3 className="mt-4 text-lg font-bold text-foreground">{title}</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">{description}</p>
      {action && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground hover:bg-accent-strong focus:outline-none focus:ring-2 focus:ring-focus"
        >
          {action}
        </button>
      )}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onPageChange,
  previousLabel,
  nextLabel,
  pageLabel,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  previousLabel: string;
  nextLabel: string;
  pageLabel: string;
}) {
  return (
    <nav className="mt-6 flex items-center justify-between gap-3" aria-label={pageLabel}>
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-border bg-surface/[0.05] px-3 text-xs font-semibold text-foreground hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-focus"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        {previousLabel}
      </button>
      <span className="text-xs text-muted-foreground">{pageLabel}</span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-border bg-surface/[0.05] px-3 text-xs font-semibold text-foreground hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-focus"
      >
        {nextLabel}
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </nav>
  );
}
