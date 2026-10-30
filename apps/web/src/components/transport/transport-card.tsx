'use client';

import {
  BadgeCheck,
  Edit3,
  MapPin,
  Navigation,
  Phone,
  Trash2,
  Truck,
  User,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { getLocalizedDomainName } from '@agri/domain-data';

import type { TransportProvider } from '@/services/api/transport.api';

export type TransportCardData = TransportProvider;

interface TransportCardProps {
  provider: TransportProvider;
  management?: boolean;
  onEdit?: (provider: TransportProvider) => void;
  onDelete?: (provider: TransportProvider) => void;
  onAvailability?: (
    provider: TransportProvider,
    isAvailable: boolean,
  ) => Promise<void>;
  onContact?: (provider: TransportProvider) => void;
}

export function TransportCard({
  provider,
  management = false,
  onEdit,
  onDelete,
  onAvailability,
  onContact,
}: TransportCardProps) {
  const t = useTranslations('dashboard.transport');
  const locale = useLocale();

  const location = [
    provider.village?.name ? getLocalizedDomainName(provider.village.name, locale, 'village') : '',
    provider.taluka?.name ? getLocalizedDomainName(provider.taluka.name, locale, 'taluka') : '',
    provider.district?.name ? getLocalizedDomainName(provider.district.name, locale, 'district') : '',
  ]
    .filter(Boolean)
    .join(', ');

  const mapUrl =
    provider.latitude !== null &&
    provider.latitude !== undefined &&
    provider.longitude !== null &&
    provider.longitude !== undefined
      ? `https://www.openstreetmap.org/?mlat=${provider.latitude}&mlon=${provider.longitude}#map=15/${provider.latitude}/${provider.longitude}`
      : null;

  const vehicleName =
    provider.vehicleType === 'other' && provider.customVehicleType
      ? provider.customVehicleType
      : getLocalizedDomainName(provider.vehicleType, locale, 'vehicleType');

  const handleContact = () => {
    onContact?.(provider);
  };

  const providerLabel = provider.phoneNumber
    ? provider.businessName
    : t('publicProviderLabel');

  return (
    <>
      <article className="flex h-full flex-col rounded-2xl border border-border bg-surface p-4 shadow-lg shadow-black/5 backdrop-blur-sm sm:p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-foreground">
              {providerLabel}
            </h2>

            {provider.isVerified ? (
              <div className="mt-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">
                  <BadgeCheck
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                  {t('verified')}
                </span>
              </div>
            ) : null}

            {provider.phoneNumber && provider.contactName ? (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <User
                  className="h-3.5 w-3.5 shrink-0"
                  aria-hidden="true"
                />
                <span className="truncate">{provider.contactName}</span>
              </p>
            ) : null}
          </div>
        </div>

        {/* Vehicle */}
        <div className="mt-3 rounded-xl border border-border bg-surface-subtle p-3">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Truck
              className="h-3.5 w-3.5"
              aria-hidden="true"
            />
            {t('vehicleType')}
          </div>

          <p className="mt-1 text-sm font-semibold text-foreground">
            {vehicleName}
          </p>
        </div>

        {/* Location & Availability */}
        <div className="mt-4 space-y-2">
          {location ? (
            <div className="flex items-start gap-2 text-sm text-foreground">
              <MapPin
                className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                aria-hidden="true"
              />

              <span>{location}</span>
            </div>
          ) : null}

          {provider.additionalDetails ? (
            <p className="line-clamp-2 pl-6 text-xs leading-5 text-muted-foreground">
              {provider.additionalDetails}
            </p>
          ) : null}

          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
              provider.isAvailable
                ? 'bg-accent-soft text-accent'
                : 'bg-surface-subtle text-muted-foreground'
            }`}
          >
            {provider.isAvailable
              ? t('available')
              : t('unavailable')}
          </span>
        </div>

        {/* Management Actions */}
        {management ? (
          <div className="mt-4 border-t border-border pt-3">
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <input
                  type="checkbox"
                  checked={provider.isAvailable}
                  onChange={(event) =>
                    onAvailability?.(
                      provider,
                      event.target.checked,
                    )
                  }
                  className="h-4 w-4 accent-accent"
                />

                {t('myTransport.availableToggle')}
              </label>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onEdit?.(provider)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-muted-foreground hover:bg-surface-subtle hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  aria-label={`${t('myTransport.edit')} ${provider.businessName}`}
                >
                  <Edit3
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  />

                  {t('myTransport.edit')}
                </button>

                <button
                  type="button"
                  onClick={() => onDelete?.(provider)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-danger hover:bg-danger-soft hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
                  aria-label={`${t('myTransport.delete')} ${provider.businessName}`}
                >
                  <Trash2
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  />

                  {t('myTransport.delete')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Discover Actions */
          <div className="mt-auto grid gap-2 pt-4">
            <button
              type="button"
              onClick={handleContact}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-accent-strong active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              aria-label={`${provider.phoneNumber ? t('contact') : t('contactSignIn')} ${providerLabel}`}
            >
              <Phone
                className="h-4 w-4"
                aria-hidden="true"
              />

              {provider.phoneNumber ? t('contact') : t('contactSignIn')}
            </button>

            {mapUrl ? (
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-subtle px-4 text-sm font-semibold text-foreground hover:bg-surface-subtle hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                aria-label={`${t('directions')} ${providerLabel}`}
              >
                <Navigation
                  className="h-4 w-4"
                  aria-hidden="true"
                />

                {t('directions')}
              </a>
            ) : null}
          </div>
        )}
      </article>

    </>
  );
}
