'use client';

import { useTranslations } from 'next-intl';

export default function NotFound() {
    const t = useTranslations();

    return (
        <main className="mx-auto max-w-2xl px-6 py-16">
            <h1 className="text-2xl font-semibold">{t('notFound.title')}</h1>
            <p className="mt-2 text-muted-foreground">{t('notFound.desc')}</p>
        </main>
    );
}

