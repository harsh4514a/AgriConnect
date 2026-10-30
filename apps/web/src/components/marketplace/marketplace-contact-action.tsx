'use client';

import { useMemo, useState } from 'react';
import { AdaptiveLink as Link } from '@/components/performance/adaptive-link';
import { useLocale, useTranslations } from 'next-intl';
import { MessageCircle, Phone, ShieldCheck, X } from 'lucide-react';

import type { CropListing } from '@/data/marketplace-listings';
import { normalizePhoneNumber } from '@/utils/phone-number';

interface MarketplaceContactActionProps {
  listing: CropListing;
  isAuthenticated: boolean;
  isAuthLoading?: boolean;
  variant?: 'desktop' | 'mobile-sticky';
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(price);
}

export function MarketplaceContactAction({
  listing,
  isAuthenticated,
  isAuthLoading = false,
  variant = 'desktop',
}: MarketplaceContactActionProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [showCallConfirmation, setShowCallConfirmation] = useState(false);
  const phone = normalizePhoneNumber(listing.mobileNumber);

  const whatsappUrl = useMemo(() => {
    if (!phone) return null;

    const message = [
      `Hello${listing.farmerNameShort ? ` ${listing.farmerNameShort}` : ''},`,
      '',
      `I am interested in your ${listing.cropKey} listing on AgriConnect.`,
      `Quantity: ${listing.quantity} ${listing.unit}`,
      `Price: ₹${formatPrice(listing.price)} / ${listing.primaryUnit}`,
      '',
      'Is this produce still available? I would like to discuss the purchase.',
    ].join('\n');

    return `https://wa.me/${phone.whatsapp}?text=${encodeURIComponent(message)}`;
  }, [listing, phone]);

  const contactContent = !isAuthenticated ? (
    isAuthLoading ? (
      <div className="h-11 rounded-xl bg-surface-subtle" aria-hidden="true" />
    ) : (
      <Link
        href={`/${locale}/auth`}
        prefetch={false}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-accent/20 bg-accent-soft px-4 text-center text-sm font-semibold text-accent transition-colors hover:bg-accent/15 focus-visible:outline-2 focus-visible:outline-focus"
      >
        {t('dashboard.marketplaceBrowse.ux.signInToContact')}
      </Link>
    )
  ) : !phone || !whatsappUrl ? (
    <p className="rounded-xl border border-border bg-surface-subtle px-3 py-3 text-sm text-muted-foreground">
      {t('dashboard.marketplaceBrowse.detail.contactUnavailable')}
    </p>
  ) : (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => setShowCallConfirmation(true)}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground shadow-sm transition-colors hover:bg-accent-strong active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-focus"
      >
        <Phone className="h-4 w-4" aria-hidden="true" />
        {t('dashboard.marketplaceBrowse.detail.callFarmer')}
      </button>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-accent/20 bg-accent-soft px-4 text-sm font-bold text-accent transition-colors hover:bg-accent/15 focus-visible:outline-2 focus-visible:outline-focus"
      >
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        {t('dashboard.marketplaceBrowse.detail.whatsappFarmer')}
      </a>
    </div>
  );

  return (
    <>
      {variant === 'mobile-sticky' ? (
        <div className="fixed inset-x-0 bottom-16 z-40 border-t border-border bg-surface/95 p-3 backdrop-blur-xl lg:hidden">
          <div className="mx-auto max-w-lg">
            {isAuthenticated && listing.verified ? (
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-accent">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                {t('dashboard.marketplaceBrowse.detail.verifiedSeller')}
              </p>
            ) : null}
            {contactContent}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {contactContent}
          {isAuthenticated && phone ? (
            <div className="flex items-start gap-2 rounded-xl border border-border bg-surface-subtle p-3 text-[11px] leading-5 text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
              <span>{t('dashboard.marketplaceBrowse.detail.trustNotice')}</span>
            </div>
          ) : null}
        </div>
      )}

      {showCallConfirmation && phone ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="call-farmer-title"
        >
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="call-farmer-title" className="text-lg font-bold text-foreground">
                  {t('dashboard.marketplaceBrowse.detail.callFarmer')}
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {t('dashboard.marketplaceBrowse.detail.callConfirmationText')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCallConfirmation(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-subtle hover:text-foreground focus-visible:outline-2 focus-visible:outline-focus"
                aria-label={t('dashboard.marketplaceBrowse.detail.cancelCall')}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-border bg-surface-subtle p-4">
              {listing.farmerName ? (
                <p className="text-xs text-muted-foreground">{listing.farmerName}</p>
              ) : null}
              <p className="text-xl font-bold tracking-wide text-foreground">{listing.mobileNumber}</p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowCallConfirmation(false)}
                className="h-11 rounded-xl border border-border bg-surface-subtle text-sm font-semibold text-foreground transition-colors hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-focus"
              >
                {t('dashboard.marketplaceBrowse.detail.cancelCall')}
              </button>
              <a
                href={`tel:${phone.tel}`}
                onClick={() => setShowCallConfirmation(false)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-focus"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                {t('dashboard.marketplaceBrowse.detail.confirmCall')}
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
