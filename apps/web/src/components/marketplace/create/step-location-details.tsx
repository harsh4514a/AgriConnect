'use client';

import { useEffect, useMemo, useState, useId } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Edit3, Check, X, Building2, Landmark, Compass, Calendar, FileText } from 'lucide-react';
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
  errors: Record<string, string>;
  isPrefilledFromProfile?: boolean;
  onChange: (fields: {
    village?: string;
    taluka?: string;
    district?: string;
    cropDate?: string;
    description?: string;
  }) => void;
}

export function StepLocationDetails({
  village,
  taluka,
  district,
  cropDate,
  description,
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

    onChange({
      district: tempDistrict,
      taluka: tempTaluka,
      village: tempVillage,
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

  const inputClass = (hasError: boolean) =>
    cn(
      'h-12 w-full rounded-xl border bg-white/5 px-4 text-sm text-white placeholder-white/40 backdrop-blur-xl transition-all focus:bg-white/10 focus:outline-none focus:ring-2',
      hasError
        ? 'border-red-400 focus:border-red-400 focus:ring-red-400/30'
        : 'border-white/15 focus:border-green-400 focus:ring-green-400/30',
    );

  const selectClass = (hasError: boolean, disabled: boolean) =>
    cn(
      'h-12 w-full rounded-xl border px-3 text-sm text-white transition-all focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-45',
      disabled
        ? 'border-white/10 bg-white/[0.03] text-white/40'
        : hasError
          ? 'border-red-400 bg-green-950/90 text-white focus:border-red-400 focus:ring-red-400/30'
          : 'border-white/15 bg-green-950/90 text-white focus:border-green-400 focus:ring-green-400/30',
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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/15 text-green-300 ring-1 ring-green-500/20">
              <MapPin className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-base font-bold text-white sm:text-lg">
                {t('dashboard.createListing.fields.locationSection')}
              </h2>
              <p className="text-xs text-white/60">
                {isPrefilledFromProfile
                  ? t('dashboard.createListing.fields.locationPrefilled')
                  : t('dashboard.createListing.fields.locationCustomized')}
              </p>
            </div>
          </div>
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
              className="relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-green-950/60 via-black/40 to-green-950/40 p-5 shadow-xl backdrop-blur-xl sm:p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-green-400/30 bg-green-900/30 px-3 py-1 text-xs font-semibold text-green-300">
                    <Compass className="h-3.5 w-3.5 animate-pulse text-green-400" />
                    <span>
                      {isPrefilledFromProfile
                        ? t('dashboard.createListing.fields.locationPrefilled')
                        : t('dashboard.createListing.fields.locationCustomized')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <MapPin className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
                    <p className="text-base font-extrabold tracking-wide text-white sm:text-lg">
                      {displayLocation || t('dashboard.createListing.errors.incompleteLocation')}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/80">
                      <Landmark className="h-3.5 w-3.5 text-white/50" />
                      <span className="text-white/50">{t('dashboard.createListing.fields.district')}:</span>
                      <span className="font-semibold text-white">{getDistrictDisplayLabel(district)}</span>
                    </div>

                    {taluka && (
                      <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/80">
                        <Building2 className="h-3.5 w-3.5 text-white/50" />
                        <span className="text-white/50">{t('dashboard.createListing.fields.taluka')}:</span>
                        <span className="font-semibold text-white">{getLocalizedDomainName(taluka, locale, 'taluka')}</span>
                      </div>
                    )}

                    {village && (
                      <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/80">
                        <MapPin className="h-3.5 w-3.5 text-white/50" />
                        <span className="text-white/50">{t('dashboard.createListing.fields.village')}:</span>
                        <span className="font-semibold text-white">{getLocalizedDomainName(village, locale, 'village')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 sm:pt-0">
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-green-400/40 bg-green-900/30 px-5 py-2.5 text-sm font-bold text-green-200 shadow-md backdrop-blur-md transition-all duration-200 hover:border-green-400 hover:bg-green-800/40 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-400 active:scale-95 sm:w-auto"
                  >
                    <Edit3 className="h-4 w-4 text-green-300" />
                    <span>{t('dashboard.createListing.fields.editLocation')}</span>
                  </button>
                </div>
              </div>

              {(errors.district || errors.village || errors.taluka) && (
                <div className="mt-4 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs font-semibold text-red-300">
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
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white sm:text-base">
                    {t('dashboard.createListing.fields.editLocationTitle')}
                  </h3>
                  <p className="text-xs text-white/60">
                    {t('dashboard.createListing.fields.editLocationSubtitle')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* 1. District Dropdown */}
                <div className="space-y-1.5">
                  <label htmlFor={districtId} className="block text-xs font-semibold text-white/90">
                    {t('dashboard.createListing.fields.district')} <span className="text-red-400">*</span>
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
                      <option key={option.id} value={option.name} className="bg-green-950 text-white">
                        {getDistrictDisplayLabel(option.name)}
                      </option>
                    ))}
                  </select>
                  {editErrors.district && (
                    <p id={`${districtId}-error`} role="alert" className="text-xs font-medium text-red-400">
                      {editErrors.district}
                    </p>
                  )}
                </div>

                {/* 2. Taluka Dropdown */}
                <div className="space-y-1.5">
                  <label htmlFor={talukaId} className="block text-xs font-semibold text-white/90">
                    {t('dashboard.createListing.fields.taluka')} <span className="text-red-400">*</span>
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
                      <option key={option.id} value={option.name} className="bg-green-950 text-white">
                        {getLocalizedDomainName(option.name, locale, 'taluka')}
                      </option>
                    ))}
                  </select>
                  {editErrors.taluka && (
                    <p id={`${talukaId}-error`} role="alert" className="text-xs font-medium text-red-400">
                      {editErrors.taluka}
                    </p>
                  )}
                </div>

                {/* 3. Village Dropdown */}
                <div className="space-y-1.5">
                  <label htmlFor={villageId} className="block text-xs font-semibold text-white/90">
                    {t('dashboard.createListing.fields.village')} <span className="text-red-400">*</span>
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
                      <option key={option.id} value={option.name} className="bg-green-950 text-white">
                        {getLocalizedDomainName(option.name, locale, 'village')}
                      </option>
                    ))}
                  </select>
                  {editErrors.village && (
                    <p id={`${villageId}-error`} role="alert" className="text-xs font-medium text-red-400">
                      {editErrors.village}
                    </p>
                  )}
                </div>
              </div>

              {/* Edit Actions: Cancel & Save */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/75 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-400 active:scale-95"
                >
                  <X className="h-4 w-4" />
                  <span>{t('dashboard.createListing.fields.cancelLocationEdit')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-lg transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-400 active:scale-95"
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
          <Calendar className="h-4 w-4 text-green-300" aria-hidden />
          <label htmlFor="cropDate" className="block text-sm font-semibold text-white">
            {t('dashboard.createListing.fields.cropDate')} <span className="text-red-400">*</span>
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
          <p id="cropDate-error" role="alert" className="text-xs font-medium text-red-400">
            {errors.cropDate}
          </p>
        )}
      </div>

      {/* ─── Additional Details Section ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-green-300" aria-hidden />
            <label htmlFor="description" className="block text-sm font-semibold text-white">
              {t('dashboard.createListing.fields.descriptionOptional')}
            </label>
          </div>
          <span className="text-xs font-medium text-white/40">{description.length}/500</span>
        </div>

        <textarea
          id="description"
          rows={4}
          maxLength={500}
          value={description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder={t('dashboard.createListing.fields.descriptionPlaceholder')}
          className="w-full rounded-xl border border-white/15 bg-white/5 p-4 text-sm text-white placeholder-white/40 backdrop-blur-xl transition-all focus:border-green-400 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-green-400/30"
        />
      </div>
    </div>
  );
}
