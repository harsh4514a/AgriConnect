'use client';

import { useTranslations } from 'next-intl';

interface MarketplaceResultsInfoProps {
  /** Total number of matching listings. */
  count: number;
  /** Current sort key (for the "Sorted by X" label). */
  sortKey: string;
  /** Whether the Nearby quick filter is active. */
  nearMe: boolean;
  /** User's district (from saved profile), used when Nearby is active. */
  district?: string | null;
}

/**
 * Compact result-info line shown above the listings grid.
 * - Normal: "Showing N crops · Sorted by <sort>"
 * - Nearby: "Showing nearby crops around <district>"
 */
export function MarketplaceResultsInfo({
  count,
  sortKey,
  nearMe,
  district,
}: MarketplaceResultsInfoProps) {
  const t = useTranslations();

  const sortLabel = t(`dashboard.marketplaceBrowse.sort.${sortKey}`);
  const countLabel = t('dashboard.marketplaceBrowse.ux.resultCount', { count });

  // Compact summary: "16 crops found • Near Rajkot • Newest"
  const parts: string[] = [];

  if (nearMe) {
    parts.push(`${countLabel} ${t('dashboard.marketplaceBrowse.ux.resultFound')}`);
    parts.push(
      `${t('dashboard.marketplaceBrowse.ux.nearShort')} ${district ?? t('dashboard.marketplaceBrowse.ux.nearMe')}`,
    );
  } else {
    parts.push(`${countLabel} ${t('dashboard.marketplaceBrowse.ux.resultFound')}`);
    parts.push(sortLabel);
  }

  return (
    <div className="flex items-center gap-1.5 px-1 text-xs text-white/60">
      {parts.map((part, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-white/20">•</span>}
          <span>{part}</span>
        </span>
      ))}
    </div>
  );
}
