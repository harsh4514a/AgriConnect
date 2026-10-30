'use client';

import Image from 'next/image';
import { AdaptiveLink as Link } from '@/components/performance/adaptive-link';
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react';
import type { Messages } from '@/i18n/config';

type SlideCopy = Messages['landingPage']['hero']['slides']['marketplace'];
type HeroSlide = SlideCopy & {
  image: string;
  imagePosition: string;
  primaryHref: string;
  secondaryHref: string;
};
type ControlCopy = Messages['landingPage']['hero']['controls'];

const ROTATION_MS = 5_000;
const FADE_MS = 420;
const LOW_BANDWIDTH_TYPES = new Set(['slow-2g', '2g']);

export function HeroSlider({
  slides,
  controls,
}: {
  slides: HeroSlide[];
  controls: ControlCopy;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [focused, setFocused] = useState(false);
  const [manuallyPaused, setManuallyPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [lowBandwidth, setLowBandwidth] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<number>>(() => new Set());
  const fadeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paused = focused || manuallyPaused || !pageVisible || lowBandwidth;

  const commitSlide = useCallback((nextIndex: number) => {
    setPreviousIndex(activeIndex);
    setActiveIndex(nextIndex);
    setPendingIndex(null);

    if (fadeTimeout.current) clearTimeout(fadeTimeout.current);
    if (reducedMotion) {
      setPreviousIndex(null);
      return;
    }
    fadeTimeout.current = setTimeout(() => setPreviousIndex(null), FADE_MS);
  }, [activeIndex, reducedMotion]);

  const requestSlide = useCallback((nextIndex: number) => {
    if (nextIndex === activeIndex || pendingIndex !== null) return;
    if (failedImages.has(nextIndex)) {
      commitSlide(nextIndex);
      return;
    }
    setPendingIndex(nextIndex);
  }, [activeIndex, commitSlide, failedImages, pendingIndex]);

  const move = useCallback((direction: -1 | 1) => {
    requestSlide((activeIndex + direction + slides.length) % slides.length);
  }, [activeIndex, requestSlide, slides.length]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);
    return () => mediaQuery.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    const updateVisibility = () => setPageVisible(document.visibilityState === 'visible');
    updateVisibility();
    document.addEventListener('visibilitychange', updateVisibility);
    return () => document.removeEventListener('visibilitychange', updateVisibility);
  }, []);

  useEffect(() => {
    type NetworkConnection = EventTarget & {
      effectiveType?: string;
      saveData?: boolean;
    };
    const connection = (navigator as Navigator & { connection?: NetworkConnection }).connection;
    const updateNetworkPreference = () => {
      setLowBandwidth(
        Boolean(connection?.saveData) || LOW_BANDWIDTH_TYPES.has(connection?.effectiveType ?? ''),
      );
    };

    updateNetworkPreference();
    connection?.addEventListener('change', updateNetworkPreference);
    return () => connection?.removeEventListener('change', updateNetworkPreference);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion || pendingIndex !== null || slides.length < 2) return;
    const timeout = setTimeout(() => {
      requestSlide((activeIndex + 1) % slides.length);
    }, ROTATION_MS);
    return () => clearTimeout(timeout);
  }, [activeIndex, paused, pendingIndex, reducedMotion, requestSlide, slides.length]);

  useEffect(() => () => {
    if (fadeTimeout.current) clearTimeout(fadeTimeout.current);
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      move(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      move(1);
    }
  };

  const renderImage = (index: number, isActive: boolean, isPrevious: boolean) => {
    const slide = slides[index];
    if (failedImages.has(index)) return null;
    return (
      <div
        key={`${slide.image}-${index}`}
        className={`absolute inset-0 transition-opacity duration-[420ms] motion-reduce:transition-none ${
          isActive ? 'opacity-100' : isPrevious ? 'opacity-0' : 'opacity-0'
        }`}
        aria-hidden={!isActive}
      >
        <Image
          src={slide.image}
          alt={slide.imageAlt}
          fill
          priority={index === 0}
          loading={index === 0 || index === pendingIndex ? 'eager' : 'lazy'}
          sizes="100vw"
          quality={60}
          className="object-cover brightness-[1.04] saturate-[0.96]"
          style={{ objectPosition: slide.imagePosition }}
          onLoad={() => {
            if (index === pendingIndex) commitSlide(index);
          }}
          onError={() => {
            setFailedImages((current) => new Set(current).add(index));
            if (index === pendingIndex) commitSlide(index);
          }}
        />
      </div>
    );
  };

  const activeSlide = slides[activeIndex];
  const displayedIndexes = new Set([activeIndex, previousIndex, pendingIndex].filter((index): index is number => index !== null));

  return (
    <section
      id="home"
      aria-label={controls.carousel}
      aria-roledescription="carousel"
      onKeyDown={handleKeyDown}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
      className="relative isolate mx-auto my-0 flex min-h-[620px] w-full max-w-none overflow-hidden rounded-none bg-[var(--hero)] sm:my-4 sm:min-h-[640px] sm:w-[calc(100%-3rem)] sm:max-w-[1600px] sm:rounded-2xl lg:h-[min(82svh,710px)] lg:min-h-[640px] lg:w-[calc(100%-4rem)]"
    >
      {Array.from(displayedIndexes).map((index) =>
        renderImage(index, index === activeIndex, index === previousIndex),
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/52 via-black/24 to-transparent" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/15 to-transparent" aria-hidden="true" />
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 24"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 top-0 z-10 hidden h-6 w-full sm:block"
      >
        <path
          fill="var(--canvas)"
          d="M0 0H1440V12L1416 16L1392 10L1366 14L1341 8L1318 14L1291 10L1266 16L1240 11L1214 14L1188 8L1162 14L1137 10L1112 16L1086 11L1060 14L1034 8L1008 14L982 10L956 16L930 11L904 14L878 8L852 14L826 10L800 16L774 11L748 14L722 8L696 14L670 10L644 16L618 11L592 14L566 8L540 14L514 10L488 16L462 11L436 14L410 8L384 14L358 10L332 16L306 11L280 14L254 8L228 14L202 10L176 16L150 11L124 14L98 8L72 14L46 10L22 16L0 12Z"
        />
      </svg>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col justify-center px-4 pb-20 pt-16 sm:px-6 lg:px-8">
        <div
          key={activeIndex}
          aria-live="off"
          className={`max-w-3xl ${previousIndex !== null ? 'home-hero-copy-enter' : ''}`}
        >
          <p className="inline-flex items-center rounded-full border border-white/30 bg-black/20 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white shadow-sm backdrop-blur-sm">
            {activeSlide.eyebrow}
          </p>
          <h1 className="mt-5 max-w-[19ch] text-4xl font-bold leading-[1.08] tracking-tight text-white drop-shadow-md sm:max-w-[22ch] sm:text-5xl lg:text-6xl">
            {activeSlide.title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] sm:text-lg">
            {activeSlide.description}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href={activeSlide.primaryHref}
              prefetch={false}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-green-950 shadow-lg shadow-black/20 transition-colors hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:px-6 sm:text-base"
            >
              {activeSlide.primary}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <Link
              href={activeSlide.secondaryHref}
              prefetch={false}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/65 bg-black/10 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:px-6 sm:text-base"
            >
              {activeSlide.secondary}
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 pb-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2" role="group" aria-label={controls.slideSelection}>
            {slides.map((slide, index) => (
              <button
                key={slide.title}
                type="button"
                aria-label={controls.goTo
                  .replace('{number}', String(index + 1))
                  .replace('{title}', slide.title)}
                aria-current={activeIndex === index ? 'true' : undefined}
                onClick={() => requestSlide(index)}
                className={`h-2.5 rounded-full border border-white/80 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black motion-reduce:transition-none ${
                  activeIndex === index ? 'w-8 bg-white' : 'w-2.5 bg-white/30 hover:bg-white/70'
                }`}
              />
            ))}
            <span className="sr-only">{activeSlide.title}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setManuallyPaused((current) => !current)}
              aria-label={manuallyPaused ? controls.resume : controls.pause}
              aria-pressed={manuallyPaused}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/45 bg-black/15 text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {manuallyPaused ? (
                <Play aria-hidden="true" className="h-4 w-4" />
              ) : (
                <Pause aria-hidden="true" className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label={controls.previous}
              disabled={pendingIndex !== null}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/45 bg-black/15 text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              aria-label={controls.next}
              disabled={pendingIndex !== null}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/45 bg-black/15 text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
            >
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
