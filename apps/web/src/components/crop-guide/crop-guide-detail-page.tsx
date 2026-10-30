'use client';

import Image from 'next/image';
import { AdaptiveLink as Link } from '@/components/performance/adaptive-link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ExternalLink,
  Leaf,
  RefreshCw,
  ShieldCheck,
  Sprout,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLocale } from '@/i18n/locale-provider';
import { getCropGuide, type CropGuideDetail } from '@/services/api/crop-guides.api';

const SECTION_ORDER = [
  'overview',
  'climate',
  'soil',
  'season',
  'landPreparation',
  'seedPlanting',
  'sowingMethod',
  'irrigation',
  'nutrientManagement',
  'weedManagement',
  'pestDisease',
  'harvesting',
  'postHarvest',
  'expectedYield',
  'tips',
] as const;

type PageState = 'loading' | 'ready' | 'error' | 'notFound';

export function CropGuideDetailPage() {
  const t = useTranslations('cropGuide');
  const params = useParams();
  // Use the active dashboard language, not the URL segment. The app supports
  // switching language without changing the current route, so the API must
  // receive the language currently selected by the user.
  const locale = useLocale();
  const slug = params?.crop as string;

  const [guide, setGuide] = useState<CropGuideDetail | null>(null);
  const [state, setState] = useState<PageState>('loading');
  const [open, setOpen] = useState<string | null>(null);
  const [jumpTo, setJumpTo] = useState('');

  useEffect(() => {
    if (!slug) {
      setState('notFound');
      return;
    }

    let cancelled = false;
    setState('loading');
    setGuide(null);

    getCropGuide(slug, locale)
      .then((data) => {
        if (cancelled) return;
        setGuide(data);
        setState('ready');
      })
      .catch((error) => {
        if (cancelled) return;
        const status = (error as { status?: number }).status;
        setState(status === 404 ? 'notFound' : 'error');
      });

    return () => {
      cancelled = true;
    };
  }, [locale, slug]);

  const quickGuide = useMemo(() => (guide ? buildQuickGuide(guide) : null), [guide]);

  const sections = useMemo(
    () =>
      SECTION_ORDER.filter(
        (key) => (guide?.sections?.[key] ?? []).length > 0,
      ),
    [guide],
  );

  useEffect(() => {
    if (state === 'ready' && sections.length > 0) {
      setOpen(sections[0]);
    }
  }, [sections, state]);

  const sectionLabel = (key: string) => t(`sections.${key}` as never);

  const scrollToSection = (key: string) => {
    setOpen(key);
    setJumpTo(key);
    document
      .getElementById(`crop-section-${key}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (state === 'loading') {
    return <DetailSkeleton />;
  }

  if (state === 'notFound') {
    return (
      <DetailState
        icon={<Leaf className="h-10 w-10" aria-hidden="true" />}
        title={t('detail.notFoundTitle')}
        description={t('detail.notFoundDescription')}
        action={t('detail.backToGuide')}
        href={`/${locale}/dashboard/crop-guide`}
      />
    );
  }

  if (state === 'error' || !guide) {
    return (
      <DetailState
        icon={<RefreshCw className="h-10 w-10" aria-hidden="true" />}
        title={t('detail.errorTitle')}
        description={t('detail.errorDescription')}
        action={t('detail.retry')}
        onAction={() => window.location.reload()}
        secondaryAction={t('detail.backToGuide')}
        secondaryHref={`/${locale}/dashboard/crop-guide`}
      />
    );
  }

  return (
    <article className="mx-auto max-w-6xl">
      <Link
        href={`/${locale}/dashboard/crop-guide`}
        className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold text-muted-foreground hover:bg-surface-subtle hover:text-foreground focus:outline-none focus:ring-2 focus:ring-focus"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t('detail.backToGuide')}
      </Link>

      <header className="mt-4 overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl">
        <div className="grid md:grid-cols-[220px_minmax(0,1fr)]">
          <div className="relative min-h-48 bg-surface-subtle sm:min-h-56">
            <Image
              src={guide.image}
              alt={guide.imageAlt}
              fill
              sizes="(max-width: 768px) 100vw, 220px"
              className="object-contain p-8 sm:p-10"
              priority
            />
          </div>

          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                {t.has(`categories.${guide.category}`)
                  ? t(`categories.${guide.category}`)
                  : guide.category}
              </span>
              {guide.seasonKeys.length > 0 && (
                <span className="rounded-full bg-surface-subtle px-3 py-1 text-xs font-semibold text-foreground">
                  {guide.seasonKeys.map((season) => t(`seasons.${season}`)).join(' / ')}
                </span>
              )}
            </div>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              {guide.name}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
              {guide.shortDescription}
            </p>

            <div className="mt-5 flex items-start gap-3 rounded-xl border border-accent/10 bg-emerald-400/5 p-3">
              <ShieldCheck
                className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                aria-hidden="true"
              />
              <div className="min-w-0 text-xs leading-5 text-muted-foreground">
                <p>{t('detail.sourceNotice')}</p>
                <p className="mt-1 font-semibold text-foreground">
                  {guide.source.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section
        aria-labelledby="crop-quick-facts"
        className="mt-5"
      >
        <div className="mb-3">
          <h2 id="crop-quick-facts" className="text-lg font-bold text-foreground">
            {t('quickFacts.title')}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {t('quickFacts.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <QuickFact
            icon={<Sprout className="h-4 w-4" aria-hidden="true" />}
            label={t('quickFacts.category')}
            value={
              t.has(`categories.${guide.category}`)
                ? t(`categories.${guide.category}`)
                : guide.category
            }
          />
          {guide.seasonKeys.length > 0 && (
            <QuickFact
              icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}
              label={t('quickFacts.season')}
              value={guide.seasonKeys.map((season) => t(`seasons.${season}`)).join(' / ')}
            />
          )}
        </div>
      </section>

      {quickGuide && (
        <section
          aria-labelledby="quick-farmer-guide"
          className="mt-6 rounded-2xl border border-accent/10 bg-accent-soft p-4 sm:p-5"
        >
          <div className="mb-4">
            <h2 id="quick-farmer-guide" className="text-lg font-bold text-foreground">
              {t('quickGuide.title')}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('quickGuide.subtitle')}
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {quickGuide.map((step) => (
              <div
                key={step.key}
                className="rounded-xl border border-border bg-surface-subtle p-4"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-accent">
                  {t(`quickGuide.${step.key}.title` as never)}
                </p>
                <ul className="mt-2 space-y-2">
                  {step.points.map((point, index) => (
                    <li
                      key={`${step.key}-${index}`}
                      className="flex gap-2 text-xs leading-5 text-foreground"
                    >
                      <span
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                        aria-hidden="true"
                      />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {sections.length > 0 && (
        <div className="mt-7 grid gap-6 lg:grid-cols-[190px_minmax(0,1fr)]">
          <div className="lg:hidden">
            <label
              htmlFor="crop-guide-jump"
              className="mb-2 block text-xs font-semibold text-muted-foreground"
            >
              {t('detail.jumpToSection')}
            </label>
            <select
              id="crop-guide-jump"
              value={jumpTo || sections[0]}
              onChange={(event) => scrollToSection(event.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-focus/50 focus:ring-2 focus:ring-focus"
            >
              {sections.map((key) => (
                <option key={key} value={key} className="bg-surface text-foreground">
                  {sectionLabel(key)}
                </option>
              ))}
            </select>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-6 rounded-2xl border border-border bg-surface-subtle p-3">
              <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {t('detail.onThisPage')}
              </p>
              {sections.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => scrollToSection(key)}
                  className={cnNavItem(open === key)}
                >
                  {sectionLabel(key)}
                </button>
              ))}
            </div>
          </aside>

          <div className="space-y-3">
            {sections.map((key, index) => {
              const isOpen = open === key;
              const content = guide.sections[key] ?? [];

              return (
                <section
                  key={key}
                  id={`crop-section-${key}`}
                  className="scroll-mt-6 overflow-hidden rounded-2xl border border-border bg-surface-subtle"
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`crop-content-${key}`}
                    onClick={() => setOpen(isOpen ? null : key)}
                    className="flex min-h-16 w-full items-center justify-between gap-4 px-4 py-4 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-focus sm:px-5"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-xs font-bold text-accent">
                        {index + 1}
                      </span>
                      <span className="font-bold text-foreground">
                        {sectionLabel(key)}
                      </span>
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>

                  {isOpen && (
                    <div
                      id={`crop-content-${key}`}
                      className="border-t border-border px-5 pb-5 pt-4"
                    >
                      <ul className="space-y-3">
                        {content.map((point, pointIndex) => (
                          <li
                            key={`${key}-${pointIndex}`}
                            className="flex gap-3 text-sm leading-7 text-foreground"
                          >
                            <span
                              className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                              aria-hidden="true"
                            />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>
      )}

      <footer className="mt-7 rounded-2xl border border-border bg-surface-subtle p-5">
        <div className="flex items-start gap-3">
          <BookOpen
            className="mt-0.5 h-4 w-4 shrink-0 text-accent"
            aria-hidden="true"
          />
          <div className="min-w-0 text-sm text-muted-foreground">
            <p>
              {t('detail.sourceLabel')}:{' '}
              <span className="font-semibold text-foreground">
                {guide.source.name}
              </span>
            </p>
            <a
              href={guide.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex min-h-10 items-center gap-1 rounded-lg text-accent hover:text-accent focus:outline-none focus:ring-2 focus:ring-focus"
            >
              {t('detail.viewSource')}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </footer>
    </article>
  );
}

function QuickFact({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-subtle p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 truncate text-sm font-semibold text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}

function buildQuickGuide(guide: CropGuideDetail) {
  const beforeSowing = [
    ...(guide.sections.landPreparation ?? []),
    ...(guide.sections.seedPlanting ?? []),
    ...(guide.sections.sowingMethod ?? []),
  ].slice(0, 3);

  const duringGrowth = [
    ...(guide.sections.irrigation ?? []),
    ...(guide.sections.nutrientManagement ?? []),
    ...(guide.sections.weedManagement ?? []),
    ...(guide.sections.pestDisease ?? []),
  ].slice(0, 3);

  const beforeHarvest = [
    ...(guide.sections.harvesting ?? []),
    ...(guide.sections.postHarvest ?? []),
    ...(guide.sections.tips ?? []),
  ].slice(0, 3);

  const steps = [
    { key: 'beforeSowing', points: beforeSowing },
    { key: 'duringGrowth', points: duringGrowth },
    { key: 'beforeHarvest', points: beforeHarvest },
  ].filter((step) => step.points.length > 0);

  return steps.length > 0 ? steps : null;
}

function cnNavItem(active: boolean) {
  return `block w-full rounded-lg px-2 py-2 text-left text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-focus ${
    active
      ? 'bg-accent-soft text-accent'
      : 'text-muted-foreground hover:bg-surface-subtle hover:text-foreground'
  }`;
}

function DetailState({
  icon,
  title,
  description,
  action,
  href,
  onAction,
  secondaryAction,
  secondaryHref,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action: string;
  href?: string;
  onAction?: () => void;
  secondaryAction?: string;
  secondaryHref?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface-subtle px-6 py-14 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
        {icon}
      </div>
      <h1 className="mt-4 text-xl font-bold text-foreground">{title}</h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground hover:bg-accent-strong focus:outline-none focus:ring-2 focus:ring-focus"
          >
            {action}
          </button>
        ) : href ? (
          <Link
            href={href}
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground hover:bg-accent-strong focus:outline-none focus:ring-2 focus:ring-focus"
          >
            {action}
          </Link>
        ) : null}

        {secondaryAction && secondaryHref && (
          <Link
            href={secondaryHref}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-subtle hover:text-foreground focus:outline-none focus:ring-2 focus:ring-focus"
          >
            {secondaryAction}
          </Link>
        )}
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-5" aria-hidden="true">
      <div className="h-10 w-36 animate-pulse rounded-lg bg-surface-subtle" />
      <div className="grid overflow-hidden rounded-3xl border border-border bg-surface-subtle md:grid-cols-[220px_1fr]">
        <div className="h-52 animate-pulse bg-surface-subtle" />
        <div className="space-y-4 p-6">
          <div className="h-6 w-32 animate-pulse rounded bg-surface-subtle" />
          <div className="h-10 w-2/3 animate-pulse rounded bg-surface-subtle" />
          <div className="h-16 w-full animate-pulse rounded bg-surface-subtle" />
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index} className="h-20 animate-pulse rounded-xl bg-surface-subtle" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="h-16 animate-pulse rounded-2xl bg-surface-subtle" />
        ))}
      </div>
    </div>
  );
}
