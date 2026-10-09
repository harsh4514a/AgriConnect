'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { DashboardUser } from '@/types/dashboard.types';
import {
  hasUsableSession,
  clearStoredTokens,
} from '@/services/api/token';
import {
  getCachedUser,
  resolveDashboardUser,
  clearCachedUser,
} from '@/lib/auth/session';

interface UseAuth {
  /** The resolved dashboard user, or null while loading / unauthenticated. */
  user: DashboardUser | null;
  /** True once the initial session/user resolution has completed. */
  isLoading: boolean;
  /** True when the user has a usable session. */
  isAuthenticated: boolean;
  /** Log out the current user and navigate to the auth page. */
  logout: () => void;
}

/**
 * Client-side auth hook for the dashboard.
 *
 * Resolves the current user on mount (preferring the future `/auth/me`
 * endpoint and falling back to the cached snapshot). Exposes logout that
 * clears tokens + cached user and redirects to `/auth`.
 */
export function useAuth(): UseAuth {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const [user, setUser] = useState<DashboardUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!hasUsableSession()) {
        if (!cancelled) {
          setIsAuthenticated(false);
          setIsLoading(false);
        }
        return;
      }

      setIsAuthenticated(true);
      const cachedUser = getCachedUser();
      if (cachedUser && !cancelled) {
        setUser(cachedUser);
      }

      const resolved = await resolveDashboardUser();
      if (!cancelled) {
        setUser(resolved ?? cachedUser);
        setIsLoading(false);
      }
    })();

    const handleProfileUpdated = () => {
      const cached = getCachedUser();
      if (!cancelled && cached) {
        setUser(cached);
      }
    };

    window.addEventListener('agri:profile-updated', handleProfileUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener('agri:profile-updated', handleProfileUpdated);
    };
  }, []);

  const logout = useCallback(() => {
    clearStoredTokens();
    clearCachedUser();
    setUser(null);
    setIsAuthenticated(false);
    router.push(`/${locale}/auth`);
    router.refresh();
  }, [locale, router]);

  return { user, isLoading, isAuthenticated, logout };
}
