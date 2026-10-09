'use client';

import Link from 'next/link';
import { ArrowLeft, FileText, LockKeyhole } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

type LegalKind = 'terms' | 'privacy';

export function LegalDocument({ kind }: { kind: LegalKind }) {
  const t = useTranslations();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const isTerms = kind === 'terms';

  const title = isTerms ? t('legal.terms.title') : t('legal.privacy.title');
  const icon = isTerms ? FileText : LockKeyhole;
  const Icon = icon;

  const sections = isTerms
    ? [
        ['overview', t('legal.terms.overviewTitle'), t('legal.terms.overviewBody')],
        ['use', t('legal.terms.useTitle'), t('legal.terms.useBody')],
        ['content', t('legal.terms.contentTitle'), t('legal.terms.contentBody')],
        ['availability', t('legal.terms.availabilityTitle'), t('legal.terms.availabilityBody')],
      ]
    : [
        ['scope', t('legal.privacy.scopeTitle'), t('legal.privacy.scopeBody')],
        ['data', t('legal.privacy.dataTitle'), t('legal.privacy.dataBody')],
        ['location', t('legal.privacy.locationTitle'), t('legal.privacy.locationBody')],
        ['choices', t('legal.privacy.choicesTitle'), t('legal.privacy.choicesBody')],
      ];

  return (
    <article className="mx-auto max-w-4xl pb-10">
      <Link
        href={`/${locale}/dashboard/settings`}
        className="mb-6 inline-flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t('legal.backToSettings')}
      </Link>

      <header className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 sm:p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-amber-300">
          {t('legal.draftNotice')}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-white/55">
          {t('legal.reviewNotice')}
        </p>
      </header>

      <div className="mt-5 space-y-3">
        {sections.map(([id, heading, body]) => (
          <section
            key={id}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6"
          >
            <h2 className="text-base font-semibold text-white">{heading}</h2>
            <p className="mt-2 text-sm leading-7 text-white/60">{body}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
