'use client';

import { Search, X, Mic } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface MarketplaceSearchProps {
    value: string;
    onChange: (value: string) => void;
}

/**
 * Full-width search input. Frontend filtering only.
 * Mobile-first: large touch target, accessible label, keyboard friendly,
 * clearable, and reserves a spot for future Voice Search.
 */
export function MarketplaceSearch({ value, onChange }: MarketplaceSearchProps) {
    const t = useTranslations();

    return (
        <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
            <input
                type="search"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={t('dashboard.marketplaceBrowse.ux.searchPlaceholder')}
                aria-label={t('dashboard.marketplaceBrowse.search.label')}
                className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 pl-12 pr-24 text-base text-white placeholder:text-white/40 outline-none backdrop-blur-xl transition-colors focus:border-green-400/50 focus:bg-white/10"
            />
            {value && (
                <button
                    type="button"
                    onClick={() => onChange('')}
                    aria-label={t('dashboard.marketplaceBrowse.search.clear')}
                    className="absolute right-12 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
            {/* Voice Search placeholder — reserved space for a future feature. */}
            <button
                type="button"
                aria-label={t('dashboard.marketplaceBrowse.search.voice')}
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-green-300"
            >
                <Mic className="h-4 w-4" />
            </button>
        </div>
    );
}
