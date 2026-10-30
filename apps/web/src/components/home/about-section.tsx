import Image from 'next/image';
import { AdaptiveLink as Link } from '@/components/performance/adaptive-link';
import { ArrowRight, Check, Sprout } from 'lucide-react';
import type { Locale, Messages } from '@/i18n/config';

type AboutCopy = Messages['landingPage']['sections']['about'];
type AboutBenefit = Messages['landingPage']['sections']['features']['items']['marketplace'];

export function AboutSection({
  locale,
  copy,
  benefits,
}: {
  locale: Locale;
  copy: AboutCopy;
  benefits: readonly AboutBenefit[];
}) {
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="scroll-mt-20 bg-canvas py-12 sm:py-14 lg:py-16"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-9 px-4 sm:px-6 md:gap-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-16 lg:px-8">
        <div
          data-home-reveal
          data-home-reveal-order="0"
          className="relative isolate aspect-[4/3] min-h-[280px] w-full min-w-0 overflow-hidden rounded-3xl border border-border bg-surface-subtle shadow-sm sm:min-h-[320px] md:aspect-[5/4] md:min-h-[340px] lg:aspect-[4/3] lg:min-h-[380px]"
        >
          <Image
            src="/image1.jpg"
            alt={copy.imageAlt}
            fill
            sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 54vw"
            quality={60}
            className="object-cover"
            style={{ objectPosition: 'center 72%' }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent"
          />
        </div>

        <div className="max-w-2xl">
          <div data-home-reveal data-home-reveal-order="1">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent sm:text-sm">
              {copy.eyebrow}
            </p>
            <h2
              id="about-heading"
              className="mt-3 text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-[2.65rem]"
            >
              {copy.title}
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {copy.description}
            </p>
          </div>

          <ul aria-label={copy.eyebrow} className="mt-7 space-y-4">
            {benefits.map((benefit, index) => (
              <li
                key={benefit.title}
                data-home-reveal
                data-home-reveal-order={String(index + 2)}
                className="flex gap-3"
              >
                <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <Check aria-hidden="true" className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground sm:text-base">
                    {benefit.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <Link
            href={`/${locale}/dashboard/marketplace`}
            prefetch={false}
            data-home-reveal
            data-home-reveal-order="4"
            className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
          >
            <Sprout aria-hidden="true" className="h-4 w-4" />
            {copy.cta}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
