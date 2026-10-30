'use client';

import { AdaptiveLink as Link } from '@/components/performance/adaptive-link';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Sprout, Mail, MapPin, Phone } from 'lucide-react';
import { LanguageSwitcher } from '@/components/auth/language-switcher';

const QUICK_LINKS = [
    { id: 'home', labelKey: 'nav.home' },
    { id: 'marketplace', labelKey: 'nav.marketplace' },
    { id: 'features', labelKey: 'nav.features' },
    { id: 'faq', labelKey: 'nav.faq' },
] as const;

export function Footer({ compact = false }: { compact?: boolean }) {
    const t = useTranslations();
    const locale = useLocale();
    const pathname = usePathname();
    const router = useRouter();
    const year = new Date().getFullYear();

    if (compact) {
        return (
            <footer className="border-t border-border bg-surface">
                <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 px-4 py-4 text-center sm:flex-row sm:px-6 sm:text-left lg:px-8">
                    <p className="text-xs text-muted-foreground">
                        © {year} AgriConnect. {t('footer.copyright')}
                    </p>
                    <div className="flex items-center gap-5 text-xs text-muted-foreground">
                        <Link href={`/${locale}/dashboard/privacy-policy`} className="transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                            {t('footer.privacy')}
                        </Link>
                        <Link href={`/${locale}/dashboard/terms`} className="transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                            {t('footer.terms')}
                        </Link>
                    </div>
                </div>
            </footer>
        );
    }

    const scrollTo = (id: string) => {
        if (pathname !== `/${locale}`) {
            router.push(`/${locale}#${id}`);
            return;
        }
        if (id === 'home') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <footer className="relative border-t border-border bg-surface">
            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
                <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.4fr_0.8fr_0.8fr_1fr]">
                    {/* Brand */}
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div
                                className="flex h-10 w-10 items-center justify-center rounded-xl"
                                style={{
                                    background: 'linear-gradient(135deg, #2E7D32, #1B5E20)',
                                    boxShadow: '0 4px 12px rgba(46,125,50,0.35)',
                                }}
                            >
                                <Sprout className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-black tracking-tight text-foreground">AgriConnect</span>
                        </div>
                        <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
                            {t('footer.tagline')}
                        </p>
                    </div>

                    {/* Quick links */}
                    <nav aria-label={t('footer.quickLinks')}>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                            {t('footer.quickLinks')}
                        </h3>
                        <ul className="mt-4 space-y-2.5">
                            {QUICK_LINKS.map((link) => (
                                <li key={link.id}>
                                    <button
                                        onClick={() => scrollTo(link.id)}
                                        className="text-sm font-medium text-muted-foreground transition-colors hover:text-accent"
                                    >
                                        {t(link.labelKey)}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Resources */}
                    <nav aria-label={t('footer.resources')}>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                            {t('footer.resources')}
                        </h3>
                        <ul className="mt-4 space-y-2.5">
                            <li>
                                <button onClick={() => scrollTo('how')} className="text-sm font-medium text-muted-foreground transition-colors hover:text-accent">
                                    {t('footer.link.how')}
                                </button>
                            </li>
                            <li>
                                <Link href={`/${locale}/dashboard/market-prices`} className="text-sm font-medium text-muted-foreground transition-colors hover:text-accent">
                                    {t('nav.marketPrices')}
                                </Link>
                            </li>
                            <li>
                                <Link href={`/${locale}/dashboard/crop-guide`} className="text-sm font-medium text-muted-foreground transition-colors hover:text-accent">
                                    {t('landingPage.nav.cropGuide')}
                                </Link>
                            </li>
                            <li>
                                <button onClick={() => scrollTo('cta')} className="text-sm font-medium text-muted-foreground transition-colors hover:text-accent">
                                    {t('footer.link.cta')}
                                </button>
                            </li>
                        </ul>
                    </nav>

                    {/* Contact */}
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                            {t('footer.contact')}
                        </h3>
                        <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                            <li className="flex items-start gap-3">
                                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                                <a href="mailto:support@agriconnect.in" className="transition-colors hover:text-accent">
                                    support@agriconnect.in
                                </a>
                            </li>
                            <li className="flex items-start gap-3">
                                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                                <a href="tel:+918456789012" className="transition-colors hover:text-accent">
                                    +91 84567 89012
                                </a>
                            </li>
                            <li className="flex items-start gap-3">
                                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                                <span>{t('footer.address')}</span>
                            </li>
                        </ul>

                        <div className="mt-6">
                            <p className="mb-2 text-xs font-semibold text-muted-foreground">{t('footer.chooseLanguage')}</p>
                            <LanguageSwitcher
                                className="[&_button]:bg-surface [&_button]:text-foreground [&_button]:border [&_button]:border-border"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
                    <p className="text-xs text-muted-foreground">
                        © {year} AgriConnect. {t('footer.copyright')}
                    </p>
                    <div className="flex items-center gap-6 text-xs text-muted-foreground">
                        <Link href={`/${locale}/dashboard/privacy-policy`} className="transition-colors hover:text-accent">
                            {t('footer.privacy')}
                        </Link>
                        <Link href={`/${locale}/dashboard/terms`} className="transition-colors hover:text-accent">
                            {t('footer.terms')}
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
