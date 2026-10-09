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
  X,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
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

  const [contactConfirmationOpen, setContactConfirmationOpen] =
    useState(false);

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
    setContactConfirmationOpen(true);
  };

  const handleConfirmContact = () => {
    setContactConfirmationOpen(false);

    onContact?.(provider);

    window.location.href = `tel:${provider.phoneNumber}`;
  };

  const handleCancelContact = () => {
    setContactConfirmationOpen(false);
  };

  return (
    <>
      <article className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.045] p-4 shadow-lg shadow-black/5 backdrop-blur-sm sm:p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-white">
              {provider.businessName}
            </h2>

            {provider.isVerified ? (
              <div className="mt-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                  <BadgeCheck
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                  {t('verified')}
                </span>
              </div>
            ) : null}

            {provider.contactName ? (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-white/45">
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
        <div className="mt-4 rounded-xl border border-white/8 bg-black/10 p-3">
          <div className="flex items-center gap-1.5 text-[11px] text-white/45">
            <Truck
              className="h-3.5 w-3.5"
              aria-hidden="true"
            />
            {t('vehicleType')}
          </div>

          <p className="mt-1 text-sm font-semibold text-white">
            {vehicleName}
          </p>
        </div>

        {/* Location & Availability */}
        <div className="mt-4 space-y-2">
          {location ? (
            <div className="flex items-start gap-2 text-sm text-white/70">
              <MapPin
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300"
                aria-hidden="true"
              />

              <span>{location}</span>
            </div>
          ) : null}

          {provider.additionalDetails ? (
            <p className="line-clamp-2 pl-6 text-xs leading-5 text-white/40">
              {provider.additionalDetails}
            </p>
          ) : null}

          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
              provider.isAvailable
                ? 'bg-emerald-400/10 text-emerald-300'
                : 'bg-white/7 text-white/50'
            }`}
          >
            {provider.isAvailable
              ? t('available')
              : t('unavailable')}
          </span>
        </div>

        {/* Management Actions */}
        {management ? (
          <div className="mt-4 border-t border-white/10 pt-3">
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-white/55">
                <input
                  type="checkbox"
                  checked={provider.isAvailable}
                  onChange={(event) =>
                    onAvailability?.(
                      provider,
                      event.target.checked,
                    )
                  }
                  className="h-4 w-4 accent-emerald-500"
                />

                {t('myTransport.availableToggle')}
              </label>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onEdit?.(provider)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-white/60 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
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
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-red-300/75 hover:bg-red-400/10 hover:text-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
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
          <div className="mt-auto grid gap-2 pt-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleContact}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-green-600 to-green-800 px-4 text-sm font-bold text-white shadow-lg shadow-green-900/20 transition-transform hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              aria-label={`${t('contact')} ${provider.businessName}`}
            >
              <Phone
                className="h-4 w-4"
                aria-hidden="true"
              />

              {t('contact')}
            </button>

            {mapUrl ? (
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                aria-label={`${t('directions')} ${provider.businessName}`}
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

      {/* Contact Confirmation */}
      {contactConfirmationOpen ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="transport-contact-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-green-950 p-5 shadow-2xl sm:p-6">
            {/* Dialog Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                  <Phone
                    className="h-5 w-5"
                    aria-hidden="true"
                  />
                </div>

                <div>
                  <h2
                    id="transport-contact-title"
                    className="text-lg font-bold text-white"
                  >
                    {t('contactConfirmation.title')}
                  </h2>

                  <p className="mt-1 text-sm text-white/45">
                    {provider.businessName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCancelContact}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/45 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                aria-label={t('contactConfirmation.cancel')}
              >
                <X
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              </button>
            </div>

            {/* Message */}
            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-sm leading-6 text-white/65">
                {t('contactConfirmation.description')}
              </p>

              <p className="mt-3 text-base font-semibold text-white">
                {provider.phoneNumber}
              </p>
            </div>

            {/* Actions */}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={handleCancelContact}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              >
                {t('contactConfirmation.cancel')}
              </button>

              <button
                type="button"
                onClick={handleConfirmContact}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-green-600 to-green-800 text-sm font-bold text-white shadow-lg shadow-green-900/20 hover:from-green-500 hover:to-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              >
                <Phone
                  className="h-4 w-4"
                  aria-hidden="true"
                />

                {t('contactConfirmation.call')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
