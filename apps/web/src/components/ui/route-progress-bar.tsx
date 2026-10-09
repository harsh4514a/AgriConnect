'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Top-tier navigation progress bar for AgriConnect.
 * Displays a glowing emerald gradient bar at the very top of the viewport
 * whenever a page navigation or route change begins, providing instant visual feedback.
 */
export function RouteProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const safetyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isNavigatingRef = useRef(false);
  const isVisibleRef = useRef(isVisible);
  isVisibleRef.current = isVisible;

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  }, []);

  const completeProgress = useCallback(() => {
    if (!isNavigatingRef.current && !isVisibleRef.current) return;
    isNavigatingRef.current = false;
    clearTimers();

    setProgress(100);
    setIsFinishing(true);

    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        setProgress(0);
        setIsFinishing(false);
      }, 250);
    }, 200);
  }, [clearTimers]);

  const startProgress = useCallback(() => {
    clearTimers();
    isNavigatingRef.current = true;
    setIsFinishing(false);
    setIsVisible(true);
    setProgress(15);

    // Trickle progress smoothly
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev < 50) return prev + Math.random() * 12 + 6;
        if (prev < 75) return prev + Math.random() * 6 + 2;
        if (prev < 88) return prev + Math.random() * 2 + 0.5;
        return prev;
      });
    }, 180);

    // Safety timeout: automatically complete after 6 seconds if navigation stalls
    safetyTimerRef.current = setTimeout(() => {
      completeProgress();
    }, 6000);
  }, [clearTimers, completeProgress]);

  // Complete progress on route / search parameter changes
  useEffect(() => {
    completeProgress();
  }, [pathname, searchParams, completeProgress]);

  // Intercept click on internal links to start progress immediately
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      // Ignore right clicks or clicks with modifier keys (new tab/window)
      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) {
        return;
      }

      const target = (e.target as HTMLElement)?.closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      const targetAttr = target.getAttribute('target');

      // Ignore non-navigation links or external tabs
      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        targetAttr === '_blank'
      ) {
        return;
      }

      // Check if same origin and different URL
      try {
        const url = new URL(href, window.location.href);
        const currentUrl = new URL(window.location.href);

        if (url.origin === currentUrl.origin) {
          // If going to the exact same pathname + search + hash, ignore
          if (
            url.pathname === currentUrl.pathname &&
            url.search === currentUrl.search &&
            url.hash === currentUrl.hash
          ) {
            return;
          }
          startProgress();
        }
      } catch {
        // Fallback for relative paths
        if (href.startsWith('/') && href !== window.location.pathname) {
          startProgress();
        }
      }
    };

    const handlePopState = () => {
      startProgress();
    };

    window.addEventListener('click', handleDocumentClick, { capture: true });
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('click', handleDocumentClick, { capture: true });
      window.removeEventListener('popstate', handlePopState);
      clearTimers();
    };
  }, [clearTimers, startProgress]);

  if (!isVisible) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[99999] pointer-events-none h-[3px] overflow-hidden"
    >
      <div
        className="h-full transition-all ease-out"
        style={{
          width: `${progress}%`,
          opacity: isFinishing ? 0 : 1,
          transitionDuration: isFinishing ? '200ms' : '220ms',
          background:
            'linear-gradient(90deg, #10b981 0%, #22c55e 40%, #4ade80 75%, #a7f3d0 100%)',
          boxShadow: '0 0 12px rgba(34, 197, 94, 0.9), 0 0 4px rgba(16, 185, 129, 0.8)',
        }}
      />
    </div>
  );
}
