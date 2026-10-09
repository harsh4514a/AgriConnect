'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sprout, ArrowRight, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { useLocale } from '@/i18n/locale-provider';
import { LanguageSwitcher } from '@/components/auth/language-switcher';
import { hasUsableSession, clearStoredTokens } from '@/services/api/token';
import { NAV_LINKS } from './data';

interface NavbarProps {
    onLogin: () => void;
    onGetStarted: () => void;
}

export function Navbar({ onLogin, onGetStarted }: NavbarProps) {
    const t = useTranslations();
    const router = useRouter();
    const params = useParams();
    const locale = (params?.locale as string) || 'en';
    const emoji = useLocale(); // keep locale reactive; used by switcher
    void emoji;

    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    // Initial auth state + react to login/logout changes.
    useEffect(() => {
        setIsLoggedIn(hasUsableSession());

        const onStorage = () => setIsLoggedIn(hasUsableSession());
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    // Close profile menu when clicking outside.
    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, []);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const handleLogout = () => {
        clearStoredTokens();
        setIsLoggedIn(false);
        setProfileOpen(false);
        setMobileOpen(false);
        router.push(`/${locale}`);
        router.refresh();
    };

    const scrollTo = (id: string) => {
        setMobileOpen(false);
        if (id === 'home') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        const el = document.getElementById(id);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <motion.header
            initial={{ y: -24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={[
                'fixed inset-x-0 top-0 z-50 transition-all duration-300',
                scrolled
                    ? 'bg-white/85 backdrop-blur-xl shadow-lg shadow-black/[0.04] border-b border-white/40'
                    : 'bg-transparent',
            ].join(' ')}
        >
            <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Logo */}
                <button
                    onClick={() => scrollTo('home')}
                    className="flex items-center gap-2.5"
                    aria-label={t('common.appName')}
                >
                    <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{
                            background: 'linear-gradient(135deg, #2E7D32, #1B5E20)',
                            boxShadow: '0 4px 12px rgba(46,125,50,0.35)',
                        }}
                    >
                        <Sprout className="h-5 w-5 text-white" />
                    </div>
                    <span
                        className={`text-xl font-black tracking-tight transition-colors duration-300 ${scrolled ? 'text-gray-900' : 'text-white'
                            }`}
                    >
                        AgriConnect
                    </span>
                </button>

                {/* Center links — desktop */}
                <div className="hidden items-center gap-1 lg:flex">
                    {NAV_LINKS.map((link) => (
                        <button
                            key={link.id}
                            onClick={() => scrollTo(link.id)}
                            className={[
                                'rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200',
                                scrolled
                                    ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    : 'text-white/80 hover:bg-white/10 hover:text-white',
                            ].join(' ')}
                        >
                            {t(link.labelKey)}
                        </button>
                    ))}
                </div>

                {/* Right actions */}
                <div className="flex items-center gap-2 sm:gap-3">
                    <LanguageSwitcher
                        className={
                            scrolled
                                ? '[&_button]:text-gray-700 [&_button]:hover:bg-gray-100'
                                : '[&_button]:text-gray-700 [&_button]:hover:bg-gray/100'
                        }
                    />

                    {isLoggedIn ? (
                        <div className="relative" ref={profileRef}>
                            <button
                                onClick={() => setProfileOpen((v) => !v)}
                                aria-label={t('nav.profile')}
                                aria-expanded={profileOpen}
                                className={[
                                    'inline-flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200',
                                    scrolled
                                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        : 'bg-white/10 text-white hover:bg-white/20',
                                ].join(' ')}
                            >
                                <User className="h-5 w-5" />
                            </button>

                            <AnimatePresence>
                                {profileOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -6, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -6, scale: 0.95 }}
                                        transition={{ duration: 0.12, ease: 'easeOut' }}
                                        className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-2xl border border-white/15 bg-green-950/95 p-1 shadow-2xl shadow-black/40 backdrop-blur-2xl z-50"
                                    >
                                        <div className="px-3.5 py-3 border-b border-white/10">
                                            <p className="text-sm font-semibold text-white">{t('nav.profile')}</p>
                                            <p className="text-[11px] text-white/50 mt-0.5">{t('common.appName')}</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setProfileOpen(false);
                                                router.push(`/${locale}/dashboard`);
                                            }}
                                            className="w-full flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                                        >
                                            <LayoutDashboard className="h-4 w-4 text-green-300" />
                                            {t('nav.dashboard')}
                                        </button>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm text-red-300 transition-colors hover:bg-red-500/10"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            {t('nav.logout')}
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={onLogin}
                                className={[
                                    'hidden rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 sm:inline-flex items-center',
                                    scrolled
                                        ? 'text-gray-700 hover:bg-gray-100'
                                        : 'text-white hover:bg-white/10',
                                ].join(' ')}
                            >
                                {t('nav.login')}
                            </button>

                            <button
                                onClick={onGetStarted}
                                className="hidden items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:inline-flex"
                                style={{
                                    background: 'linear-gradient(135deg, #2E7D32, #1B5E20)',
                                    boxShadow: '0 4px 14px rgba(46,125,50,0.3)',
                                }}
                            >
                                {t('nav.getStarted')}
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </>
                    )}

                    {/* Mobile hamburger */}
                    <button
                        onClick={() => setMobileOpen((v) => !v)}
                        className={[
                            'inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors lg:hidden',
                            scrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10',
                        ].join(' ')}
                        aria-label={mobileOpen ? t('nav.closeMenu') : t('nav.openMenu')}
                        aria-expanded={mobileOpen}
                    >
                        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>
            </nav>

            {/* Mobile menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="overflow-hidden border-t border-white/60 bg-white/95 backdrop-blur-xl lg:hidden"
                    >
                        <div className="space-y-1 px-4 py-4">
                            {NAV_LINKS.map((link) => (
                                <button
                                    key={link.id}
                                    onClick={() => scrollTo(link.id)}
                                    className="block w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                                >
                                    {t(link.labelKey)}
                                </button>
                            ))}
                            <div className="flex gap-3 pt-3">
                                {isLoggedIn ? (
                                    <>
                                        <button
                                            onClick={() => {
                                                setMobileOpen(false);
                                                router.push(`/${locale}/dashboard`);
                                            }}
                                            className="flex-1 rounded-xl border-2 border-gray-200 px-4 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
                                        >
                                            {t('nav.profile')}
                                        </button>
                                        <button
                                            onClick={handleLogout}
                                            className="flex-1 rounded-xl border-2 border-red-200 px-4 py-3 text-sm font-bold text-red-600 transition-colors hover:bg-red-50"
                                        >
                                            {t('nav.logout')}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => {
                                                setMobileOpen(false);
                                                onLogin();
                                            }}
                                            className="flex-1 rounded-xl border-2 border-gray-200 px-4 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
                                        >
                                            {t('nav.login')}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setMobileOpen(false);
                                                onGetStarted();
                                            }}
                                            className="flex-1 rounded-xl px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
                                            style={{
                                                background: 'linear-gradient(135deg, #2E7D32, #1B5E20)',
                                            }}
                                        >
                                            {t('nav.getStarted')}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.header>
    );
}

