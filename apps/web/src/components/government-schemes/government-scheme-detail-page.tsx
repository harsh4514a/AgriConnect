'use client';

import { AdaptiveLink as Link } from '@/components/performance/adaptive-link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  FileText,
  Landmark,
  ListChecks,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  getGovernmentScheme,
  type GovernmentSchemeDetail,
} from '@/services/api/government-schemes.api';
import { useLocale } from '@/i18n/use-locale';
import { cn } from '@/utils/cn';

const SECTION_KEYS = ['about', 'benefits', 'eligibility', 'documents', 'application', 'conditions'] as const;
type SectionKey = (typeof SECTION_KEYS)[number];

export function GovernmentSchemeDetailPage() {
  const t = useTranslations('governmentSchemes');
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const slug = (params?.slug as string) || '';

  const [scheme, setScheme] = useState<GovernmentSchemeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [open, setOpen] = useState<SectionKey>('about');

  useEffect(() => {
    if (!slug) return;

    const controller = new AbortController();
    setLoading(true);
    setError(false);
    setNotFound(false);

    void getGovernmentScheme(slug, locale, controller.signal)
      .then((data) => setScheme(data))
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        const status = (requestError as { status?: number })?.status;
        setScheme(null);
        setNotFound(status === 404);
        setError(status !== 404);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [slug, locale, retryKey]);

  const jumpOptions = useMemo(
    () =>
      SECTION_KEYS.map((key) => ({
        key,
        label: t(`sections.${key}.title` as never),
      })),
    [t],
  );

  if (loading) return <DetailSkeleton />;
  if (notFound) {
    return (
      <State
        icon={<Landmark className="h-10 w-10 text-accent/60" aria-hidden="true" />}
        title={t('states.notFoundTitle')}
        description={t('states.notFoundDescription')}
        action={t('backToSchemes')}
        onAction={() => router.push(`/${locale}/dashboard/government-schemes`)}
      />
    );
  }
  if (error || !scheme) {
    return (
      <State
        icon={<ShieldCheck className="h-10 w-10 text-accent/60" aria-hidden="true" />}
        title={t('states.errorTitle')}
        description={t('states.errorDescription')}
        action={t('states.retry')}
        onAction={() => setRetryKey((current) => current + 1)}
      />
    );
  }

  return (
    <article className="mx-auto max-w-6xl space-y-6">
      <Link
        href={`/${locale}/dashboard/government-schemes`}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-muted-foreground hover:bg-surface-subtle hover:text-foreground focus:outline-none focus:ring-2 focus:ring-focus"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t('backToSchemes')}
      </Link>

      <header className="rounded-3xl border border-border bg-surface p-5 shadow-xl backdrop-blur-xl sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <Badge>{t(`categories.${scheme.category}` as never, { defaultValue: scheme.category })}</Badge>
              <Badge tone="blue">{t(`levels.${scheme.governmentLevel}` as never)}</Badge>
              <Badge tone="status">{t(`statuses.${scheme.status}` as never)}</Badge>
            </div>
            <h1 className="mt-4 text-2xl font-black tracking-tight text-foreground sm:text-4xl">{scheme.name}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">{scheme.shortDescription}</p>
          </div>

          {scheme.applicationUrl && (
            <a
              href={scheme.applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-bold text-accent-foreground shadow-lg shadow-emerald-950/20 transition hover:bg-accent-strong focus:outline-none focus:ring-2 focus:ring-focus"
            >
              {t('applyOfficially')}
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          )}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <InfoTile icon={<Landmark className="h-4 w-4" />} label={t('detail.level')} value={t(`levels.${scheme.governmentLevel}` as never)} />
          <InfoTile icon={<ShieldCheck className="h-4 w-4" />} label={t('detail.verification')} value={scheme.lastVerifiedAt ? t('verifiedOn', { date: scheme.lastVerifiedAt }) : t('notAvailable')} />
        </div>
      </header>

      <div className="lg:hidden">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold text-muted-foreground">{t('jumpTo')}</span>
          <select
            value={open}
            onChange={(event) => {
              const next = event.target.value as SectionKey;
              setOpen(next);
              document.getElementById(`scheme-section-${next}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-focus/50 focus:ring-2 focus:ring-focus"
          >
            {jumpOptions.map((option) => (
              <option key={option.key} value={option.key}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <nav className="sticky top-24 rounded-2xl border border-border bg-surface-subtle p-2" aria-label={t('jumpTo')}>
            {jumpOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => {
                  setOpen(option.key);
                  document.getElementById(`scheme-section-${option.key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={cn(
                  'flex min-h-11 w-full items-center rounded-xl px-3 text-left text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-focus',
                  open === option.key ? 'bg-accent-soft text-accent' : 'text-muted-foreground hover:bg-surface-subtle hover:text-foreground',
                )}
              >
                {option.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="space-y-3">
          <DetailSection id="scheme-section-about" title={t('sections.about.title')} icon={<Sparkles className="h-4 w-4" />} open={open === 'about'} onToggle={() => setOpen('about')}>
            <p className="text-sm leading-7 text-foreground">{scheme.description}</p>
          </DetailSection>

          <DetailSection id="scheme-section-benefits" title={t('sections.benefits.title')} icon={<CheckCircle2 className="h-4 w-4" />} open={open === 'benefits'} onToggle={() => setOpen('benefits')}>
            <BulletList items={scheme.benefits} emptyLabel={t('notAvailable')} />
          </DetailSection>

          <DetailSection id="scheme-section-eligibility" title={t('sections.eligibility.title')} icon={<ShieldCheck className="h-4 w-4" />} open={open === 'eligibility'} onToggle={() => setOpen('eligibility')}>
            <div className="mb-4 rounded-xl border border-warning/25 bg-warning/10 p-3 text-xs leading-5 text-muted-foreground">
              <strong className="font-semibold text-warning">{t('eligibilityNoticeTitle')}</strong>{' '}
              {t('eligibilityNotice')}
            </div>
            <BulletList items={scheme.eligibility} emptyLabel={t('notAvailable')} />
          </DetailSection>

          <DetailSection id="scheme-section-documents" title={t('sections.documents.title')} icon={<FileText className="h-4 w-4" />} open={open === 'documents'} onToggle={() => setOpen('documents')}>
            <BulletList items={scheme.documents} emptyLabel={t('notAvailable')} />
          </DetailSection>

          <DetailSection id="scheme-section-application" title={t('sections.application.title')} icon={<ListChecks className="h-4 w-4" />} open={open === 'application'} onToggle={() => setOpen('application')}>
            <ol className="space-y-3">
              {scheme.applicationSteps.length ? scheme.applicationSteps.map((step, index) => (
                <li key={step} className="flex gap-3 rounded-xl border border-border bg-surface-subtle p-3.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-xs font-bold text-accent">{index + 1}</span>
                  <span className="pt-1 text-sm leading-6 text-foreground">{step}</span>
                </li>
              )) : <li className="text-sm text-muted-foreground">{t('notAvailable')}</li>}
            </ol>
            {scheme.applicationUrl && (
              <a
                href={scheme.applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent-soft px-4 text-sm font-bold text-accent hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-focus"
              >
                {t('openOfficialPortal')}
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
          </DetailSection>

          <DetailSection id="scheme-section-conditions" title={t('sections.conditions.title')} icon={<ShieldCheck className="h-4 w-4" />} open={open === 'conditions'} onToggle={() => setOpen('conditions')}>
            <BulletList items={scheme.conditions} emptyLabel={t('notAvailable')} />
          </DetailSection>
        </div>
      </div>

      <footer className="rounded-2xl border border-border bg-surface-subtle p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-foreground">{t('source.title')}</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{t('source.description')}</p>
            <a
              href={scheme.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex max-w-full items-center gap-2 break-all text-xs font-semibold text-accent underline decoration-accent/30 underline-offset-4 hover:text-accent focus:outline-none focus:ring-2 focus:ring-focus"
            >
              {scheme.sourceUrl}
              <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            </a>
          </div>
        </div>
      </footer>
    </article>
  );
}

function DetailSection({
  id,
  title,
  icon,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  icon: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const contentId = `${id}-content`;
  return (
    <section id={id} className="scroll-mt-24 overflow-hidden rounded-2xl border border-border bg-surface">
      <h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={contentId}
          onClick={onToggle}
          className="flex min-h-14 w-full items-center gap-3 px-4 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-focus sm:px-5"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">{icon}</span>
          <span className="flex-1 text-sm font-bold text-foreground sm:text-base">{title}</span>
          <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} aria-hidden="true" />
        </button>
      </h2>
      {open && (
        <div id={contentId} className="border-t border-border px-4 py-5 sm:px-5">
          {children}
        </div>
      )}
    </section>
  );
}

function BulletList({ items, emptyLabel }: { items: string[]; emptyLabel: string }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm leading-6 text-foreground">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Badge({ children, tone = 'default' }: { children: React.ReactNode; tone?: 'default' | 'blue' | 'status' }) {
  return (
    <span className={cn(
      'rounded-full px-3 py-1 text-[11px] font-semibold',
      tone === 'blue' ? 'bg-surface-subtle text-muted-foreground' : tone === 'status' ? 'bg-accent-soft text-accent' : 'bg-surface-subtle text-foreground',
    )}>
      {children}
    </span>
  );
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-subtle p-3.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-5" aria-hidden="true">
      <div className="h-5 w-40 animate-pulse rounded bg-surface-subtle" />
      <div className="rounded-3xl border border-border bg-surface-subtle p-7">
        <div className="h-5 w-52 animate-pulse rounded bg-surface-subtle" />
        <div className="mt-5 h-10 w-3/4 animate-pulse rounded bg-surface-subtle" />
        <div className="mt-4 h-12 w-full animate-pulse rounded bg-surface-subtle" />
      </div>
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="h-16 animate-pulse rounded-2xl border border-border bg-surface-subtle" />
      ))}
    </div>
  );
}

function State({
  icon,
  title,
  description,
  action,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface-subtle px-6 py-16 text-center">
      {icon}
      <h1 className="mt-4 text-lg font-bold text-foreground">{title}</h1>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">{description}</p>
      <button
        type="button"
        onClick={onAction}
        className="mt-5 rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground hover:bg-accent-strong focus:outline-none focus:ring-2 focus:ring-focus"
      >
        {action}
      </button>
    </div>
  );
}
