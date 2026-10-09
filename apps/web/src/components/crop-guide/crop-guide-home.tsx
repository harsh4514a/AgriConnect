'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Search, Sprout, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLocale } from '@/i18n/locale-provider';
import {
  getCropGuides,
  type CropGuideCard,
  type CropGuideSeason,
} from '@/services/api/crop-guides.api';
import { cn } from '@/utils/cn';

const PAGE_SIZE = 24;

export function CropGuideHome() {
  const t = useTranslations('cropGuide');
  // The dashboard language is controlled by LocaleProvider and may intentionally
  // differ from the URL locale segment. Crop Guide data must follow the active UI language.
  const locale = useLocale();

  const [items, setItems] = useState<CropGuideCard[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [seasons, setSeasons] = useState<CropGuideSeason[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [season, setSeason] = useState<CropGuideSeason | ''>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(false);

      try {
        const data = await getCropGuides({
          locale,
          search: search.trim() || undefined,
          category: category || undefined,
          season: season || undefined,
          page,
          limit: PAGE_SIZE,
          signal,
        });

        setItems(data.items);
        setCategories(data.categories);
        setSeasons(data.seasons);
        setTotal(data.total);
        setTotalPages(Math.max(data.totalPages, 1));
      } catch (requestError) {
        if ((requestError as { code?: string }).code === 'ERR_CANCELED') {
          return;
        }

        setError(true);
        setItems([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [category, locale, page, search, season],
  );

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void load(controller.signal);
    }, 280);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [load]);

  const updateSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const updateCategory = (value: string) => {
    setCategory(value);
    setPage(1);
  };

  const updateSeason = (value: CropGuideSeason | '') => {
    setSeason(value);
    setPage(1);
  };

  const categoryLabel = (value: string) => {
    const key = `categories.${value}`;
    return t.has(key) ? t(key) : value;
  };

  const seasonLabel = (value: CropGuideSeason) => t(`seasons.${value}`);

  const hasFilters = Boolean(search.trim() || category || season);
  const showingStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="space-y-6">
      <header className="max-w-3xl">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
          <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
          {t('badge')}
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
          {t('title')}
        </h1>
        <p className="mt-2 text-sm leading-6 text-white/60 sm:text-base">
          {t('subtitle')}
        </p>
      </header>

      <section
        aria-label={t('filters.label')}
        className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 shadow-xl"
      >
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40"
            aria-hidden="true"
          />
          <input
            value={search}
            onChange={(event) => updateSearch(event.target.value)}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchLabel')}
            type="search"
            autoComplete="off"
            className="h-14 w-full rounded-xl border border-white/10 bg-black/10 pl-12 pr-11 text-sm text-white outline-none placeholder:text-white/35 focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20"
          />
          {search && (
            <button
              type="button"
              onClick={() => updateSearch('')}
              aria-label={t('clearSearch')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <FilterGroup label={t('filters.category')}>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <FilterButton
                active={!category}
                onClick={() => updateCategory('')}
              >
                {t('filters.allCategories')}
              </FilterButton>
              {categories.map((value) => (
                <FilterButton
                  key={value}
                  active={category === value}
                  onClick={() => updateCategory(value)}
                >
                  {categoryLabel(value)}
                </FilterButton>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup label={t('filters.season')}>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <FilterButton
                active={!season}
                onClick={() => updateSeason('')}
              >
                {t('filters.allSeasons')}
              </FilterButton>
              {seasons.map((value) => (
                <FilterButton
                  key={value}
                  active={season === value}
                  onClick={() => updateSeason(value)}
                >
                  {seasonLabel(value)}
                </FilterButton>
              ))}
            </div>
          </FilterGroup>
        </div>
      </section>

      <section aria-live="polite" aria-busy={loading}>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            {/* <h2 className="text-lg font-bold text-white">
              {hasFilters ? t('resultsTitle') : t('allCropsTitle')}
            </h2> */}
            <p className="mt-1 text-xs text-white/45">
              {hasFilters ? t('resultsSubtitle') : t('allCropsSubtitle')}
            </p>
          </div>
          {!loading && !error && (
            <span className="text-xs text-white/40">
              {t('countLabel', { count: total })}
            </span>
          )}
        </div>

        {loading ? (
          <CropSkeleton />
        ) : error ? (
          <EmptyState
            title={t('errorTitle')}
            description={t('errorDescription')}
            action={t('retry')}
            onAction={() => void load()}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title={hasFilters ? t('noResultsTitle') : t('emptyTitle')}
            description={
              hasFilters ? t('noResultsDescription') : t('emptyDescription')
            }
            action={hasFilters ? t('clearFilters') : undefined}
            onAction={
              hasFilters
                ? () => {
                    setSearch('');
                    setCategory('');
                    setSeason('');
                    setPage(1);
                  }
                : undefined
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => (
                <CropListItem
                  key={item.slug}
                  item={item}
                  locale={locale}
                  categoryLabel={categoryLabel}
                  seasonLabel={seasonLabel}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-white/45">
                  {t('pagination.range', {
                    start: showingStart,
                    end: showingEnd,
                    total,
                  })}
                </p>

                <nav
                  aria-label={t('pagination.label')}
                  className="flex items-center gap-2"
                >
                  <button
                    type="button"
                    onClick={() => setPage((value) => Math.max(value - 1, 1))}
                    disabled={page <= 1}
                    aria-label={t('pagination.previous')}
                    className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-white/10 px-3 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-35 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">{t('pagination.previous')}</span>
                  </button>
                  <span className="min-w-20 text-center text-xs font-semibold text-white/60">
                    {t('pagination.page', { page, totalPages })}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPage((value) => Math.min(value + 1, totalPages))
                    }
                    disabled={page >= totalPages}
                    aria-label={t('pagination.next')}
                    className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-white/10 px-3 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-35 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                  >
                    <span className="hidden sm:inline">{t('pagination.next')}</span>
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-white/40">
        {label}
      </p>
      {children}
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'min-h-10 shrink-0 rounded-xl px-3.5 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-emerald-400/60',
        active
          ? 'bg-emerald-400 text-emerald-950'
          : 'bg-white/10 text-white/65 hover:bg-white/15 hover:text-white',
      )}
    >
      {children}
    </button>
  );
}

function CropListItem({
  item,
  locale,
  categoryLabel,
  seasonLabel,
}: {
  item: CropGuideCard;
  locale: string;
  categoryLabel: (value: string) => string;
  seasonLabel: (value: CropGuideSeason) => string;
}) {
  return (
    <Link
      href={`/${locale}/dashboard/crop-guide/${item.slug}`}
      className="group flex min-h-20 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-3 transition hover:border-emerald-300/30 hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-emerald-950/50">
        <Image
          src={item.image}
          alt={item.imageAlt}
          fill
          sizes="56px"
          className="object-contain p-2"
        />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-bold text-white">
          {item.name}
        </h3>
        <div className="mt-1 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/55">
            {categoryLabel(item.category)}
          </span>
          {item.seasonKeys.length > 0 && (
            <span className="truncate rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-200">
              {item.seasonKeys.map(seasonLabel).join(' / ')}
            </span>
          )}
        </div>
      </div>

      <ChevronRight
        className="h-4 w-4 shrink-0 text-white/25 transition group-hover:translate-x-0.5 group-hover:text-emerald-300"
        aria-hidden="true"
      />
    </Link>
  );
}

function CropSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: PAGE_SIZE }, (_, index) => (
        <div
          key={index}
          className="flex min-h-20 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-3"
          aria-hidden="true"
        >
          <div className="h-14 w-14 shrink-0 animate-pulse rounded-xl bg-white/10" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-2/3 animate-pulse rounded bg-white/10" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  title,
  description,
  action,
  onAction,
}: {
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.04] px-6 py-14 text-center">
      <Sprout
        className="mx-auto h-10 w-10 text-emerald-300/60"
        aria-hidden="true"
      />
      <h3 className="mt-4 text-lg font-bold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/50">
        {description}
      </p>
      {action && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 min-h-10 rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-bold text-emerald-950 hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300/70"
        >
          {action}
        </button>
      )}
    </div>
  );
}
