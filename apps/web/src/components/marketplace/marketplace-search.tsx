'use client';

import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface MarketplaceSearchProps {
    value: string;
    onChange: (value: string) => void;
}

/**
 * Full-width search input. Frontend filtering only.
 * Mobile-first: large touch target, accessible label, keyboard friendly,
 * compact, clearable, and keyboard accessible.
 */
export function MarketplaceSearch({ value, onChange }: MarketplaceSearchProps) {
    const t = useTranslations();

    return (
        <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
                type="search"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={t('dashboard.marketplaceBrowse.ux.searchPlaceholder')}
                aria-label={t('dashboard.marketplaceBrowse.search.label')}
                className="h-11 w-full rounded-xl border border-border bg-surface-subtle pl-11 pr-11 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-focus/50 focus:bg-surface"
            />
            {value && (
                <button
                    type="button"
                    onClick={() => onChange('')}
                    aria-label={t('dashboard.marketplaceBrowse.search.clear')}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}
