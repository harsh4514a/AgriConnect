'use client';

import { useEffect, useMemo, useState, useId } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Edit3, Check, X, Building2, Landmark, Compass, Calendar, FileText, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';
import { getLocalizedDomainName } from '@agri/domain-data';
import { getDistricts, getStates, getTalukas, getVillages, type LocationOption } from '@/services/api/auth.api';
import type { Locale } from '@/i18n/config';

interface StepLocationDetailsProps {
  village: string;
  taluka: string;
  district: string;
  cropDate: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  errors: Record<string, string>;
  isPrefilledFromProfile?: boolean;
  onChange: (fields: {
    village?: string;
    taluka?: string;
    district?: string;
    cropDate?: string;
    description?: string;
    latitude?: number | null;
    longitude?: number | null;
  }) => void;
}

export function StepLocationDetails({
  village,
  taluka,
  district,
  cropDate,
  description,
  latitude,
  longitude,
  errors,
  isPrefilledFromProfile = true,
  onChange,
}: StepLocationDetailsProps) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const districtId = useId();
  const talukaId = useId();
  const villageId = useId();

  const [isEditing, setIsEditing] = useState(false);
  const [tempDistrict, setTempDistrict] = useState(district);
  const [tempTaluka, setTempTaluka] = useState(taluka);
  const [tempVillage, setTempVillage] = useState(village);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [districtsList, setDistrictsList] = useState<LocationOption[]>([]);
  const [talukasForDistrict, setTalukasForDistrict] = useState<LocationOption[]>([]);
  const [villagesForTaluka, setVillagesForTaluka] = useState<LocationOption[]>([]);
  const [isCapturingCoordinates, setIsCapturingCoordinates] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const states = await getStates(locale);
        const gujarat = states.find((item) => item.name.trim().toLowerCase() === 'gujarat');
        const districts = gujarat ? await getDistricts(gujarat.id, locale) : [];
        if (!cancelled) setDistrictsList(districts);
      } catch {
        if (!cancelled) setDistrictsList([]);
      }
    })();
    return () => { cancelled = true; };
  }, [locale]);

  const selectedDistrict = useMemo(
    () => districtsList.find((item) => item.name === tempDistrict),
    [districtsList, tempDistrict],
  );

  useEffect(() => {
    let cancelled = false;
    if (!selectedDistrict) {
      setTalukasForDistrict([]);
      setVillagesForTaluka([]);
      return () => { cancelled = true; };
    }
    void getTalukas(selectedDistrict.id, locale)
      .then((options) => { if (!cancelled) setTalukasForDistrict(options); })
      .catch(() => { if (!cancelled) setTalukasForDistrict([]); });
    return () => { cancelled = true; };
  }, [locale, selectedDistrict]);

  const selectedTaluka = useMemo(
    () => talukasForDistrict.find((item) => item.name === tempTaluka),
    [talukasForDistrict, tempTaluka],
  );

  useEffect(() => {
    let cancelled = false;
    if (!selectedTaluka) {
      setVillagesForTaluka([]);
      return () => { cancelled = true; };
    }
    void getVillages(selectedTaluka.id, locale)
      .then((options) => { if (!cancelled) setVillagesForTaluka(options); })
      .catch(() => { if (!cancelled) setVillagesForTaluka([]); });
    return () => { cancelled = true; };
  }, [locale, selectedTaluka]);

  const handleStartEdit = () => {
    setTempDistrict(district);
    setTempTaluka(taluka);
    setTempVillage(village);
    setEditErrors({});
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setTempDistrict(district);
    setTempTaluka(taluka);
    setTempVillage(village);
    setEditErrors({});
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    const nextErrors: Record<string, string> = {};
    if (!tempDistrict) {
      nextErrors.district = t('dashboard.createListing.errors.districtRequired');
    }
    if (!tempTaluka) {
      nextErrors.taluka = t('dashboard.createListing.errors.talukaRequired');
    }
    if (!tempVillage) {
      nextErrors.village = t('dashboard.createListing.errors.villageRequired');
    }

    if (Object.keys(nextErrors).length > 0) {
      setEditErrors(nextErrors);
      toast.error(t('dashboard.createListing.errors.incompleteLocation'));
      return;
    }

    const locationChanged =
      tempDistrict !== district || tempTaluka !== taluka || tempVillage !== village;
    onChange({
      district: tempDistrict,
      taluka: tempTaluka,
      village: tempVillage,
      ...(locationChanged
        ? { latitude: null, longitude: null }
        : {}),
    });
    setEditErrors({});
    setIsEditing(false);
    toast.success(t('dashboard.createListing.fields.locationUpdated'));
  };

  const handleDistrictChange = (newDistrict: string) => {
    setTempDistrict(newDistrict);
    setTempTaluka('');
    setTempVillage('');
    setTalukasForDistrict([]);
    setVillagesForTaluka([]);
    setEditErrors((prev) => ({ ...prev, district: '', taluka: '', village: '' }));
  };

  const handleTalukaChange = (newTaluka: string) => {
    setTempTaluka(newTaluka);
    setTempVillage('');
    setVillagesForTaluka([]);
    setEditErrors((prev) => ({ ...prev, taluka: '', village: '' }));
  };

  const handleVillageChange = (newVillage: string) => {
    setTempVillage(newVillage);
    setEditErrors((prev) => ({ ...prev, village: '' }));
  };

  const getDistrictDisplayLabel = (d: string) => {
    if (!d) return '—';
    return getLocalizedDomainName(d, locale, 'district');
  };

  const handleCaptureCoordinates = () => {
    if (!navigator.geolocation) {
      toast.error(t('dashboard.createListing.fields.farmCoordinatesCaptureFailed'));
      return;
    }

    setIsCapturingCoordinates(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        onChange({ latitude: coords.latitude, longitude: coords.longitude });
        setIsCapturingCoordinates(false);
        toast.success(t('dashboard.createListing.fields.farmCoordinatesCaptured'));
      },
      () => {
        setIsCapturingCoordinates(false);
        toast.error(t('dashboard.createListing.fields.farmCoordinatesCaptureFailed'));
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  };

  const inputClass = (hasError: boolean) =>
    cn(
      'h-12 w-full rounded-xl border bg-surface-subtle px-4 text-sm text-foreground placeholder-muted-foreground backdrop-blur-xl transition-all focus:bg-surface-subtle focus:outline-none focus:ring-2',
      hasError
        ? 'border-red-400 focus:border-red-400 focus:ring-danger/30'
        : 'border-border focus:border-focus focus:ring-focus',
    );

  const selectClass = (hasError: boolean, disabled: boolean) =>
    cn(
      'h-12 w-full rounded-xl border px-3 text-sm text-foreground transition-all focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-45',
      disabled
        ? 'border-border bg-surface/[0.03] text-muted-foreground'
        : hasError
          ? 'border-red-400 bg-surface text-foreground focus:border-red-400 focus:ring-danger/30'
          : 'border-border bg-surface text-foreground focus:border-focus focus:ring-focus',
    );

  const displayLocation = [
    getLocalizedDomainName(village, locale, 'village'),
    getLocalizedDomainName(taluka, locale, 'taluka'),
    getDistrictDisplayLabel(district),
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="space-y-8">
      {/* ─── Location Section ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent ring-1 ring-focus">
              <MapPin className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground sm:text-lg">
                {t('dashboard.createListing.fields.locationSection')}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isPrefilledFromProfile
                  ? t('dashboard.createListing.fields.locationPrefilled')
                  : t('dashboard.createListing.fields.locationCustomized')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface-subtle p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-muted-foreground">
            <p>{t('dashboard.createListing.fields.farmCoordinatesHelp')}</p>
            {latitude !== null && longitude !== null ? (
              <p className="mt-1 font-medium text-accent">
                {t('dashboard.createListing.fields.farmCoordinatesCaptured')}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleCaptureCoordinates}
            disabled={isCapturingCoordinates || isEditing}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-accent/30 bg-accent-soft px-4 py-2 text-xs font-semibold text-accent transition-colors hover:bg-accent/15 disabled:cursor-wait disabled:opacity-60"
          >
            <Navigation className="h-4 w-4" aria-hidden="true" />
            {t(isCapturingCoordinates
              ? 'dashboard.createListing.fields.capturingFarmCoordinates'
              : 'dashboard.createListing.fields.captureFarmCoordinates')}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {!isEditing ? (
            /* ─── Summary Card View ─── */
            <motion.div
              key="summary-view"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="relative overflow-hidden rounded-2xl border border-border bg-surface-subtle p-5 sm:p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
                    <Compass className="h-3.5 w-3.5 animate-pulse text-accent" />
                    <span>
                      {isPrefilledFromProfile
                        ? t('dashboard.createListing.fields.locationPrefilled')
                        : t('dashboard.createListing.fields.locationCustomized')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <MapPin className="h-5 w-5 shrink-0 text-accent" aria-hidden />
                    <p className="text-base font-extrabold tracking-wide text-foreground sm:text-lg">
                      {displayLocation || t('dashboard.createListing.errors.incompleteLocation')}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-subtle px-2.5 py-1 text-xs text-foreground">
                      <Landmark className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">{t('dashboard.createListing.fields.district')}:</span>
                      <span className="font-semibold text-foreground">{getDistrictDisplayLabel(district)}</span>
                    </div>

                    {taluka && (
                      <div className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-subtle px-2.5 py-1 text-xs text-foreground">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">{t('dashboard.createListing.fields.taluka')}:</span>
                        <span className="font-semibold text-foreground">{getLocalizedDomainName(taluka, locale, 'taluka')}</span>
                      </div>
                    )}

                    {village && (
                      <div className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-subtle px-2.5 py-1 text-xs text-foreground">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">{t('dashboard.createListing.fields.village')}:</span>
                        <span className="font-semibold text-foreground">{getLocalizedDomainName(village, locale, 'village')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 sm:pt-0">
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-accent/30 bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground shadow-sm transition-all duration-200 hover:border-green-400 hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:scale-95 sm:w-auto"
                  >
                    <Edit3 className="h-4 w-4 text-accent" />
                    <span>{t('dashboard.createListing.fields.editLocation')}</span>
                  </button>
                </div>
              </div>

              {(errors.district || errors.village || errors.taluka) && (
                <div className="mt-4 rounded-xl border border-red-500/30 bg-danger-soft p-3 text-xs font-semibold text-danger">
                  {errors.district || errors.taluka || errors.village}
                </div>
              )}
            </motion.div>
          ) : (
            /* ─── Dependent Dropdowns Edit View ─── */
            <motion.div
              key="edit-view"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-5 rounded-2xl border border-green-500/30 bg-black/50 p-5 shadow-2xl backdrop-blur-xl sm:p-6"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground sm:text-base">
                    {t('dashboard.createListing.fields.editLocationTitle')}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t('dashboard.createListing.fields.editLocationSubtitle')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* 1. District Dropdown */}
                <div className="space-y-1.5">
                  <label htmlFor={districtId} className="block text-xs font-semibold text-foreground">
                    {t('dashboard.createListing.fields.district')} <span className="text-danger">*</span>
                  </label>
                  <select
                    id={districtId}
                    value={tempDistrict}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    aria-required="true"
                    aria-invalid={editErrors.district ? 'true' : 'false'}
                    aria-describedby={editErrors.district ? `${districtId}-error` : undefined}
                    className={selectClass(Boolean(editErrors.district), false)}
                  >
                    <option value="" disabled>
                      {t('dashboard.createListing.fields.selectDistrict')}
                    </option>
                    {districtsList.map((option) => (
                      <option key={option.id} value={option.name} className="bg-surface text-foreground">
                        {getDistrictDisplayLabel(option.name)}
                      </option>
                    ))}
                  </select>
                  {editErrors.district && (
                    <p id={`${districtId}-error`} role="alert" className="text-xs font-medium text-danger">
                      {editErrors.district}
                    </p>
                  )}
                </div>

                {/* 2. Taluka Dropdown */}
                <div className="space-y-1.5">
                  <label htmlFor={talukaId} className="block text-xs font-semibold text-foreground">
                    {t('dashboard.createListing.fields.taluka')} <span className="text-danger">*</span>
                  </label>
                  <select
                    id={talukaId}
                    value={tempTaluka}
                    disabled={!tempDistrict}
                    onChange={(e) => handleTalukaChange(e.target.value)}
                    aria-required="true"
                    aria-invalid={editErrors.taluka ? 'true' : 'false'}
                    aria-describedby={editErrors.taluka ? `${talukaId}-error` : undefined}
                    className={selectClass(Boolean(editErrors.taluka), !tempDistrict)}
                  >
                    <option value="" disabled>
                      {tempDistrict
                        ? t('dashboard.createListing.fields.selectTaluka')
                        : t('dashboard.createListing.fields.selectDistrictFirst')}
                    </option>
                    {talukasForDistrict.map((option) => (
                      <option key={option.id} value={option.name} className="bg-surface text-foreground">
                        {getLocalizedDomainName(option.name, locale, 'taluka')}
                      </option>
                    ))}
                  </select>
                  {editErrors.taluka && (
                    <p id={`${talukaId}-error`} role="alert" className="text-xs font-medium text-danger">
                      {editErrors.taluka}
                    </p>
                  )}
                </div>

                {/* 3. Village Dropdown */}
                <div className="space-y-1.5">
                  <label htmlFor={villageId} className="block text-xs font-semibold text-foreground">
                    {t('dashboard.createListing.fields.village')} <span className="text-danger">*</span>
                  </label>
                  <select
                    id={villageId}
                    value={tempVillage}
                    disabled={!tempTaluka}
                    onChange={(e) => handleVillageChange(e.target.value)}
                    aria-required="true"
                    aria-invalid={editErrors.village ? 'true' : 'false'}
                    aria-describedby={editErrors.village ? `${villageId}-error` : undefined}
                    className={selectClass(Boolean(editErrors.village), !tempTaluka)}
                  >
                    <option value="" disabled>
                      {tempTaluka
                        ? t('dashboard.createListing.fields.selectVillage')
                        : t('dashboard.createListing.fields.selectTalukaFirst')}
                    </option>
                    {villagesForTaluka.map((option) => (
                      <option key={option.id} value={option.name} className="bg-surface text-foreground">
                        {getLocalizedDomainName(option.name, locale, 'village')}
                      </option>
                    ))}
                  </select>
                  {editErrors.village && (
                    <p id={`${villageId}-error`} role="alert" className="text-xs font-medium text-danger">
                      {editErrors.village}
                    </p>
                  )}
                </div>
              </div>

              {/* Edit Actions: Cancel & Save */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-border bg-surface-subtle px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-surface-subtle hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:scale-95"
                >
                  <X className="h-4 w-4" />
                  <span>{t('dashboard.createListing.fields.cancelLocationEdit')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-accent to-accent px-5 py-2 text-xs font-bold text-accent-foreground shadow-lg transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:scale-95"
                >
                  <Check className="h-4 w-4" />
                  <span>{t('dashboard.createListing.fields.saveLocation')}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Crop Date Section ─── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-accent" aria-hidden />
          <label htmlFor="cropDate" className="block text-sm font-semibold text-foreground">
            {t('dashboard.createListing.fields.cropDate')} <span className="text-danger">*</span>
          </label>
        </div>

        <input
          id="cropDate"
          type="date"
          value={cropDate}
          onChange={(e) => onChange({ cropDate: e.target.value })}
          aria-required="true"
          aria-invalid={errors.cropDate ? 'true' : 'false'}
          aria-describedby={errors.cropDate ? 'cropDate-error' : undefined}
          className={inputClass(Boolean(errors.cropDate))}
        />
        {errors.cropDate && (
          <p id="cropDate-error" role="alert" className="text-xs font-medium text-danger">
            {errors.cropDate}
          </p>
        )}
      </div>

      {/* ─── Additional Details Section ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-accent" aria-hidden />
            <label htmlFor="description" className="block text-sm font-semibold text-foreground">
              {t('dashboard.createListing.fields.descriptionOptional')}
            </label>
          </div>
          <span className="text-xs font-medium text-muted-foreground">{description.length}/500</span>
        </div>

        <textarea
          id="description"
          rows={4}
          maxLength={500}
          value={description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder={t('dashboard.createListing.fields.descriptionPlaceholder')}
          className="w-full rounded-xl border border-border bg-surface-subtle p-4 text-sm text-foreground placeholder-muted-foreground backdrop-blur-xl transition-all focus:border-focus focus:bg-surface-subtle focus:outline-none focus:ring-2 focus:ring-focus"
        />
      </div>
    </div>
  );
}
