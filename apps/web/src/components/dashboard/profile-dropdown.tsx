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
        className="flex h-10 items-center gap-2 rounded-xl p-1.5 transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        aria-label={t('dashboard.profile.menuLabel')}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Avatar name={name} src={user?.avatarUrl} />
        <span className="hidden text-left md:block">
          <span className="block max-w-[120px] truncate text-sm font-semibold text-foreground">
            {name}
          </span>
          <span className="block max-w-[120px] truncate text-[11px] text-muted-foreground">
            {user?.mobileNumber || t('dashboard.profile.farmer')}
          </span>
        </span>
        <ChevronDown
          className={cn(
            'hidden h-4 w-4 text-muted-foreground transition-transform md:block',
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
              className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface p-1.5 text-foreground shadow-xl shadow-black/10"
              role="menu"
            >
              <div className="border-b border-border px-3.5 py-3">
                <p className="truncate text-sm font-semibold text-foreground">{name}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {user?.mobileNumber || t('dashboard.profile.farmer')}
                </p>
              </div>

              <button
                onClick={() => go('/dashboard/profile')}
                role="menuitem"
                className="flex min-h-10 w-full items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm text-foreground transition-colors hover:bg-surface-subtle"
              >
                <User className="h-4 w-4 text-accent" />
                {t('dashboard.profile.viewProfile')}
              </button>

              <button
                onClick={() => go('/dashboard/settings')}
                role="menuitem"
                className="flex min-h-10 w-full items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm text-foreground transition-colors hover:bg-surface-subtle"
              >
                <Settings className="h-4 w-4 text-accent" />
                {t('dashboard.profile.settings')}
              </button>

              <div className="my-1 border-t border-border" />

              <button
                onClick={logout}
                role="menuitem"
                className="flex min-h-10 w-full items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm text-danger transition-colors hover:bg-danger-soft"
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
