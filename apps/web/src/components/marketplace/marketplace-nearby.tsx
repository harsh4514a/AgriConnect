'use client';

import { useTranslations } from 'next-intl';
import { MapPin, MapPinCheck } from 'lucide-react';
import { useProfileLocation } from '@/hooks/use-profile-location';

interface MarketplaceNearbyProps {
  /** Number of nearby listings (within threshold). */
  nearbyCount: number;
  /** Whether the Nearby quick filter is currently active. */
  nearbyActive: boolean;
  onCompleteProfile: () => void;
}

/**
 * Compact single-line Nearby status row shown just above the crop cards.
 * Uses the user's SAVED profile location (no live GPS / no permission).
 * - If the profile location is missing, shows the "Complete your profile * location to use Nearby." prompt (tap navigates to profile completion).
 * - When Nearby is active, shows "📍 Showing nearby crops around {district}".
 * - When Nearby is inactive, shows a subtle neutral row.
 */
export function MarketplaceNearby({
  nearbyCount,
  nearbyActive,
  onCompleteProfile,
}: MarketplaceNearbyProps) {
  const t = useTranslations();
  const { available, district } = useProfileLocation();

  if (!available) {
    return (
      <button
        type="button"
        onClick={onCompleteProfile}
        className="flex w-full items-center gap-2 rounded-xl border border-border bg-surface-subtle px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-surface-subtle"
      >
        <MapPinCheck className="h-4 w-4 shrink-0 text-accent" />
        <span className="truncate">{t('dashboard.marketplaceBrowse.ux.nearbyRowComplete')}</span>
      </button>
    );
  }

  // When Nearby is active, highlight the status row with green.
  if (nearbyActive) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-accent/30 bg-accent-soft px-3 py-2 text-xs font-medium text-accent">
        <MapPin className="h-4 w-4 shrink-0 text-accent" />
        <span className="truncate">
          {t('dashboard.marketplaceBrowse.ux.nearbyAround', { district: district ?? '' })}
        </span>
      </div>
    );
  }

  // Inactive state — neutral compact row.
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-subtle px-3 py-2 text-xs text-foreground">
      <MapPin className="h-4 w-4 shrink-0 text-accent" />
      <span className="truncate">
        {t('dashboard.marketplaceBrowse.ux.nearbyDistrict')}
        {nearbyCount > 0 ? `· ${nearbyCount}` : ''}
      </span>
    </div>
  );
}
