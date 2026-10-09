'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  hasUsableAdminSession,
  getCachedAdminProfile,
  clearStoredAdminTokens,
  getStoredAdminTokens,
  StoredAdminProfile,
} from '@/services/admin-api/admin-token';
import {
  adminLoginApi,
  adminGetProfileApi,
  adminLogoutApi,
  AdminLoginPayload,
} from '@/services/admin-api/admin-auth.api';

interface UseAdminAuth {
  admin: StoredAdminProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: AdminLoginPayload, redirectPath?: string | null) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export function useAdminAuth(): UseAdminAuth {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const [admin, setAdmin] = useState<StoredAdminProfile | null>(() => getCachedAdminProfile());
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await adminGetProfileApi();
      setAdmin(profile);
    } catch {
      // If fetching profile fails with 401, session was invalidated
      clearStoredAdminTokens();
      setAdmin(null);
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      if (!hasUsableAdminSession()) {
        if (mounted) {
          setIsAuthenticated(false);
          setAdmin(null);
          setIsLoading(false);
        }
        return;
      }

      if (mounted) {
        setIsAuthenticated(true);
        // Instant preview from cache
        const cached = getCachedAdminProfile();
        if (cached) {
          setAdmin(cached);
        }
      }

      try {
        const freshProfile = await adminGetProfileApi();
        if (mounted) {
          setAdmin(freshProfile);
        }
      } catch {
        if (!hasUsableAdminSession() && mounted) {
          setIsAuthenticated(false);
          setAdmin(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void checkAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(
    async (credentials: AdminLoginPayload, redirectPath?: string | null) => {
      const res = await adminLoginApi(credentials);
      setAdmin(res.admin);
      setIsAuthenticated(true);
      const safeRedirect = redirectPath?.startsWith(`/${locale}/admin/`)
        ? redirectPath
        : `/${locale}/admin`;
      router.push(safeRedirect);
    },
    [locale, router],
  );

  const logout = useCallback(async () => {
    const { refreshToken } = getStoredAdminTokens();
    try {
      await adminLogoutApi(refreshToken);
    } catch {
      clearStoredAdminTokens();
    } finally {
      setAdmin(null);
      setIsAuthenticated(false);
      router.push(`/${locale}/admin/login`);
    }
  }, [locale, router]);

  return {
    admin,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshProfile,
  };
}
