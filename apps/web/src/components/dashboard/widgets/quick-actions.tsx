'use client';

import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Truck, Landmark, Leaf } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function QuickActions() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();

  const locale = (params?.locale as string) || 'en';

  const actions = [
    {
      label: t('dashboard.quickAccess.transport'),
      href: '/dashboard/transport',
      icon: Truck,
      accent: 'text-accent',
    },
    {
      label: t('dashboard.quickAccess.schemes'),
      href: '/dashboard/government-schemes',
      icon: Landmark,
      accent: 'text-accent',
    },
    {
      label: t('dashboard.quickAccess.cropGuide'),
      href: '/dashboard/crop-guide',
      icon: Leaf,
      accent: 'text-accent',
    },
  ];

  return (
    <section
      aria-label={t('dashboard.quickAccess.label')}
      className="space-y-3"
    >
      <h2 className="text-sm font-semibold text-foreground">
        {t('dashboard.quickAccess.title')}
      </h2>

      <div className="flex flex-wrap gap-2">
        {actions.map((action, index) => {
          const Icon = action.icon;

          return (
            <motion.button
              key={action.href}
              type="button"
              onClick={() => router.push(`/${locale}${action.href}`)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.05,
                duration: 0.3,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-border-strong hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              <Icon className={`h-4 w-4 ${action.accent}`} aria-hidden="true" />
              <span>{action.label}</span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
