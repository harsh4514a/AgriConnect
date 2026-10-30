'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, type MouseEvent } from 'react';
import Image from 'next/image';
import { AdaptiveLink as Link } from '@/components/performance/adaptive-link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  ArrowRight,
  ChevronDown,
  ClipboardList,
  LayoutDashboard,
  List,
  LogOut,
  MapPin,
  Menu,
  Package,
  Truck,
  UserRound,
  X,
} from 'lucide-react';
import { LanguageSwitcher } from '@/components/auth/language-switcher';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { useAuth } from '@/hooks/use-auth';
import { hasUsableSession } from '@/services/api/token';
import { clearStoredAdminTokens, getCachedAdminProfile, hasUsableAdminSession, type StoredAdminProfile } from '@/services/admin-api/admin-token';
import { cn } from '@/utils/cn';

const NotificationPanel = dynamic(
  () => import('@/components/dashboard/notification-panel').then((module) => module.NotificationPanel),
  { loading: () => null },
);

type NavbarVariant = 'overlay' | 'solid';

const NAV_ITEMS = [
  { path: '/dashboard/marketplace', key: 'marketplace' },
  { path: '/dashboard/buyer-requirements', key: 'buyerRequirements' },
  { path: '/dashboard/market-prices', key: 'marketPrices' },
  { path: '/dashboard/transport', key: 'transport' },
] as const;

const RESOURCE_ITEMS = [
  { path: '/dashboard/crop-guide', key: 'cropGuide' },
  { path: '/dashboard/government-schemes', key: 'schemes' },
] as const;

function isActive(pathname: string, locale: string, path: string) {
  const target = `/${locale}${path}`;
  return pathname === target || pathname.startsWith(`${target}/`);
}

