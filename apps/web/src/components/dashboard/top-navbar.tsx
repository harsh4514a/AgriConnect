'use client';

import { useTranslations } from 'next-intl';
import { Menu, Search, Sprout } from 'lucide-react';
import { LanguageSwitcher } from '@/components/auth/language-switcher';
import { NotificationPanel } from '@/components/dashboard/notification-panel';
import { ProfileDropdown } from '@/components/dashboard/profile-dropdown';
import { cn } from '@/utils/cn';

interface TopNavbarProps {
  /** Current page title shown next to the logo. */
  title: string;
  /** Opens the mobile drawer. */
  onOpenMobile: () => void;
}

export function TopNavbar({ title, onOpenMobile }: TopNavbarProps) {
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-green-950/70 backdrop-blur-2xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        {/* Mobile menu button */}
        <button
          onClick={onOpenMobile}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-white/70 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
          aria-label={t('dashboard.sidebar.open')}
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Logo (mobile only; sidebar shows it on desktop) */}
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl lg:hidden"
          style={{
            background: 'linear-gradient(135deg, #2E7D32, #1B5E20)',
            boxShadow: '0 4px 12px rgba(46,125,50,0.35)',
          }}
        >
          <Sprout className="h-5 w-5 text-white" />
        </div>

        {/* Page title */}
        <h1 className="truncate text-lg font-bold tracking-tight text-white sm:text-xl">{title}</h1>

        {/* Search (UI only) */}
        <div className="ml-auto hidden w-full max-w-sm md:block">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              type="search"
              placeholder={t('dashboard.search.placeholder')}
              aria-label={t('dashboard.search.placeholder')}
              className={cn(
                'h-10 w-full rounded-xl border border-white/15 bg-white/10 pl-9 pr-4',
                'text-sm text-white placeholder:text-white/40 outline-none',
                'transition-colors focus:border-green-400/60 focus:bg-white/15',
              )}
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2 md:ml-0">
          {/* Mobile search icon (UI only) */}
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white md:hidden"
            aria-label={t('dashboard.search.placeholder')}
          >
            <Search className="h-5 w-5" />
          </button>

          <LanguageSwitcher
            className="[&>button]:!text-white [&>button]:hover:!bg-white/10 [&>button>svg]:!text-white [&>button>span]:!text-white"
          />

          <NotificationPanel />

          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
}
