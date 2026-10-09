'use client';

import { useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, LogOut, Settings, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Avatar } from '@/components/dashboard/avatar';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/utils/cn';

export function ProfileDropdown() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const name = user && user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`.trim()
    : t('dashboard.profile.fallbackName');

  const go = (href: string) => {
    setOpen(false);
    router.push(`/${locale}${href}`);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full p-1.5 transition-colors hover:bg-white/10"
        aria-label={t('dashboard.profile.menuLabel')}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Avatar name={name} src={user?.avatarUrl} />
        <span className="hidden text-left md:block">
          <span className="block max-w-[120px] truncate text-sm font-semibold text-white">
            {name}
          </span>
          <span className="block max-w-[120px] truncate text-[11px] text-white/50">
            {user?.mobileNumber || t('dashboard.profile.farmer')}
          </span>
        </span>
        <ChevronDown
          className={cn(
            'hidden h-4 w-4 text-white/50 transition-transform md:block',
            open && 'rotate-180',
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.95 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-white/15 bg-green-950/95 p-1 shadow-2xl shadow-black/40 backdrop-blur-2xl"
              role="menu"
            >
              <div className="border-b border-white/10 px-3.5 py-3">
                <p className="truncate text-sm font-semibold text-white">{name}</p>
                <p className="truncate text-[11px] text-white/50">
                  {user?.mobileNumber || t('dashboard.profile.farmer')}
                </p>
              </div>

              <button
                onClick={() => go('/dashboard/profile')}
                role="menuitem"
                className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                <User className="h-4 w-4 text-green-300" />
                {t('dashboard.profile.viewProfile')}
              </button>

              <button
                onClick={() => go('/dashboard/settings')}
                role="menuitem"
                className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Settings className="h-4 w-4 text-green-300" />
                {t('dashboard.profile.settings')}
              </button>

              <div className="my-1 border-t border-white/10" />

              <button
                onClick={logout}
                role="menuitem"
                className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm text-red-300 transition-colors hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" />
                {t('dashboard.profile.logout')}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
