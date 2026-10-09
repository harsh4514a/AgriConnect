'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Landmark } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export function GovtSchemes() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10">
          <Landmark className="h-5 w-5 text-emerald-300" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-white">{t('dashboard.widgets.govtSchemes.title')}</h3>
          <p className="mt-1 text-xs leading-5 text-white/50">
            {t('dashboard.widgets.govtSchemes.description')}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => router.push(`/${locale}/dashboard/government-schemes`)}
        className="mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-emerald-400/10 px-3.5 text-xs font-semibold text-emerald-200 transition-colors hover:bg-emerald-400/15 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
      >
        {t('dashboard.widgets.govtSchemes.viewSchemes')}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </motion.div>
  );
}
