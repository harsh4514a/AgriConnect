import {
  LayoutDashboard,
  Store,
  Package,
  ClipboardList,
  TrendingUp,
  Leaf,
  Landmark,
  Truck,
  MapPin,
  Bell,
  User,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import type { DashboardNavItem, DashboardSectionKey } from '@/types/dashboard.types';

/** Ordered sidebar navigation. `dashboard` is the only functional route. */
export const DASHBOARD_NAV: DashboardNavItem[] = [
  {
    key: 'dashboard',
    labelKey: 'dashboard.menu.dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    key: 'marketplace',
    labelKey: 'dashboard.menu.marketplace',
    href: '/dashboard/marketplace',
    icon: Store,
    group: 'marketplace',
  },
  {
    key: 'my-listings',
    labelKey: 'dashboard.menu.myListings',
    href: '/dashboard/my-listings',
    icon: Package,
    group: 'marketplace',
  },
  {
    key: 'buyer-requirements',
    labelKey: 'dashboard.menu.buyerRequirements',
    href: '/dashboard/buyer-requirements',
    icon: ClipboardList,
    group: 'marketplace',
  },
  {
    key: 'nearby-listings',
    labelKey: 'dashboard.menu.nearbyListings',
    href: '/dashboard/nearby-listings',
    icon: MapPin,
    group: 'marketplace',
  },
  {
    key: 'market-prices',
    labelKey: 'dashboard.menu.marketPrices',
    href: '/dashboard/market-prices',
    icon: TrendingUp,
    group: 'information',
  },
  {
    key: 'crop-guide',
    labelKey: 'dashboard.menu.cropInformation',
    href: '/dashboard/crop-guide',
    icon: Leaf,
    group: 'information',
  },
  {
    key: 'government-schemes',
    labelKey: 'dashboard.menu.governmentSchemes',
    href: '/dashboard/government-schemes',
    icon: Landmark,
    group: 'information',
  },
  {
    key: 'transport',
    labelKey: 'dashboard.menu.transport',
    href: '/dashboard/transport',
    icon: Truck,
    group: 'services',
  },
  {
    key: 'notifications',
    labelKey: 'dashboard.menu.notifications',
    href: '/dashboard/notifications',
    icon: Bell,
    group: 'account',
  },
  {
    key: 'profile',
    labelKey: 'dashboard.menu.profile',
    href: '/dashboard/profile',
    icon: User,
    group: 'account',
  },
  {
    key: 'settings',
    labelKey: 'dashboard.menu.settings',
    href: '/dashboard/settings',
    icon: Settings,
    group: 'account',
  },
];

/** Ordered sidebar groups with their header translation keys. */
export const DASHBOARD_NAV_GROUPS: {
  key: 'marketplace' | 'information' | 'services' | 'account';
  labelKey: string;
}[] = [
  { key: 'marketplace', labelKey: 'dashboard.menu.groupMarketplace' },
  { key: 'information', labelKey: 'dashboard.menu.groupInformation' },
  { key: 'services', labelKey: 'dashboard.menu.groupServices' },
  { key: 'account', labelKey: 'dashboard.menu.groupAccount' },
];

/** Dashboard home key. Other implemented modules have their own routes. */
export const DASHBOARD_HOME_KEY: DashboardSectionKey = 'dashboard';

/** Map a section key to its NavItem. */
export function getDashboardNavItem(key: DashboardSectionKey): DashboardNavItem | undefined {
  return DASHBOARD_NAV.find((item) => item.key === key);
}
