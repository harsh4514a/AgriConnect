import type { LucideIcon } from 'lucide-react';

/** Keys for the dashboard section menu items. */
export type DashboardSectionKey =
  | 'dashboard'
  | 'marketplace'
  | 'my-listings'
  | 'buyer-requirements'
  | 'market-prices'
  | 'crop-guide'
  | 'government-schemes'
  | 'transport'
  | 'nearby-listings'
  | 'notifications'
  | 'profile'
  | 'settings';

/** A single entry in the dashboard sidebar. */
export interface DashboardNavItem {
  key: DashboardSectionKey;
  /** i18n translation key, e.g. `dashboard.menu.marketplace`. */
  labelKey: string;
  /** Route slug appended after `/dashboard/`. */
  href: string;
  icon: LucideIcon;
/** Logical sidebar group the item belongs to. */
  group?: 'marketplace' | 'information' | 'services' | 'account';
}

/** Saved profile location (from the completed profile) used for Nearby. */
export interface UserLocation {
  district?: string;
  taluka?: string;
  village?: string;
  latitude?: number;
  longitude?: number;
}

/** The currently authenticated user profile surfaced to the dashboard. */
export interface DashboardUser {
  id?: string;
  firstName: string;
  lastName: string;
  mobileNumber: string;
  preferredLanguage: string;
  role: string;
  isVerified: boolean;
  /** Future: profile image URL from Cloudinary. */
  avatarUrl?: string;
  /** Saved location from profile completion (used for Nearby listings). */
  location?: UserLocation;
}
