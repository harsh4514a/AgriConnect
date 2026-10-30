'use client';

import { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { type Locale, type Messages, isLocale } from './config';
import { setClientLocale } from './client';
import { storeLocale } from './persist';

type LocaleContextValue = {
    locale: Locale;
    setLocale: (locale: Locale) => void;
};

const THEME_STORAGE_KEY = 'agriconnect_theme';

function preserveActiveTheme(): void {
    if (typeof window === 'undefined') return;

    const activeTheme = document.documentElement.dataset.theme;
    if (activeTheme !== 'light' && activeTheme !== 'dark') return;

    try {
        window.localStorage.setItem(THEME_STORAGE_KEY, activeTheme);
    } catch {
        // Keep the in-memory theme if storage is unavailable.
    }
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
    children,
    initialLocale,
    initialMessages,
}: {
    children: React.ReactNode;
    initialLocale: Locale;
    initialMessages: Messages;
}) {
    const [locale, setLocaleState] = useState<Locale>(initialLocale);
    const [currentMessages, setCurrentMessages] = useState<Messages>(initialMessages);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        setLocaleState(initialLocale);
        setCurrentMessages(initialMessages);
        setClientLocale(initialLocale, initialMessages);
        document.documentElement.lang = initialLocale;
    }, [initialLocale, initialMessages]);

    // Keep the non-React client translator (axios) in sync.
    if (typeof window !== 'undefined') setClientLocale(locale, currentMessages);

    const setLocale = useCallback((nextLocale: Locale) => {
        storeLocale(nextLocale);
        preserveActiveTheme();

        const firstSegment = pathname.split('/').filter(Boolean)[0];
        const currentPathLocale = isLocale(firstSegment) ? firstSegment : null;
        const localizedPath = currentPathLocale
            ? `/${nextLocale}${pathname.slice(currentPathLocale.length + 1)}`
            : `/${nextLocale}${pathname === '/' ? '' : pathname}`;

        if (currentPathLocale === nextLocale) {
            setLocaleState(nextLocale);
            setClientLocale(nextLocale, currentMessages);
            document.documentElement.lang = nextLocale;
            return;
        }

        const search = typeof window === 'undefined' ? '' : window.location.search;
        router.replace(`${localizedPath}${search}`, { scroll: false });
    }, [currentMessages, pathname, router]);

    const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

    return (
        <LocaleContext.Provider value={value}>
            <NextIntlClientProvider
                locale={locale}
                messages={currentMessages}
                timeZone="Asia/Kolkata"
            >
                {children}
            </NextIntlClientProvider>
        </LocaleContext.Provider>
    );
}

export function useLocaleContext(): LocaleContextValue {
    const context = useContext(LocaleContext);
    if (!context) {
        throw new Error('useLocaleContext must be used within a LocaleProvider');
    }
    return context;
}

export function useLocale(): Locale {
    return useLocaleContext().locale;
}

export function useSetLocale() {
    return useLocaleContext().setLocale;
}
