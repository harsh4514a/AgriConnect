'use client';

import { useTranslations } from 'next-intl';
import { Sprout, Mail, MapPin, Phone, Globe, MessageCircle, Video, Camera } from 'lucide-react';
import { LanguageSwitcher } from '@/components/auth/language-switcher';

const SOCIALS = [
    { id: 'facebook', icon: Globe, labelKey: 'footer.facebook' },
    { id: 'instagram', icon: Camera, labelKey: 'footer.instagram' },
    { id: 'twitter', icon: MessageCircle, labelKey: 'footer.twitter' },
    { id: 'youtube', icon: Video, labelKey: 'footer.youtube' },
] as const;

const QUICK_LINKS = [
    { id: 'home', labelKey: 'nav.home' },
    { id: 'marketplace', labelKey: 'nav.marketplace' },
    { id: 'features', labelKey: 'nav.features' },
    { id: 'faq', labelKey: 'nav.faq' },
] as const;

export function Footer() {
    const t = useTranslations();
    const year = new Date().getFullYear();

    const scrollTo = (id: string) => {
        if (id === 'home') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <footer className="relative border-t border-gray-100 bg-white">
            <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
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
                            <span className="text-xl font-black tracking-tight text-gray-900">AgriConnect</span>
                        </div>
                        <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-500">
                            {t('footer.tagline')}
                        </p>
                        <div className="mt-5 flex items-center gap-3">
                            {SOCIALS.map((social) => {
                                const Icon = social.icon;
                                return (
                                    <a
                                        key={social.id}
                                        href="#"
                                        onClick={(e) => e.preventDefault()}
                                        aria-label={t(social.labelKey)}
                                        className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-600 hover:text-white"
                                    >
                                        <Icon className="h-4.5 w-4.5" />
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                    {/* Quick links */}
                    <nav aria-label={t('footer.quickLinks')}>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
                            {t('footer.quickLinks')}
                        </h3>
                        <ul className="mt-4 space-y-2.5">
                            {QUICK_LINKS.map((link) => (
                                <li key={link.id}>
                                    <button
                                        onClick={() => scrollTo(link.id)}
                                        className="text-sm font-medium text-gray-500 transition-colors hover:text-green-700"
                                    >
                                        {t(link.labelKey)}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Resources */}
                    <nav aria-label={t('footer.resources')}>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
                            {t('footer.resources')}
                        </h3>
                        <ul className="mt-4 space-y-2.5">
                            {['how', 'testimonials', 'cta'].map((id) => (
                                <li key={id}>
                                    <button
                                        onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}
                                        className="text-sm font-medium text-gray-500 transition-colors hover:text-green-700"
                                    >
                                        {t(`footer.link.${id}`)}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Contact */}
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
                            {t('footer.contact')}
                        </h3>
                        <ul className="mt-4 space-y-3 text-sm text-gray-500">
                            <li className="flex items-start gap-3">
                                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                                <a href="mailto:support@agriconnect.in" className="transition-colors hover:text-green-700">
                                    support@agriconnect.in
                                </a>
                            </li>
                            <li className="flex items-start gap-3">
                                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                                <a href="tel:+918456789012" className="transition-colors hover:text-green-700">
                                    +91 84567 89012
                                </a>
                            </li>
                            <li className="flex items-start gap-3">
                                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                                <span>{t('footer.address')}</span>
                            </li>
                        </ul>

                        <div className="mt-6">
                            <p className="mb-2 text-xs font-semibold text-gray-400">{t('footer.chooseLanguage')}</p>
                            <LanguageSwitcher
                                className="[&_button]:bg-gray-50 [&_button]:text-gray-700 [&_button]:border [&_button]:border-gray-200"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-8 sm:flex-row">
                    <p className="text-xs text-gray-400">
                        © {year} AgriConnect. {t('footer.copyright')}
                    </p>
                    <div className="flex items-center gap-6 text-xs text-gray-400">
                        <button onClick={(e) => e.preventDefault()} className="transition-colors hover:text-green-700">
                            {t('footer.privacy')}
                        </button>
                        <button onClick={(e) => e.preventDefault()} className="transition-colors hover:text-green-700">
                            {t('footer.terms')}
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
}
