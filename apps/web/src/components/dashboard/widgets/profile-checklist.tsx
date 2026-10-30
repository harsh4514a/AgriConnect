'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, UserRound, ArrowRight } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

/**
 * Replaces the "100% Profile" stat with a meaningful, action-oriented profile
 * checklist that guides the farmer toward completing their profile.
 */
export function ProfileChecklist() {
    const t = useTranslations();
    const router = useRouter();
    const params = useParams();
    const locale = (params?.locale as string) || 'en';

    const items = [
        { key: 'mobile', done: true, label: t('dashboard.profileChecklist.mobileVerified') },
        { key: 'address', done: true, label: t('dashboard.profileChecklist.addressAdded') },
        { key: 'farm', done: false, label: t('dashboard.profileChecklist.farmLocationMissing') },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -3 }}
            className="rounded-2xl border border-border bg-surface-subtle p-5 backdrop-blur-xl transition-shadow hover:shadow-xl hover:shadow-black/20"
        >
            <p className="text-sm font-semibold text-foreground">{t('dashboard.profileChecklist.title')}</p>
            <ul className="mt-4 space-y-2.5">
                {items.map((item) => (
                    <li key={item.key} className="flex items-center gap-2.5">
                        {item.done ? (
                            <CheckCircle2 className="h-5 w-5 shrink-0 text-accent" />
                        ) : (
                            <XCircle className="h-5 w-5 shrink-0 text-warning" />
                        )}
                        <span className={`text-sm ${item.done ? 'text-foreground' : 'font-medium text-foreground'}`}> {item.label} </span> </li> ))} </ul> <button onClick={() => router.push(`/${locale}/dashboard/profile`)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm font-semibold text-accent transition-all hover:bg-accent/10"
            >
                {t('dashboard.profileChecklist.completeProfile')}
                <ArrowRight className="h-4 w-4" />
            </button>
            <p className="mt-2 text-[11px] text-muted-foreground">
                {t('dashboard.profileChecklist.completeProfileDesc')}
            </p>
        </motion.div>
    );
}
