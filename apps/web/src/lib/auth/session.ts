import type { DashboardUser } from '@/types/dashboard.types';
import { hasUsableSession } from '@/services/api/token';
import { getProfile } from '@/services/api/auth.api';

/**
 * Session user persistence.
 *
 * Architecture note:
 * - The **primary** source of truth for the authenticated user will be a future
 *   backend `GET /auth/me` endpoint (see `fetchCurrentUser` below).
 * - Until that endpoint exists, we persist a minimal snapshot (name + language)
 *   to localStorage so the dashboard can greet the user by name immediately.
 * - localStorage is used ONLY as a temporary fallback and must never be treated
 *   as the source of truth for sensitive/authoritative profile data.
 */

const USER_KEY = 'agri_user';

/** Read the cached user snapshot without throwing. */
export function getCachedUser(): DashboardUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DashboardUser>;
    if (!parsed.firstName || !parsed.lastName) return null;
    return {
      id: parsed.id,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      mobileNumber: parsed.mobileNumber ?? '',
      preferredLanguage: parsed.preferredLanguage ?? 'en',
      role: parsed.role ?? 'farmer',
      isVerified: parsed.isVerified ?? true,
      avatarUrl: parsed.avatarUrl,
      location: parsed.location,
    };
  } catch {
    return null;
  }
}

/** Persist a non-sensitive user snapshot (fallback only). */
export function cacheUser(user: DashboardUser): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // Ignore quota/security errors — the profile just won't be cached.
  }
}

/** Remove the cached user snapshot (called on logout). */
export function clearCachedUser(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(USER_KEY);
  } catch {
    // Ignore.
  }
}

/**
 * Update the cached user's preferred language in place (without overwriting
 * the rest of the snapshot). Keeps the dashboard's cached profile in sync
 * when the user switches language, so consumers reading `useAuth()` reflect
 * the change immediately.
 */
export function updateCachedUserLanguage(language: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getCachedUser();
    if (!current) return;
    cacheUser({ ...current, preferredLanguage: language });
  } catch {
    // Ignore storage errors — the update is best-effort.
  }
}

/**
 * Update the cached dashboard user after a successful profile update.
 *
 * The backend remains the source of truth. This only keeps the local
 * dashboard snapshot synchronized without forcing a full page reload.
 */
export function updateCachedUserProfile(profile: {
  firstName: string;
  lastName: string;
  mobileNumber: string;
  preferredLanguage: string;
  role: string;
  isVerified: boolean;
  location?: DashboardUser['location'];
}): void {
  if (typeof window === 'undefined') return;

  try {
    const current = getCachedUser();

    if (!current) return;

    const updated: DashboardUser = {
      ...current,
      ...profile,
    };

    cacheUser(updated);

    window.dispatchEvent(
      new CustomEvent('agri:profile-updated'),
    );
  } catch {
    // Cache synchronization is best-effort.
  }
}

/**
 * Fetch the current user from the backend (`GET /auth/profile`).
 *
 * This is the primary source of truth for the authenticated user. On success
 * the returned profile is cached so the dashboard can display the user's name
 * instantly on subsequent visits. If the request fails (e.g. network error),
 * we return `null` and let callers fall back to the cached snapshot.
 */
export async function fetchCurrentUser(): Promise<DashboardUser | null> {
  if (!hasUsableSession()) return null;
  try {
    const profile = await getProfile();
    const user: DashboardUser = {
      id: profile.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      mobileNumber: profile.mobileNumber,
      preferredLanguage: profile.preferredLanguage,
      role: profile.role,
      isVerified: profile.isVerified,
      avatarUrl: profile.avatarUrl ?? undefined,
      location:
        profile.district?.name || profile.latitude
          ? {
              district: profile.district?.name,
              taluka: profile.taluka?.name,
              village: profile.village?.name,
              latitude: profile.latitude ?? undefined,
              longitude: profile.longitude ?? undefined,
            }
          : undefined,
    };
    cacheUser(user);
    return user;
  } catch {
    return null;
  }
}

/**
 * Resolve the dashboard user: prefer the backend, fall back to the cache.
 */
export async function resolveDashboardUser(): Promise<DashboardUser | null> {
  if (!hasUsableSession()) return null;
  const remote = await fetchCurrentUser();
  if (remote) {
    cacheUser(remote);
    return remote;
  }
  return getCachedUser();
}
