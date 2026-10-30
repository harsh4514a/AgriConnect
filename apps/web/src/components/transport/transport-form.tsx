'use client';

import {
  createTransportProvider,
  updateTransportProvider,
  type CreateTransportPayload,
  type TransportProvider,
  type TransportVehicleType,
} from '@/services/api/transport.api';
import {
  Check,
  ChevronDown,
  Loader2,
  MapPin,
  Pencil,
  Phone,
  Truck,
  X,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { getLocalizedDomainName } from '@agri/domain-data';

import {
  getDistricts,
  getProfile,
  getStates,
  getTalukas,
  getVillages,
  type LocationOption,
} from '@/services/api/auth.api';

const VEHICLE_TYPES: TransportVehicleType[] = [
  'tractor',
  'tractor_trailer',
  'pickup',
  'mini_truck',
  'truck',
  'other',
];

type TransportFormProps = {
  open: boolean;
  initial?: TransportProvider | null;
  onClose: () => void;
  onSaved: (transport: TransportProvider) => void;
};

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, '');

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }

  return value.trim();
}

function getDisplayName(profile: {
  firstName?: string | null;
  lastName?: string | null;
}) {
  return [profile.firstName?.trim(), profile.lastName?.trim()]
    .filter(Boolean)
    .join(' ');
}

