import { useTranslations } from 'next-intl';
import { FEATURES } from './data';

export function FeaturesSection() {
    const t = useTranslations();

    return (
        <section id="features" className="relative py-12 sm:py-14 lg:py-16">
            {/* ambient glow */}
            <div
                className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-accent-soft/60 blur-3xl"
                aria-hidden="true"
            />

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <span
                        data-home-reveal
                        data-home-reveal-order="0"
                        className="inline-block rounded-full bg-accent-soft px-4 py-1.5 text-sm font-bold text-accent"
                    >
                        {t('features.badge')}
                    </span>
                    <h2
                        data-home-reveal
                        data-home-reveal-order="1"
                        className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-4xl"
                    >
                        {t('features.title')}
                    </h2>
                    <p
                        data-home-reveal
                        data-home-reveal-order="2"
                        className="mt-3 text-lg leading-relaxed text-muted-foreground"
                    >
                        {t('features.subtitle')}
                    </p>
                </div>

                <div
                    data-home-reveal
                    data-home-reveal-order="3"
                    className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4"
                >
                    {FEATURES.map((feature) => {
                        const Icon = feature.icon;
                        const large = feature.className?.includes('row-span-2');
                        return (
                            <div
                                key={feature.titleKey}
                                className={`group relative overflow-hidden rounded-3xl border border-border bg-surface p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/[0.07] ${feature.className ?? ''}`}
                            >
                                {/* Hover glow */}
                                <div
                                    className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br ${feature.gradient} opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-20`}
                                    aria-hidden="true"
                                />

                                <div
                                    className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-lg ${feature.glow} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                                >
                                    <Icon className="h-6 w-6 text-white" />
                                </div>

                                <h3
                                    className={`mt-5 font-bold text-foreground ${large ? 'text-2xl' : 'text-lg'}`}
                                >
                                    {t(feature.titleKey)}
                                </h3>
                                <p
                                    className={`mt-2 leading-relaxed text-muted-foreground ${large ? 'text-base max-w-md' : 'text-sm'
                                        }`}
                                >
                                    {t(feature.descKey)}
                                </p>

                                {large && (
                                    <div className="mt-6 hidden items-center gap-2 text-sm font-semibold text-accent md:inline-flex">
                                        <span>{t('features.learnMore')}</span>
                                        <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