export function Navbar({
  variant = 'overlay',
  showNotifications = false,
}: {
  variant?: NavbarVariant;
  showNotifications?: boolean;
}) {
  const t = useTranslations();
  const nav = useTranslations('landingPage.nav');
  const account = useTranslations('landingPage.account');
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'en';
  const { user, isAuthenticated, logout: logoutUser } = useAuth();
  const [showFloating, setShowFloating] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminProfile, setAdminProfile] = useState<StoredAdminProfile | null>(null);

  useEffect(() => {
    if (variant !== 'solid') return;

    const hero = document.getElementById('home');
    if (!hero) {
      setShowFloating(false);
      return;
    }

    let threshold = hero.getBoundingClientRect().top + window.scrollY + hero.offsetHeight / 2;
    const updateVisibility = () => setShowFloating(window.scrollY >= threshold);
    const updateThreshold = () => {
      threshold = hero.getBoundingClientRect().top + window.scrollY + hero.offsetHeight / 2;
      updateVisibility();
    };

    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    window.addEventListener('resize', updateThreshold);
    return () => {
      window.removeEventListener('scroll', updateVisibility);
      window.removeEventListener('resize', updateThreshold);
    };
  }, [pathname, variant]);

  useEffect(() => {
    const updateAdminSession = () => {
      setAdminProfile(hasUsableAdminSession() ? getCachedAdminProfile() : null);
    };
    updateAdminSession();
    window.addEventListener('storage', updateAdminSession);
    window.addEventListener('agri:admin-session-updated', updateAdminSession);
    return () => {
      window.removeEventListener('storage', updateAdminSession);
      window.removeEventListener('agri:admin-session-updated', updateAdminSession);
    };
  }, []);

  const closeMobileMenu = () => setMobileOpen(false);
  const loginHref = `/${locale}/auth`;
  const dashboardHref = `/${locale}/dashboard`;
  const adminHref = `/${locale}/admin`;
  const hasAdminAccess = adminProfile?.role === 'admin' && hasUsableAdminSession();
  const isSignedIn = isAuthenticated || hasAdminAccess;
  const handleHomeClick = (event: MouseEvent<HTMLAnchorElement>) => {
    closeMobileMenu();
    if (!hasUsableSession() && !hasUsableAdminSession()) return;

    event.preventDefault();
    router.push(dashboardHref);
  };
  const userName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
    : adminProfile?.username ?? '';

  const logout = () => {
    if (hasAdminAccess) clearStoredAdminTokens();
    closeMobileMenu();
    if (isAuthenticated) {
      logoutUser();
    } else {
      router.replace(`/${locale}`);
      router.refresh();
    }
  };

  const headerTone = 'bg-canvas text-foreground';
  const linkTone = 'text-foreground hover:text-accent-strong hover:font-bold';
  const controlTone = '';
  const languageTone = '';

  return (
    <header className={cn(
      'top-0 z-50 border-b transition-colors duration-200 motion-reduce:transition-none',
      variant === 'overlay' || showFloating ? 'fixed inset-x-0' : 'relative',
      variant === 'solid' && showFloating && 'animate-navbar-drop-in',
      variant === 'solid' ? (showFloating ? 'border-border' : 'border-transparent') : 'border-border',
      headerTone,
    )}>
      <nav
        aria-label={nav('mainNavigation')}
        className="mx-auto flex h-[68px] max-w-screen-2xl items-center justify-between gap-3 px-4 sm:px-6 xl:h-[72px] xl:px-8"
      >
        <Link
          href={`/${locale}`}
          onClick={handleHomeClick}
          aria-label="AgriConnect"
          className="inline-flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          <Image
            src="/logo.png"
            alt="AgriConnect"
            width={450}
            height={150}
            priority
            className="h-11 w-[132px] object-contain sm:h-12 sm:w-[156px] xl:h-[52px] xl:w-[170px]"
          />
        </Link>

        <div className="hidden min-w-0 items-center gap-0.5 xl:flex">
          <Link
            href={`/${locale}`}
            onClick={handleHomeClick}
            aria-current={pathname === `/${locale}` ? 'page' : undefined}
            className={cn('rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus', linkTone, pathname === `/${locale}` && 'font-bold text-accent-strong')}
          >
            {nav('home')}
          </Link>

          <div className="flex items-center">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  aria-label={nav('marketplaceOptions')}
                  aria-current={isActive(pathname, locale, '/dashboard/marketplace') ? 'page' : undefined}
                  className={cn('inline-flex h-10 items-center gap-1 rounded-lg px-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus', linkTone, isActive(pathname, locale, '/dashboard/marketplace') && 'font-bold text-accent-strong')}
                >
                  {nav('marketplace')}
                  <ChevronDown aria-hidden="true" className="h-3.5 w-3.5" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content align="start" sideOffset={8} className="z-50 min-w-48 rounded-xl border border-border bg-surface p-1.5 text-foreground shadow-lg shadow-black/10">
                  <DropdownMenu.Item asChild>
                    <Link
                      href={`/${locale}/dashboard/marketplace`}
                      aria-current={isActive(pathname, locale, '/dashboard/marketplace') ? 'page' : undefined}
                      prefetch={false}
                      className="flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg px-3 text-sm outline-none transition-colors hover:bg-surface-subtle focus:bg-surface-subtle data-[highlighted]:bg-surface-subtle"
                    >
                      <List aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                      {nav('allListings')}
                    </Link>
                  </DropdownMenu.Item>
                  {isAuthenticated ? (
                    <DropdownMenu.Item asChild>
                      <Link
                        href={`/${locale}/dashboard/nearby-listings`}
                        aria-current={isActive(pathname, locale, '/dashboard/nearby-listings') ? 'page' : undefined}
                        prefetch={false}
                        className="flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg px-3 text-sm outline-none transition-colors hover:bg-surface-subtle focus:bg-surface-subtle data-[highlighted]:bg-surface-subtle"
                      >
                        <MapPin aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                        {nav('nearbyListings')}
                      </Link>
                    </DropdownMenu.Item>
                  ) : null}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>

          <Link
            href={`/${locale}${NAV_ITEMS[1].path}`}
            aria-current={isActive(pathname, locale, NAV_ITEMS[1].path) ? 'page' : undefined}
            prefetch={false}
            className={cn('rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus', linkTone, isActive(pathname, locale, NAV_ITEMS[1].path) && 'font-bold text-accent-strong')}
          >
            {nav('buyerRequirements')}
          </Link>
          <Link
            href={`/${locale}${NAV_ITEMS[2].path}`}
            aria-current={isActive(pathname, locale, NAV_ITEMS[2].path) ? 'page' : undefined}
            prefetch={false}
            className={cn('rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus', linkTone, isActive(pathname, locale, NAV_ITEMS[2].path) && 'font-bold text-accent-strong')}
          >
            {nav('marketPrices')}
          </Link>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className={cn('inline-flex h-10 items-center gap-1 rounded-lg px-2.5 text-sm font-semibold transition-colors hover:text-accent-strong hover:font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus', linkTone, RESOURCE_ITEMS.some(({ path }) => isActive(pathname, locale, path)) && 'font-bold text-accent-strong')}
              >
                {nav('farmerResources')}
                <ChevronDown aria-hidden="true" className="h-4 w-4" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content align="start" sideOffset={8} className="z-50 min-w-56 rounded-xl border border-border bg-surface p-1.5 text-foreground shadow-xl shadow-black/10">
                {RESOURCE_ITEMS.map(({ path, key }) => (
                  <DropdownMenu.Item key={key} asChild>
                    <Link href={`/${locale}${path}`} aria-current={isActive(pathname, locale, path) ? 'page' : undefined} prefetch={false} className="flex min-h-10 cursor-pointer items-center rounded-lg px-3 text-sm outline-none transition-colors hover:bg-surface-subtle focus:bg-surface-subtle">
                      {nav(key)}
                    </Link>
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          <Link
            href={`/${locale}${NAV_ITEMS[3].path}`}
            aria-current={isActive(pathname, locale, NAV_ITEMS[3].path) ? 'page' : undefined}
            prefetch={false}
            className={cn('rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus', linkTone, isActive(pathname, locale, NAV_ITEMS[3].path) && 'font-bold text-accent-strong')}
          >
            {nav('transport')}
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="hidden xl:block">
            <LanguageSwitcher compact className={languageTone} />
          </div>
          <ThemeToggle className={controlTone} />
          {showNotifications && isAuthenticated ? <NotificationPanel /> : null}

          {isSignedIn ? (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  aria-label={account('menuLabel')}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-transparent px-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  <UserRound aria-hidden="true" className="h-[18px] w-[18px]" />
                  <span className="hidden max-w-28 truncate 2xl:inline">{userName || account('menuLabel')}</span>
                  <ChevronDown aria-hidden="true" className="hidden h-4 w-4 2xl:inline" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content align="end" sideOffset={8} className="z-50 min-w-60 rounded-xl border border-border bg-surface p-1.5 text-foreground shadow-xl shadow-black/10">
                  {isAuthenticated ? (
                    <>
                      <AccountLink href={dashboardHref} icon={<LayoutDashboard className="h-4 w-4 text-accent" />} label={account('dashboard')} onSelect={closeMobileMenu} />
                      <AccountLink href={`/${locale}/dashboard/my-listings`} icon={<Package className="h-4 w-4 text-accent" />} label={account('myListings')} onSelect={closeMobileMenu} />
                      <AccountLink href={`/${locale}/dashboard/buyer-requirements?view=mine`} icon={<ClipboardList className="h-4 w-4 text-accent" />} label={account('myRequirements')} onSelect={closeMobileMenu} />
                      <AccountLink href={`/${locale}/dashboard/transport?view=mine`} icon={<Truck className="h-4 w-4 text-accent" />} label={account('myTransport')} onSelect={closeMobileMenu} />
                      <AccountLink href={`/${locale}/dashboard/profile`} icon={<UserRound className="h-4 w-4 text-accent" />} label={account('profile')} onSelect={closeMobileMenu} />
                    </>
                  ) : null}
                  {hasAdminAccess ? (
                    <AccountLink href={adminHref} icon={<LayoutDashboard className="h-4 w-4 text-accent" />} label={account('adminPanel')} onSelect={closeMobileMenu} />
                  ) : null}
                  <DropdownMenu.Separator className="my-1 h-px bg-border" />
                  <DropdownMenu.Item asChild>
                    <button type="button" onClick={logout} className="flex min-h-10 w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 text-left text-sm text-danger outline-none transition-colors hover:bg-danger-soft focus:bg-danger-soft">
                      <LogOut aria-hidden="true" className="h-4 w-4" />
                      {account('logout')}
                    </button>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          ) : (
            <div className="hidden items-center gap-1.5 xl:flex">
              <Link href={loginHref} prefetch={false} className="rounded-lg px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:font-bold hover:text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                {nav('login')}
              </Link>
              <Link href={loginHref} prefetch={false} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                {nav('getStarted')}
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          )}

          <button
            type="button"
            aria-label={mobileOpen ? nav('menuClose') : nav('menuOpen')}
            aria-expanded={mobileOpen}
            aria-controls="public-mobile-menu"
            onClick={() => setMobileOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus xl:hidden"
          >
            {mobileOpen ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {mobileOpen ? (
        <div id="public-mobile-menu" className="absolute inset-x-0 top-full max-h-[calc(100dvh-4.25rem)] overflow-y-auto border-t border-border bg-surface px-4 py-3 text-foreground shadow-xl xl:hidden">
          <div className="mx-auto max-w-screen-2xl">
            <nav aria-label={nav('mainNavigation')} className="grid gap-1">
              <MobileLink href={`/${locale}`} active={pathname === `/${locale}`} onClick={handleHomeClick}>{nav('home')}</MobileLink>
              <div className="flex items-center">
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button
                      type="button"
                      aria-label={nav('marketplaceOptions')}
                      aria-current={isActive(pathname, locale, '/dashboard/marketplace') ? 'page' : undefined}
                      className={cn('inline-flex min-h-11 flex-1 items-center justify-between gap-2 rounded-lg px-3 text-left text-sm font-semibold transition-colors hover:font-bold hover:text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus', isActive(pathname, locale, '/dashboard/marketplace') ? 'font-bold text-accent-strong' : 'text-foreground')}
                    >
                      {nav('marketplace')}
                      <ChevronDown aria-hidden="true" className="h-4 w-4" />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content align="start" sideOffset={6} className="z-50 min-w-48 rounded-xl border border-border bg-surface p-1.5 text-foreground shadow-lg shadow-black/10">
                      <DropdownMenu.Item asChild>
                        <Link href={`/${locale}/dashboard/marketplace`} aria-current={isActive(pathname, locale, '/dashboard/marketplace') ? 'page' : undefined} prefetch={false} onClick={closeMobileMenu} className="flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg px-3 text-sm outline-none transition-colors hover:bg-surface-subtle focus:bg-surface-subtle data-[highlighted]:bg-surface-subtle">
                          <List aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                          {nav('allListings')}
                        </Link>
                      </DropdownMenu.Item>
                      {isAuthenticated ? (
                        <DropdownMenu.Item asChild>
                          <Link href={`/${locale}/dashboard/nearby-listings`} aria-current={isActive(pathname, locale, '/dashboard/nearby-listings') ? 'page' : undefined} prefetch={false} onClick={closeMobileMenu} className="flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg px-3 text-sm outline-none transition-colors hover:bg-surface-subtle focus:bg-surface-subtle data-[highlighted]:bg-surface-subtle">
                            <MapPin aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                            {nav('nearbyListings')}
                          </Link>
                        </DropdownMenu.Item>
                      ) : null}
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>
              <MobileLink href={`/${locale}/dashboard/buyer-requirements`} active={isActive(pathname, locale, '/dashboard/buyer-requirements')} onClick={closeMobileMenu}>{nav('buyerRequirements')}</MobileLink>
              <MobileLink href={`/${locale}/dashboard/market-prices`} active={isActive(pathname, locale, '/dashboard/market-prices')} onClick={closeMobileMenu}>{nav('marketPrices')}</MobileLink>
              <details className="group rounded-lg">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-lg px-3 text-sm font-semibold text-foreground transition-colors hover:font-bold hover:text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus [&::-webkit-details-marker]:hidden">
                  {nav('farmerResources')}
                  <ChevronDown aria-hidden="true" className="h-4 w-4 transition-transform group-open:rotate-180 motion-reduce:transition-none" />
                </summary>
                <div className="ml-3 border-l border-border pl-2">
                  {RESOURCE_ITEMS.map(({ path, key }) => (
                    <MobileLink key={key} nested href={`/${locale}${path}`} active={isActive(pathname, locale, path)} onClick={closeMobileMenu}>{nav(key)}</MobileLink>
                  ))}
                </div>
              </details>
              <MobileLink href={`/${locale}/dashboard/transport`} active={isActive(pathname, locale, '/dashboard/transport')} onClick={closeMobileMenu}>{nav('transport')}</MobileLink>
            </nav>

            {isSignedIn ? (
              <div className="mt-3 border-t border-border pt-3">
                <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{userName || account('menuLabel')}</p>
                <div className="grid gap-1">
                  {isAuthenticated ? (
                    <>
                      <MobileLink href={dashboardHref} onClick={closeMobileMenu}>{account('dashboard')}</MobileLink>
                      <MobileLink href={`/${locale}/dashboard/my-listings`} onClick={closeMobileMenu}>{account('myListings')}</MobileLink>
                      <MobileLink href={`/${locale}/dashboard/buyer-requirements?view=mine`} onClick={closeMobileMenu}>{account('myRequirements')}</MobileLink>
                      <MobileLink href={`/${locale}/dashboard/transport?view=mine`} onClick={closeMobileMenu}>{account('myTransport')}</MobileLink>
                      <MobileLink href={`/${locale}/dashboard/profile`} onClick={closeMobileMenu}>{account('profile')}</MobileLink>
                    </>
                  ) : null}
                  {hasAdminAccess ? <MobileLink href={adminHref} onClick={closeMobileMenu}>{account('adminPanel')}</MobileLink> : null}
                  <button type="button" onClick={logout} className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-left text-sm font-semibold text-danger hover:bg-danger-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                    <LogOut aria-hidden="true" className="h-4 w-4" />
                    {account('logout')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3 xl:hidden">
                <Link href={loginHref} prefetch={false} onClick={closeMobileMenu} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                  {nav('login')}
                </Link>
                <Link href={loginHref} prefetch={false} onClick={closeMobileMenu} className="inline-flex min-h-11 items-center justify-center gap-1 rounded-lg bg-accent px-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                  {nav('getStarted')}<ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </div>
            )}

            <div className="mt-3 flex items-center gap-2 border-t border-border pt-3 xl:hidden">
              <LanguageSwitcher compact />
              <span className="text-sm text-muted-foreground">{t('nav.selectLanguage')}</span>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function AccountLink({
  href,
  icon,
  label,
  onSelect,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onSelect: () => void;
}) {
  return (
    <DropdownMenu.Item asChild>
      <Link href={href} prefetch={false} onClick={onSelect} className="flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg px-3 text-sm text-foreground outline-none transition-colors hover:bg-surface-subtle focus:bg-surface-subtle">
        {icon}
        {label}
      </Link>
    </DropdownMenu.Item>
  );
}

function MobileLink({
  href,
  active = false,
  nested = false,
  onClick,
  children,
}: {
  href: string;
  active?: boolean;
  nested?: boolean;
  onClick: (event: MouseEvent<HTMLAnchorElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex min-h-11 items-center rounded-lg text-sm font-semibold transition-colors hover:font-bold hover:text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
        nested ? 'px-3 text-muted-foreground' : 'px-3 text-foreground',
        active && 'font-bold text-accent-strong',
      )}
    >
      {children}
    </Link>
  );
}
