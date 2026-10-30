'use client';

import { ArrowRight, Landmark } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export function GovtSchemes() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  return (
    <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft">
          <Landmark className="h-5 w-5 text-accent" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground">{t('dashboard.widgets.govtSchemes.title')}</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {t('dashboard.widgets.govtSchemes.description')}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => router.push(`/${locale}/dashboard/government-schemes`)}
        className="mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-accent-soft px-3.5 text-xs font-semibold text-accent-strong transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        {t('dashboard.widgets.govtSchemes.viewSchemes')}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </section>
  );
}
