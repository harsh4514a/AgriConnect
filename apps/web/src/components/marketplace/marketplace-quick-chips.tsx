'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/utils/cn';
import type { CropKey } from '@/data/marketplace-listings';
import { CROPS } from '@/data/marketplace-listings';

/** Emoji shown next to each quick crop chip. */
const CROP_EMOJI: Record<CropKey, string> = {
  wheat: '🌾',
  onion: '🧅',
  tomato: '🍅',
  cotton: '🫘',
  maize: '🌽',
  potato: '🥔',
  groundnut: '🥜',
  rice: '🍚',
  bajra: '🌾',
  chili: '🌶️',
  other: '🌱',
};

interface MarketplaceQuickChipsProps {
  selected: CropKey | 'all';
  onSelect: (crop: CropKey | 'all') => void;
}

/**
 * Quick crop chips. All crops are shown inline in a single horizontal
 * scrolling row (no "+ More" sheet) for one-tap access. Mobile-first with
 * large touch targets.
 */
export function MarketplaceQuickChips({ selected, onSelect }: MarketplaceQuickChipsProps) {
  const t = useTranslations();

  const chipClass = (active: boolean) =>
    cn(
      'inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-semibold transition-all active:scale-95',
      active
        ? 'border-green-400/70 bg-green-500 text-white shadow-lg shadow-green-900/40'
        : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white',
    );

  return (
    <div
      role="group"
      aria-label={t('dashboard.marketplaceBrowse.ux.filter')}
      className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <button
        type="button"
        onClick={() => onSelect('all')}
        aria-pressed={selected === 'all'}
        className={chipClass(selected === 'all')}
      >
        {t('dashboard.marketplaceBrowse.filters.allCrops')}
      </button>

      {CROPS.map((crop) => {
        const active = selected === crop;
        return (
          <button
            key={crop}
            type="button"
            onClick={() => onSelect(active ? 'all' : crop)}
            aria-pressed={active}
            className={chipClass(active)}
          >
            <span aria-hidden="true">{CROP_EMOJI[crop]}</span>
            {t(`dashboard.marketplaceBrowse.crop.${crop}`)}
          </button>
        );
      })}
    </div>
  );
}
