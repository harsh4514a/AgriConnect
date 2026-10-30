'use client';

import { useEffect } from 'react';

export function HomeSectionReveal() {
  useEffect(() => {
    if (
      !('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const sections = document.querySelectorAll<HTMLElement>('#homepage-content [data-home-reveal]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const section = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            section.dataset.homeRevealed = 'true';
            observer.unobserve(section);
          } else {
            section.dataset.homeRevealReady = 'true';
          }
        });
      },
      { rootMargin: '0px 0px -48px 0px', threshold: 0.08 },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return null;
}
