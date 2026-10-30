'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/utils/cn';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    /** Total number of items currently displayed. */
    totalItems: number;
    /** Items per page (12). */
    pageSize: number;
}

/**
 * Client-side pagination. Shows page numbers with prev/next controls.
 * Accessible with proper aria-labels and keyboard support.
 */
export function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    pageSize,
}: PaginationProps) {
    const t = useTranslations();

    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
                {t('dashboard.marketplaceBrowse.pagination.showing')}{' '}
                <span className="font-semibold text-foreground">{startItem}</span>{' '}
                {t('dashboard.marketplaceBrowse.pagination.of')}{' '}
                <span className="font-semibold text-foreground">{endItem}</span>{' '}
                {t('dashboard.marketplaceBrowse.filters.results')}
            </p>

            <nav
                aria-label={t('dashboard.marketplaceBrowse.filters.label')}
                className="flex items-center gap-1"
            >
                <button
                    type="button"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label={t('dashboard.marketplaceBrowse.pagination.previous')}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-subtle text-foreground transition-colors hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>

                {pages.map((page) => (
                    <button
                        key={page}
                        type="button"
                        onClick={() => onPageChange(page)}
                        aria-current={page === currentPage ? 'page' : undefined}
                        aria-label={`${t('dashboard.marketplaceBrowse.pagination.page')} ${page}`}
                        className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-xl text-sm font-medium transition-colors',
                            page === currentPage
                                ? 'bg-accent text-accent-foreground shadow-sm'
                                : 'border border-border bg-surface-subtle text-muted-foreground hover:bg-surface-subtle',
                        )}
                    >
                        {page}
                    </button>
                ))}

                <button
                    type="button"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label={t('dashboard.marketplaceBrowse.pagination.next')}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-subtle text-foreground transition-colors hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </nav>
        </div>
    );
}
