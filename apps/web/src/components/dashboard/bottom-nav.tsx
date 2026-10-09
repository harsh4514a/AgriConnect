'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Store, Plus, Package, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';

/**
 * Mobile bottom navigation bar (shown only below `lg`).
 *
 * The center "Sell" button is the raised primary action — it must remain the
 * single most prominent action on mobile and never compete with other tabs.
 * Desktop continues to use the sidebar instead.
 */
export function BottomNav() {
    const t = useTranslations();
    const pathname = usePathname();
    const params = useParams();
    const locale = (params?.locale as string) || 'en';
    const [showPulse, setShowPulse] = useState(false);

    useEffect(() => {
        // Subtle pulse ONLY on the user's first visit (first session).
        try {
            const key = 'agriconnect_sell_pulse_seen';
            if (!localStorage.getItem(key)) {
                setShowPulse(true);
                localStorage.setItem(key, '1');
            }
        } catch {
            // localStorage unavailable — skip pulse.
        }
    }, []);

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === `/${locale}/dashboard`;
        return pathname.startsWith(`/${locale}${href}`);
    };

    const items = [
        { key: 'home', label: t('dashboard.mobile.bottomNav.home'), href: '/dashboard', icon: Home },
        { key: 'marketplace', label: t('dashboard.mobile.bottomNav.marketplace'), href: '/dashboard/marketplace', icon: Store },
        { key: 'sell', label: t('dashboard.mobile.bottomNav.sell'), href: '/dashboard/marketplace/create', icon: Plus, primary: true },
        { key: 'listings', label: t('dashboard.mobile.bottomNav.listings'), href: '/dashboard/my-listings', icon: Package },
        { key: 'profile', label: t('dashboard.mobile.bottomNav.profile'), href: '/dashboard/profile', icon: User },
    ];

    return (
        <nav
            className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-green-950/95 backdrop-blur-2xl lg:hidden"
            aria-label={t('dashboard.mobile.bottomNav.label')}
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <div className="grid grid-cols-5 items-end">
                {items.map((item) => {
                    const Icon = item.icon;
                    const active = item.primary ? isActive(item.href) : isActive(item.href);

                    if (item.primary) {
                        return (
                            <div key={item.key} className="relative flex justify-center">
                                <motion.div
                                    initial={false}
                                    animate={{ y: active ? -2 : 0 }}
                                    className="relative -mt-7"
                                >
                                    <div className="relative">
                                        {/* Subtle pulse ring — only on first visit */}
                                        {showPulse && (
                                            <motion.span
                                                aria-hidden="true"
                                                className="absolute -inset-2 rounded-full"
                                                style={{
                                                    background: 'radial-gradient(circle, rgba(46,125,50,0.5), transparent 70%)',
                                                }}
                                                animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
                                                transition={{ duration: 1.8, repeat: 3, repeatDelay: 0.4 }}
                                            />
                                        )}
                                        <Link
                                            href={`/${locale}${item.href}`}
                                            prefetch={true}
                                            aria-label={item.label}
                                            className="relative flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg transition-transform active:scale-95"
                                            style={{
                                                background: 'linear-gradient(135deg, #2E7D32, #1B5E20)',
                                                boxShadow: '0 6px 20px rgba(46,125,50,0.5)',
                                            }}
                                        >
                                            <Icon className="h-7 w-7" />
                                        </Link>
                                    </div>
                                </motion.div>
                                <span className="pointer-events-none absolute bottom-2 text-[10px] font-semibold text-white/80">
                                    {item.label}
                                </span>
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={item.key}
                            href={`/${locale}${item.href}`}
                            prefetch={true}
                            className={cn(
                                'flex min-h-[56px] flex-col items-center justify-center gap-1 py-2 transition-colors',
                                active ? 'text-green-300' : 'text-white/50 hover:text-white',
                            )}
                            aria-current={active ? 'page' : undefined}
                        >
                            <Icon className="h-5 w-5" />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