export function TransportForm({
  open,
  initial,
  onClose,
  onSaved,
}: TransportFormProps) {
  const t = useTranslations('dashboard.transport');
  const locale = useLocale();

  const isEdit = Boolean(initial);

  const [step, setStep] = useState<1 | 2>(1);

  const [providerName, setProviderName] = useState(
    initial?.businessName ?? '',
  );

  const [phoneNumber, setPhoneNumber] = useState(
    initial?.phoneNumber ?? '',
  );

  const [vehicleType, setVehicleType] =
    useState<TransportVehicleType>(
      (initial?.vehicleType as TransportVehicleType) ?? 'tractor',
    );

  const [customVehicleType, setCustomVehicleType] = useState('');

  const [districtId, setDistrictId] = useState(
    initial?.district.id ?? '',
  );

  const [talukaId, setTalukaId] = useState(
    initial?.taluka?.id ?? '',
  );

  const [villageId, setVillageId] = useState(
    initial?.village?.id ?? '',
  );

  const [additionalDetails, setAdditionalDetails] = useState(
    initial?.additionalDetails ?? '',
  );

  const [isAvailable, setIsAvailable] = useState(
    initial?.isAvailable ?? true,
  );

  const [districts, setDistricts] = useState<LocationOption[]>([]);
  const [talukas, setTalukas] = useState<LocationOption[]>([]);
  const [villages, setVillages] = useState<LocationOption[]>([]);

  const [locationLoading, setLocationLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const locationTouchedRef = useRef(false);
  const contactTouchedRef = useRef(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      initializedRef.current = false;
      locationTouchedRef.current = false;
      contactTouchedRef.current = false;

      setStep(1);

      return;
    }

    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;

    setStep(1);
    setErrors({});

    setProviderName(initial?.businessName ?? '');
    setPhoneNumber(initial?.phoneNumber ?? '');

    setVehicleType(
      (initial?.vehicleType as TransportVehicleType) ?? 'tractor',
    );

    setCustomVehicleType(
      initial?.vehicleType === 'other'
        ? (
            initial as TransportProvider & {
              customVehicleType?: string;
            }
          ).customVehicleType ?? ''
        : '',
    );

    setDistrictId(initial?.district.id ?? '');
    setTalukaId(initial?.taluka?.id ?? '');
    setVillageId(initial?.village?.id ?? '');

    setAdditionalDetails(initial?.additionalDetails ?? '');
    setIsAvailable(initial?.isAvailable ?? true);

    const initialise = async () => {
      setLoadingProfile(true);
      setLocationLoading(true);

      try {
        const profile = await getProfile();

        if (!isEdit) {
          if (!contactTouchedRef.current && profile.mobileNumber) {
            setPhoneNumber(
              (current) => current || profile.mobileNumber,
            );
          }

          if (!locationTouchedRef.current) {
            setProviderName(getDisplayName(profile));
          }
        }

        let stateId = profile.state?.id;

        if (!stateId) {
          const states = await getStates();

          stateId = states.find(
            (item) =>
              item.name.trim().toLowerCase() === 'gujarat',
          )?.id;
        }

        if (!stateId) {
          return;
        }

        const districtOptions = await getDistricts(stateId);

        setDistricts(districtOptions);

        const nextDistrictId =
          initial?.district.id ??
          profile.district?.id ??
          '';

        if (
          !nextDistrictId ||
          locationTouchedRef.current
        ) {
          return;
        }

        setDistrictId(nextDistrictId);

        const talukaOptions =
          await getTalukas(nextDistrictId);

        setTalukas(talukaOptions);

        const nextTalukaId =
          initial?.taluka?.id ??
          profile.taluka?.id ??
          '';

        if (
          !nextTalukaId ||
          locationTouchedRef.current
        ) {
          return;
        }

        setTalukaId(nextTalukaId);

        const villageOptions =
          await getVillages(nextTalukaId);

        setVillages(villageOptions);

        const nextVillageId =
          initial?.village?.id ??
          profile.village?.id ??
          '';

        if (
          nextVillageId &&
          !locationTouchedRef.current
        ) {
          setVillageId(nextVillageId);
        }
      } catch {
        // The form remains usable.
        // The user can select the location manually.
      } finally {
        setLoadingProfile(false);
        setLocationLoading(false);
      }
    };

    void initialise();
  }, [open, initial, isEdit]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener(
        'keydown',
        handleEscape,
      );
    };
  }, [open, onClose, saving]);

  const handleDistrictChange = async (value: string) => {
    locationTouchedRef.current = true;

    setDistrictId(value);
    setTalukaId('');
    setVillageId('');

    setTalukas([]);
    setVillages([]);

    setErrors((current) => {
      const next = { ...current };

      delete next.districtId;
      delete next.talukaId;
      delete next.villageId;

      return next;
    });

    if (!value) {
      return;
    }

    setLocationLoading(true);

    try {
      const nextTalukas = await getTalukas(value);

      setTalukas(nextTalukas);
    } catch {
      toast.error(t('form.locationLoadError'));
    } finally {
      setLocationLoading(false);
    }
  };

  const handleTalukaChange = async (value: string) => {
    locationTouchedRef.current = true;

    setTalukaId(value);
    setVillageId('');

    setVillages([]);

    setErrors((current) => {
      const next = { ...current };

      delete next.talukaId;
      delete next.villageId;

      return next;
    });

    if (!value) {
      return;
    }

    setLocationLoading(true);

    try {
      const nextVillages = await getVillages(value);

      setVillages(nextVillages);
    } catch {
      toast.error(t('form.locationLoadError'));
    } finally {
      setLocationLoading(false);
    }
  };

  const validate = () => {
    const next: Record<string, string> = {};

    const normalizedPhone = phoneNumber
      .replace(/[\s-]/g, '')
      .trim();

    if (
      !normalizedPhone ||
      !/^(?:\+91)?[6-9]\d{9}$/.test(normalizedPhone)
    ) {
      next.phoneNumber = t('form.validation.phone');
    }

    if (
      vehicleType === 'other' &&
      !customVehicleType.trim()
    ) {
      next.customVehicleType = t(
        'vehicleTypes.other',
      );
    }

    if (!districtId) {
      next.districtId = t(
        'form.validation.district',
      );
    }

    if (!talukaId) {
      next.talukaId = t(
        'form.validation.taluka',
      );
    }

    if (!villageId) {
      next.villageId = t(
        'form.validation.village',
      );
    }

    setErrors(next);

    return Object.keys(next).length === 0;
  };

  const handleReview = () => {
    if (validate()) {
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    if (!validate()) {
      setStep(1);
      return;
    }

    setSaving(true);

    try {
      const payload: CreateTransportPayload = {
        vehicleType,

        ...(vehicleType === 'other'
          ? {
              customVehicleType:
                customVehicleType.trim(),
            }
          : {}),

        phoneNumber: normalizePhone(phoneNumber),

        districtId,
        talukaId,
        villageId,

        additionalDetails:
          additionalDetails.trim() || undefined,

        isAvailable,
      };

      const savedTransport: TransportProvider =
        initial
          ? await updateTransportProvider(
              initial.id,
              payload,
            )
          : await createTransportProvider(payload);

      toast.success(
        initial
          ? t('form.success.updated')
          : t('form.success.created'),
      );

      /*
       * IMPORTANT:
       * The parent page expects:
       *
       * (transport: TransportProvider) => void
       *
       * Therefore onSaved must receive exactly
       * TransportProvider instead of unknown.
       */
      onSaved(savedTransport);

      onClose();
    } catch {
      toast.error(t('form.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return null;
  }

  const locationLabel = [
    villageId &&
      villages.find(
        (item) => item.id === villageId,
      )?.name,

    talukaId &&
      talukas.find(
        (item) => item.id === talukaId,
      )?.name,

    districtId &&
      districts.find(
        (item) => item.id === districtId,
      )?.name,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transport-form-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label={t('form.close')}
        onClick={() => !saving && onClose()}
      />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-border bg-surface shadow-2xl sm:rounded-3xl">
        <header className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              {step === 1
                ? t('form.detailsStep')
                : t('form.reviewStep')}
            </p>

            <h2
              id="transport-form-title"
              className="mt-0.5 text-lg font-bold text-foreground"
            >
              {initial
                ? t('form.editTitle')
                : t('form.addTitle')}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-surface-subtle text-muted-foreground hover:bg-surface-subtle hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-40"
            aria-label={t('form.close')}
          >
            <X
              className="h-5 w-5"
              aria-hidden="true"
            />
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          {step === 1 ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-border bg-surface-subtle p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <Truck
                      className="h-5 w-5"
                      aria-hidden="true"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {providerName ||
                        t('form.profileName')}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {t(
                        'form.profilePrefillHint',
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={
                  vehicleType === 'other'
                    ? 'grid gap-4 sm:grid-cols-2'
                    : 'grid gap-4'
                }
              >
                <Field
                  label={t(
                    'form.vehicleType',
                  )}
                  htmlFor="transport-vehicle"
                >
                  <Select
                    id="transport-vehicle"
                    value={vehicleType}
                    onChange={(event) => {
                      const nextType =
                        event.target.value as TransportVehicleType;

                      setVehicleType(nextType);

                      if (nextType !== 'other') {
                        setCustomVehicleType('');
                      }

                      setErrors((current) => {
                        if (
                          !current.customVehicleType
                        ) {
                          return current;
                        }

                        const next = {
                          ...current,
                        };

                        delete next.customVehicleType;

                        return next;
                      });
                    }}
                    aria-label={t(
                      'form.vehicleType',
                    )}
                  >
                    {VEHICLE_TYPES.map((type) => (
                      <option
                        key={type}
                        value={type}
                        className="bg-surface"
                      >
                        {t(
                          `vehicleTypes.${type}`,
                        )}
                      </option>
                    ))}
                  </Select>
                </Field>

                {vehicleType === 'other' ? (
                  <Field
                    label={t(
                      'vehicleTypes.other',
                    )}
                    htmlFor="transport-custom-vehicle"
                    error={
                      errors.customVehicleType
                    }
                  >
                    <input
                      id="transport-custom-vehicle"
                      type="text"
                      value={customVehicleType}
                      onChange={(event) => {
                        setCustomVehicleType(
                          event.target.value,
                        );

                        setErrors((current) => {
                          if (
                            !current.customVehicleType
                          ) {
                            return current;
                          }

                          const next = {
                            ...current,
                          };

                          delete next.customVehicleType;

                          return next;
                        });
                      }}
                      maxLength={100}
                      autoComplete="off"
                      className={inputClass(
                        Boolean(
                          errors.customVehicleType,
                        ),
                      )}
                      placeholder={t(
                        'vehicleTypes.other',
                      )}
                      aria-label={t(
                        'vehicleTypes.other',
                      )}
                    />
                  </Field>
                ) : null}
              </div>

              <Field
                label={t(
                  'form.contactNumber',
                )}
                htmlFor="transport-phone"
                error={errors.phoneNumber}
              >
                <div className="relative">
                  <Phone
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />

                  <input
                    id="transport-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phoneNumber}
                    onChange={(event) => {
                      contactTouchedRef.current =
                        true;

                      setPhoneNumber(
                        event.target.value,
                      );
                    }}
                    className={`${inputClass( Boolean(errors.phoneNumber), )} pl-10`}
                    placeholder={t(
                      'form.contactPlaceholder',
                    )}
                  />
                </div>

                <p className="mt-1.5 text-xs text-muted-foreground">
                  {t('form.contactHint')}
                </p>
              </Field>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    className="text-sm font-semibold text-foreground"
                    htmlFor="transport-district"
                  >
                    {t('form.location')}
                  </label>

                  {loadingProfile ||
                  locationLoading ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Loader2
                        className="h-3.5 w-3.5 animate-spin"
                        aria-hidden="true"
                      />

                      {t(
                        'form.loadingLocation',
                      )}
                    </span>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <Select
                    id="transport-district"
                    value={districtId}
                    onChange={(event) =>
                      void handleDistrictChange(
                        event.target.value,
                      )
                    }
                    aria-label={t(
                      'filters.district',
                    )}
                  >
                    <option
                      value=""
                      className="bg-surface"
                    >
                      {t(
                        'filters.allDistricts',
                      )}
                    </option>

                    {districts.map((option) => (
                      <option
                        key={option.id}
                        value={option.id}
                        className="bg-surface"
                      >
                        {getLocalizedDomainName(option.name, locale, 'district')}
                      </option>
                    ))}
                  </Select>

                  <Select
                    value={talukaId}
                    onChange={(event) =>
                      void handleTalukaChange(
                        event.target.value,
                      )
                    }
                    disabled={
                      !districtId ||
                      locationLoading
                    }
                    aria-label={t(
                      'filters.taluka',
                    )}
                  >
                    <option
                      value=""
                      className="bg-surface"
                    >
                      {t(
                        'filters.allTalukas',
                      )}
                    </option>

                    {talukas.map((option) => (
                      <option
                        key={option.id}
                        value={option.id}
                        className="bg-surface"
                      >
                        {getLocalizedDomainName(option.name, locale, 'taluka')}
                      </option>
                    ))}
                  </Select>

                  <Select
                    value={villageId}
                    onChange={(event) => {
                      locationTouchedRef.current =
                        true;

                      setVillageId(
                        event.target.value,
                      );

                      setErrors((current) => {
                        const next = {
                          ...current,
                        };

                        delete next.villageId;

                        return next;
                      });
                    }}
                    disabled={
                      !talukaId ||
                      locationLoading
                    }
                    aria-label={t(
                      'filters.village',
                    )}
                  >
                    <option
                      value=""
                      className="bg-surface"
                    >
                      {t(
                        'filters.allVillages',
                      )}
                    </option>

                    {villages.map((option) => (
                      <option
                        key={option.id}
                        value={option.id}
                        className="bg-surface"
                      >
                        {getLocalizedDomainName(option.name, locale, 'village')}
                      </option>
                    ))}
                  </Select>
                </div>

                {errors.districtId ||
                errors.talukaId ||
                errors.villageId ? (
                  <p className="mt-1.5 text-xs text-danger">
                    {errors.districtId ||
                      errors.talukaId ||
                      errors.villageId}
                  </p>
                ) : null}

                {locationLabel ? (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    />

                    {locationLabel}
                  </p>
                ) : null}
              </div>

              <Field
                label={t(
                  'form.additionalDetails',
                )}
                htmlFor="transport-details"
                optionalLabel={t(
                  'form.optional',
                )}
              >
                <textarea
                  id="transport-details"
                  value={additionalDetails}
                  maxLength={500}
                  onChange={(event) =>
                    setAdditionalDetails(
                      event.target.value,
                    )
                  }
                  rows={3}
                  className="w-full resize-none rounded-xl border border-border bg-surface px-3.5 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-focus focus:ring-2 focus:ring-focus"
                  placeholder={t(
                    'form.additionalDetailsPlaceholder',
                  )}
                />
              </Field>

              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border bg-surface p-3.5">
                <span>
                  <span className="block text-sm font-semibold text-foreground">
                    {t(
                      'form.availableNow',
                    )}
                  </span>

                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {t(
                      'form.availableHint',
                    )}
                  </span>
                </span>

                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(event) =>
                    setIsAvailable(
                      event.target.checked,
                    )
                  }
                  className="h-5 w-5 accent-accent"
                />
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-surface p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <ReviewItem
                    label={t(
                      'form.contactNumber',
                    )}
                    value={phoneNumber}
                  />

                  <ReviewItem
                    label={t(
                      'form.vehicleType',
                    )}
                    value={
                      vehicleType === 'other' &&
                      customVehicleType.trim()
                        ? customVehicleType.trim()
                        : t(
                            `vehicleTypes.${vehicleType}`,
                          )
                    }
                  />

                  <ReviewItem
                    label={t('form.location')}
                    value={
                      locationLabel ||
                      t(
                        'form.locationMissing',
                      )
                    }
                  />

                  <ReviewItem
                    label={t(
                      'form.availability',
                    )}
                    value={
                      isAvailable
                        ? t('available')
                        : t('unavailable')
                    }
                  />
                </div>

                {additionalDetails.trim() ? (
                  <div className="mt-4 border-t border-border pt-4">
                    <ReviewItem
                      label={t(
                        'form.additionalDetails',
                      )}
                      value={additionalDetails.trim()}
                    />
                  </div>
                ) : null}
              </div>

              <div className="rounded-xl bg-accent-soft p-3 text-xs leading-5 text-muted-foreground">
                {t('form.reviewHint')}
              </div>
            </div>
          )}
        </div>

        <footer className="flex gap-2 border-t border-border bg-surface/95 px-5 py-4 sm:px-6">
          {step === 2 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={saving}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface-subtle px-4 text-sm font-semibold text-foreground hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-40"
            >
              <Pencil
                className="h-4 w-4"
                aria-hidden="true"
              />

              {t('form.edit')}
            </button>
          ) : null}

          <button
            type="button"
            onClick={
              step === 1
                ? handleReview
                : handleSubmit
            }
            disabled={saving}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground shadow-sm hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <Loader2
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : step === 1 ? (
              <Check
                className="h-4 w-4"
                aria-hidden="true"
              />
            ) : (
              <Truck
                className="h-4 w-4"
                aria-hidden="true"
              />
            )}

            {saving
              ? t('form.saving')
              : step === 1
                ? t('form.review')
                : t('form.publish')}
          </button>
        </footer>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  error,
  optionalLabel,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  optionalLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-semibold text-foreground"
      >
        {label}

        {optionalLabel ? (
          <span className="ml-1.5 font-normal text-muted-foreground">
            ({optionalLabel})
          </span>
        ) : null}
      </label>

      {children}

      {error ? (
        <p className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Select({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className="h-11 w-full appearance-none rounded-xl border border-border bg-surface px-3 pr-9 text-sm text-foreground outline-none transition-colors focus:border-focus focus:ring-2 focus:ring-focus disabled:cursor-not-allowed disabled:opacity-40"
      >
        {children}
      </select>

      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
    </div>
  );
}

function inputClass(error: boolean) {
  return `h-11 w-full rounded-xl border ${
    error
      ? 'border-red-400/60'
      : 'border-border'
  } bg-surface px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-focus focus:ring-2 focus:ring-focus`;
}

function ReviewItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold leading-5 text-foreground">
        {value}
      </p>
    </div>
  );
}
