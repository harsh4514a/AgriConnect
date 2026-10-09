'use client';

import { useState, useEffect } from 'react';
import { usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Sprout, X, ChevronsLeft, ChevronsRight, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DASHBOARD_NAV, DASHBOARD_NAV_GROUPS } from '@/constants/dashboard.constants';
import { cn } from '@/utils/cn';

interface SidebarProps {
    /** Desktop collapsed state (permanent sidebar). */
    collapsed: boolean;
    /** Toggle desktop collapse. */
    onToggleCollapse: () => void;
    /** Mobile drawer open state. */
    mobileOpen: boolean;
    /** Close the mobile drawer. */
    onMobileClose: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onMobileClose }: SidebarProps) {
    const t = useTranslations();
    const pathname = usePathname();
    const params = useParams();
    const locale = (params?.locale as string) || 'en';

    const [pendingHref, setPendingHref] = useState<string | null>(null);

    useEffect(() => {
        setPendingHref(null);
    }, [pathname]);

    const isActive = (href: string) => {
        if (href === '/dashboard') {
            return pathname === `/${locale}/dashboard`;
        }
        return pathname.startsWith(`/${locale}${href}`);
    };

    const inner = (
        <div className="flex h-full w-full flex-col">
            {/* Brand */}
            <div className={cn('flex h-16 items-center border-b border-white/10 px-4', collapsed && 'lg:justify-center lg:px-2')}>
                <Link
                    href={`/${locale}/dashboard`}
                    prefetch={true}
                    className="flex items-center gap-2.5"
                    aria-label={t('common.appName')}
                >
                    <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                        style={{
                            background: 'linear-gradient(135deg, #2E7D32, #1B5E20)',
                            boxShadow: '0 4px 12px rgba(46,125,50,0.35)',
                        }}
                    >
                        <Sprout className="h-5 w-5 text-white" />
                    </div>
                    {!collapsed && (
                        <span className="whitespace-nowrap text-lg font-black tracking-tight text-white">
                            AgriConnect
                        </span>
                    )}
                </Link>
            </div>

            {/* Nav */}
            <nav
                className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-thin"
                aria-label={t('dashboard.menu.sideNavLabel')}
            >
                {/* Standalone top item */}
                {DASHBOARD_NAV.filter((item) => !item.group).map((item) => {
                    const active = isActive(item.href);
                    const isPending = pendingHref === item.href && !active;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.key}
                            href={`/${locale}${item.href}`}
                            prefetch={true}
                            onClick={() => {
                                if (!active) setPendingHref(item.href);
                                onMobileClose();
                            }}
                            className={cn(
                                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                                collapsed && 'lg:justify-center lg:px-0',
                                active
                                    ? 'bg-white/15 text-white shadow-inner'
                                    : isPending
                                        ? 'bg-white/10 text-white animate-pulse'
                                        : 'text-white/60 hover:bg-white/10 hover:text-white',
                            )}
                            aria-current={active ? 'page' : undefined}
                            title={collapsed ? t(item.labelKey) : undefined}
                        >
                            {active && (
                                <motion.span
                                    layoutId="sidebar-active"
                                    className="absolute inset-y-0 left-0 my-auto h-6 w-1 rounded-r-full bg-green-400"
                                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                                />
                            )}
                            {isPending ? (
                                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-emerald-400" />
                            ) : (
                                <Icon
                                    className={cn(
                                        'h-5 w-5 shrink-0 transition-colors',
                                        active ? 'text-green-300' : 'text-white/50 group-hover:text-white',
                                    )}
                                />
                            )}
                            {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}
                        </Link>
                    );
                })}

                {/* Grouped sections */}
                {DASHBOARD_NAV_GROUPS.map((group) => {
                    const groupedItems = DASHBOARD_NAV.filter((item) => item.group === group.key);
                    if (groupedItems.length === 0) return null;
                    return (
                        <div key={group.key} className={cn('pt-3', collapsed && 'lg:pt-4')}>
                            {!collapsed && (
                                <p className="px-3 pb-2 text-[9px] font-bold uppercase tracking-widest text-white/25">
                                    {t(group.labelKey)}
                                </p>
                            )}
                            <div className="space-y-1">
                                {groupedItems.map((item) => {
                                    const active = isActive(item.href);
                                    const isPending = pendingHref === item.href && !active;
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.key}
                                            href={`/${locale}${item.href}`}
                                            prefetch={true}
                                            onClick={() => {
                                                if (!active) setPendingHref(item.href);
                                                onMobileClose();
                                            }}
                                            className={cn(
                                                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                                                collapsed && 'lg:justify-center lg:px-0',
                                                active
                                                    ? 'bg-white/15 text-white shadow-inner'
                                                    : isPending
                                                        ? 'bg-white/10 text-white animate-pulse'
                                                        : 'text-white/60 hover:bg-white/10 hover:text-white',
                                            )}
                                            aria-current={active ? 'page' : undefined}
                                            title={collapsed ? t(item.labelKey) : undefined}
                                        >
                                            {active && (
                                                <motion.span
                                                    layoutId="sidebar-active"
                                                    className="absolute inset-y-0 left-0 my-auto h-6 w-1 rounded-r-full bg-green-400"
                                                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                                                />
                                            )}
                                            {isPending ? (
                                                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-emerald-400" />
                                            ) : (
                                                <Icon
                                                    className={cn(
                                                        'h-5 w-5 shrink-0 transition-colors',
                                                        active ? 'text-green-300' : 'text-white/50 group-hover:text-white',
                                                    )}
                                                />
                                            )}
                                            {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* Collapse toggle (desktop only) */}
            <div className="hidden border-t border-white/10 p-3 lg:block">
                <button
                    onClick={onToggleCollapse}
                    className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label={collapsed ? t('dashboard.sidebar.expand') : t('dashboard.sidebar.collapse')}
                >
                    {collapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
                    {!collapsed && <span>{t('dashboard.sidebar.collapse')}</span>}
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop permanent sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: collapsed ? 76 : 264 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="sticky top-0 hidden h-screen shrink-0 overflow-hidden border-r border-white/10 bg-green-950/60 backdrop-blur-2xl lg:block"
            >
                {inner}
            </motion.aside>

            {/* Mobile drawer */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onMobileClose}
                            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                            aria-hidden="true"
                        />
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
                            className="fixed inset-y-0 left-0 z-50 w-[280px] overflow-hidden bg-green-950/95 backdrop-blur-2xl lg:hidden"
                            role="dialog"
                            aria-modal="true"
                            aria-label={t('dashboard.menu.label')}
                        >
                            <button
                                onClick={onMobileClose}
                                className="absolute right-3 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                                aria-label={t('dashboard.sidebar.close')}
                            >
                                <X className="h-5 w-5" />
                            </button>
                            {inner}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
