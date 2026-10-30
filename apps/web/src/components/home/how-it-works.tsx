import { useTranslations } from 'next-intl';
import { STEPS } from './data';

export function HowItWorks() {
    const t = useTranslations();

    return (
        <section id="how" className="relative py-12 sm:py-14 lg:py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <span
                        data-home-reveal
                        data-home-reveal-order="0"
                        className="inline-block rounded-full bg-accent-soft px-4 py-1.5 text-sm font-bold text-accent"
                    >
                        {t('how.badge')}
                    </span>
                    <h2
                        data-home-reveal
                        data-home-reveal-order="1"
                        className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-4xl"
                    >
                        {t('how.title')}
                    </h2>
                    <p
                        data-home-reveal
                        data-home-reveal-order="2"
                        className="mt-3 text-lg leading-relaxed text-muted-foreground"
                    >
                        {t('how.subtitle')}
                    </p>
                </div>

                <ol
                    data-home-reveal
                    data-home-reveal-order="3"
                    className="relative mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4"
                >
                    {/* Animated connector line (desktop) */}
                    <div
                        className="absolute left-0 right-0 top-8 hidden h-0.5 bg-gradient-to-r from-green-300 via-green-500 to-green-300 lg:block"
                        aria-hidden="true"
                    />
                    {STEPS.map((step) => {
                        const Icon = step.icon;
                        return (
                            <li key={step.number} className="group relative text-center">
                                <div className="relative z-10 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-surface text-accent shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md">
                                    <Icon className="h-7 w-7" />
                                    <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-[11px] font-black text-white shadow-md">
                                        {step.number}
                                    </span>
                                </div>
                                <h3 className="mt-5 text-lg font-bold text-foreground">{t(step.titleKey)}</h3>
                                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                                    {t(step.descKey)}
                                </p>
                            </li>
                        );
                    })}
                </ol>
            </div>
        </section>
    );
}

