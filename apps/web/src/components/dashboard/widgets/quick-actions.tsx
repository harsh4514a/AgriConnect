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
      accent: 'text-sky-300',
    },
    {
      label: t('dashboard.quickAccess.schemes'),
      href: '/dashboard/government-schemes',
      icon: Landmark,
      accent: 'text-emerald-300',
    },
    {
      label: t('dashboard.quickAccess.cropGuide'),
      href: '/dashboard/crop-guide',
      icon: Leaf,
      accent: 'text-green-300',
    },
  ];

  return (
    <section
      aria-label={t('dashboard.quickAccess.label')}
      className="space-y-4"
    >
      <h2 className="text-base font-semibold text-white sm:text-lg">
        {t('dashboard.quickAccess.title')}
      </h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
              className="
                flex min-h-[82px]
                items-center justify-center gap-3
                rounded-2xl
                border border-white/10
                bg-white/5
                px-4 py-4
                text-center
                backdrop-blur-xl
                transition-all
                hover:border-green-400/30
                hover:bg-white/10
                hover:shadow-lg
                hover:shadow-black/20
              "
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <Icon className={`h-5 w-5 ${action.accent}`} />
              </div>

              <span className="text-sm font-semibold text-white">
                {action.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}