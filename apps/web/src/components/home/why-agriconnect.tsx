import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { BENEFITS } from './data';

export function WhyAgriConnect() {
    const t = useTranslations();

    return (
        <section id="why" className="relative overflow-hidden py-12 sm:py-14 lg:py-16">
            {/* soft background split */}
            <div
                className="pointer-events-none absolute inset-y-0 left-0 w-full bg-gradient-to-br from-surface-subtle via-canvas to-surface-subtle lg:w-3/5"
                aria-hidden="true"
            />

            <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
                {/* Illustration */}
                <div data-home-reveal data-home-reveal-order="0" className="relative order-2 lg:order-1">
                    <div className="relative mx-auto max-w-md">
                        <div className="absolute inset-6 rounded-[2.5rem] bg-gradient-to-br from-green-500/20 to-emerald-400/20 blur-2xl" aria-hidden="true" />
                        <div className="relative overflow-hidden rounded-[2.5rem] border border-border bg-surface shadow-lg shadow-black/10">
                            <Image
                                src="/Background_Image1.jpg"
                                alt={t('why.imageAlt')}
                                width={1672}
                                height={941}
                                sizes="(max-width: 480px) calc(100vw - 2rem), 448px"
                                quality={60}
                                priority={false}
                                className="h-72 w-full object-cover"
                            />
                            {/* floating stat chip */}
                            <div className="absolute -left-4 top-32 rounded-2xl border border-border bg-surface/95 px-5 py-3 shadow-lg shadow-black/10 backdrop-blur-xl">
                                <p className="text-2xl font-black text-accent">{t('why.incomeStat')}</p>
                                <p className="text-xs font-semibold text-muted-foreground">{t('why.incomeLabel')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Benefits */}
                <div data-home-reveal data-home-reveal-order="1" className="order-1 lg:order-2">
                    <span
                        data-home-reveal
                        data-home-reveal-order="0"
                        className="inline-block rounded-full bg-accent-soft px-4 py-1.5 text-sm font-bold text-accent"
                    >
                        {t('why.badge')}
                    </span>
                    <h2
                        data-home-reveal
                        data-home-reveal-order="1"
                        className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-4xl"
                    >
                        {t('why.title')}
                    </h2>
                    <p
                        data-home-reveal
                        data-home-reveal-order="2"
                        className="mt-3 max-w-xl text-lg leading-relaxed text-muted-foreground"
                    >
                        {t('why.subtitle')}
                    </p>

                    <ul
                        data-home-reveal
                        data-home-reveal-order="3"
                        className="mt-8 space-y-4"
                    >
                        {BENEFITS.map((benefit) => {
                            const Icon = benefit.icon;
                            return (
                                <li
                                    key={benefit.titleKey}
                                    className="group flex items-start gap-4 rounded-2xl border border-transparent bg-surface-subtle/70 p-4 transition-all duration-300 hover:border-accent/20 hover:bg-surface hover:shadow-sm"
                                >
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-md shadow-green-600/20 transition-transform duration-300 group-hover:scale-110">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground">{t(benefit.titleKey)}</h3>
                                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                            {t(benefit.descKey)}
                                        </p>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </section>
    );
}
