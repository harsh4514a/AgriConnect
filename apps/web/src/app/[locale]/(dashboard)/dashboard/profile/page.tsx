'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AlertCircle, CheckCircle2, Edit3, MapPin, Phone, RefreshCw, UserRound } from 'lucide-react';
import { toast } from 'sonner';

import { Avatar } from '@/components/dashboard/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  getDistricts,
  getProfile,
  getStates,
  getTalukas,
  getVillages,
  updateProfile,
  type LocationOption,
  type ProfileResponse,
} from '@/services/api/auth.api';
import { updateCachedUserProfile } from '@/lib/auth/session';
import { getLocalizedDomainName } from '@agri/domain-data';

type ProfileForm = {
  firstName: string;
  lastName: string;
  districtId: string;
  talukaId: string;
  villageId: string;
};

const emptyForm: ProfileForm = {
  firstName: '',
  lastName: '',
  districtId: '',
  talukaId: '',
  villageId: '',
};

function ProfileSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl animate-pulse space-y-6" aria-hidden="true">
      <div className="h-44 rounded-2xl bg-gray-100" />
      <div className="rounded-2xl border border-gray-100 bg-surface p-6">
        <div className="h-6 w-48 rounded bg-gray-100" />
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="h-14 rounded-xl bg-gray-100" />
          <div className="h-14 rounded-xl bg-gray-100" />
          <div className="h-14 rounded-xl bg-gray-100" />
        </div>
      </div>
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  options,
  disabled,
  placeholder,
  onChange,
  error,
  locale,
  domain,
}: {
  id: string;
  label: string;
  value: string;
  options: LocationOption[];
  disabled?: boolean;
  placeholder: string;
  onChange: (value: string) => void;
  error?: string;
  locale: string;
  domain: 'district' | 'taluka' | 'village';
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-gray-700">
        {label}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`h-14 w-full rounded-xl border-2 bg-surface px-4 text-base text-gray-900 outline-none transition-colors focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 ${
          error ? 'border-red-300' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {getLocalizedDomainName(option.name, locale, domain)}
          </option>
        ))}
      </select>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default function ProfilePage() {
  const t = useTranslations();
  const locale = useLocale();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [savedForm, setSavedForm] = useState<ProfileForm>(emptyForm);
  const [districts, setDistricts] = useState<LocationOption[]>([]);
  const [talukas, setTalukas] = useState<LocationOption[]>([]);
  const [villages, setVillages] = useState<LocationOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);

    try {
      const current = await getProfile();
      const nextForm: ProfileForm = {
        firstName: current.firstName ?? '',
        lastName: current.lastName ?? '',
        districtId: current.district?.id ?? '',
        talukaId: current.taluka?.id ?? '',
        villageId: current.village?.id ?? '',
      };

      setProfile(current);
      setForm(nextForm);
      setSavedForm(nextForm);

      let stateId = current.state?.id;
      if (!stateId) {
        const states = await getStates();
        stateId = states.find((state) => state.name.toLowerCase() === 'gujarat')?.id;
      }

      if (!stateId) {
        throw new Error('Profile state is unavailable');
      }

      const nextDistricts = await getDistricts(stateId);
      setDistricts(nextDistricts);

      if (nextForm.districtId) {
        const nextTalukas = await getTalukas(nextForm.districtId);
        setTalukas(nextTalukas);

        if (nextForm.talukaId) {
          const nextVillages = await getVillages(nextForm.talukaId);
          setVillages(nextVillages);
        } else {
          setVillages([]);
        }
      } else {
        setTalukas([]);
        setVillages([]);
      }
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const hasUnsavedChanges = useMemo(
    () => isEditing && JSON.stringify(form) !== JSON.stringify(savedForm),
    [form, isEditing, savedForm],
  );

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const validate = useCallback(() => {
    const errors: Record<string, string> = {};
    if (form.firstName.trim().length < 2) errors.firstName = t('profilePage.validation.firstName');
    if (form.lastName.trim().length < 2) errors.lastName = t('profilePage.validation.lastName');
    if (!form.districtId) errors.districtId = t('profilePage.validation.district');
    if (!form.talukaId) errors.talukaId = t('profilePage.validation.taluka');
    if (!form.villageId) errors.villageId = t('profilePage.validation.village');
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [form, t]);

  const startEditing = () => {
    setFieldErrors({});
    setIsEditing(true);
  };

  const cancelEditing = () => {
    if (hasUnsavedChanges && !window.confirm(t('profilePage.unsavedConfirm'))) return;
    setForm(savedForm);
    setFieldErrors({});
    setIsEditing(false);
  };

  const handleDistrictChange = async (districtId: string) => {
    setForm((current) => ({ ...current, districtId, talukaId: '', villageId: '' }));
    setTalukas([]);
    setVillages([]);
    setFieldErrors((current) => ({ ...current, districtId: '', talukaId: '', villageId: '' }));

    if (!districtId) return;

    setIsLocationLoading(true);
    try {
      setTalukas(await getTalukas(districtId));
    } catch {
      toast.error(t('profilePage.errors.locationLoad'));
    } finally {
      setIsLocationLoading(false);
    }
  };

  const handleTalukaChange = async (talukaId: string) => {
    setForm((current) => ({ ...current, talukaId, villageId: '' }));
    setVillages([]);
    setFieldErrors((current) => ({ ...current, talukaId: '', villageId: '' }));

    if (!talukaId) return;

    setIsLocationLoading(true);
    try {
      setVillages(await getVillages(talukaId));
    } catch {
      toast.error(t('profilePage.errors.locationLoad'));
    } finally {
      setIsLocationLoading(false);
    }
  };

  const handleSave = async () => {
    if (!validate() || isSaving) return;

    setIsSaving(true);
    try {
      const updated = await updateProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        districtId: form.districtId,
        talukaId: form.talukaId,
        villageId: form.villageId,
      });

      const nextForm: ProfileForm = {
        firstName: updated.firstName ?? '',
        lastName: updated.lastName ?? '',
        districtId: updated.district?.id ?? '',
        talukaId: updated.taluka?.id ?? '',
        villageId: updated.village?.id ?? '',
      };

      setProfile(updated);
      setForm(nextForm);
      setSavedForm(nextForm);
      setFieldErrors({});
      setIsEditing(false);

      updateCachedUserProfile({
        firstName: updated.firstName ?? '',
        lastName: updated.lastName ?? '',
        mobileNumber: updated.mobileNumber,
        preferredLanguage: updated.preferredLanguage,
        role: updated.role,
        isVerified: updated.isVerified,
        location: {
          district: updated.district?.name,
          taluka: updated.taluka?.name,
          village: updated.village?.name,
          latitude: updated.latitude ?? undefined,
          longitude: updated.longitude ?? undefined,
        },
      });

      toast.success(t('profilePage.success'));
    } catch {
      toast.error(t('profilePage.errors.update'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <ProfileSkeleton />
        <span className="sr-only">{t('profilePage.loading')}</span>
      </main>
    );
  }

  if (loadError || !profile) {
    return (
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[360px] w-full max-w-xl flex-col items-center justify-center rounded-2xl border border-red-100 bg-surface p-8 text-center shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertCircle className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-gray-900">{t('profilePage.errors.loadTitle')}</h1>
          <p className="mt-2 max-w-md text-sm text-gray-500">{t('profilePage.errors.loadDescription')}</p>
          <Button className="mt-6" variant="secondary" onClick={() => void loadProfile()}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            {t('profilePage.retry')}
          </Button>
        </div>
      </main>
    );
  }

  const fullName = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() || t('dashboard.profile.fallbackName');

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-surface p-5 shadow-sm sm:p-7" aria-labelledby="profile-heading">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <Avatar name={fullName} src={undefined} className="h-16 w-16 text-lg" />
              <div className="min-w-0">
                <h1 id="profile-heading" className="truncate text-2xl font-bold tracking-tight text-gray-900">
                  {fullName}
                </h1>
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                  <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{profile.mobileNumber}</span>
                </div>
              </div>
            </div>
            {!isEditing ? (
              <Button onClick={startEditing} className="w-full sm:w-auto">
                <Edit3 className="mr-2 h-4 w-4" aria-hidden="true" />
                {t('profilePage.edit')}
              </Button>
            ) : null}
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserRound className="h-5 w-5 text-accent" aria-hidden="true" />
              {t('profilePage.personalInformation')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="profile-first-name" className="mb-1.5 block text-sm font-semibold text-gray-700">
                    {t('profilePage.firstName')}
                  </label>
                  <Input
                    id="profile-first-name"
                    value={form.firstName}
                    onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                    error={fieldErrors.firstName}
                    autoComplete="given-name"
                    maxLength={50}
                  />
                </div>
                <div>
                  <label htmlFor="profile-last-name" className="mb-1.5 block text-sm font-semibold text-gray-700">
                    {t('profilePage.lastName')}
                  </label>
                  <Input
                    id="profile-last-name"
                    value={form.lastName}
                    onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                    error={fieldErrors.lastName}
                    autoComplete="family-name"
                    maxLength={50}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="profile-mobile" className="mb-1.5 block text-sm font-semibold text-gray-700">
                    {t('profilePage.mobileNumber')}
                  </label>
                  <Input
                    id="profile-mobile"
                    value={profile.mobileNumber}
                    readOnly
                    leftIcon={<Phone className="h-4 w-4" aria-hidden="true" />}
                    className="bg-gray-50"
                    aria-describedby="profile-mobile-help"
                  />
                  <p id="profile-mobile-help" className="mt-1.5 text-xs text-gray-500">
                    {t('profilePage.mobileReadOnly')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                <InfoItem label={t('profilePage.firstName')} value={profile.firstName || t('profilePage.notAvailable')} />
                <InfoItem label={t('profilePage.lastName')} value={profile.lastName || t('profilePage.notAvailable')} />
                <InfoItem label={t('profilePage.mobileNumber')} value={profile.mobileNumber || t('profilePage.notAvailable')} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-accent" aria-hidden="true" />
              {t('profilePage.location')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <>
                <div className="grid gap-5 sm:grid-cols-2">
                  <SelectField
                    id="profile-district"
                    label={t('profilePage.district')}
                    locale={locale}
                    domain="district"
                    value={form.districtId}
                    options={districts}
                    placeholder={t('profilePage.selectDistrict')}
                    onChange={handleDistrictChange}
                    error={fieldErrors.districtId}
                  />
                  <SelectField
                    id="profile-taluka"
                    label={t('profilePage.taluka')}
                    locale={locale}
                    domain="taluka"
                    value={form.talukaId}
                    options={talukas}
                    disabled={!form.districtId || isLocationLoading}
                    placeholder={t('profilePage.selectTaluka')}
                    onChange={handleTalukaChange}
                    error={fieldErrors.talukaId}
                  />
                  <SelectField
                    id="profile-village"
                    label={t('profilePage.village')}
                    locale={locale}
                    domain="village"
                    value={form.villageId}
                    options={villages}
                    disabled={!form.talukaId || isLocationLoading}
                    placeholder={t('profilePage.selectVillage')}
                    onChange={(value) => {
                      setForm((current) => ({ ...current, villageId: value }));
                      setFieldErrors((current) => ({ ...current, villageId: '' }));
                    }}
                    error={fieldErrors.villageId}
                  />
                </div>
                {isLocationLoading ? (
                  <p className="mt-3 text-sm text-gray-500" role="status">
                    {t('profilePage.loadingLocation')}
                  </p>
                ) : null}
              </>
            ) : (
              <div className="grid gap-5 sm:grid-cols-3">
                <InfoItem label={t('profilePage.district')} value={profile.district?.name ? getLocalizedDomainName(profile.district.name, locale, 'district') : t('profilePage.notAvailable')} />
                <InfoItem label={t('profilePage.taluka')} value={profile.taluka?.name ? getLocalizedDomainName(profile.taluka.name, locale, 'taluka') : t('profilePage.notAvailable')} />
                <InfoItem label={t('profilePage.village')} value={profile.village?.name ? getLocalizedDomainName(profile.village.name, locale, 'village') : t('profilePage.notAvailable')} />
              </div>
            )}
          </CardContent>
        </Card>

        {isEditing ? (
          <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-surface-subtle p-3 shadow-lg backdrop-blur sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={cancelEditing} disabled={isSaving} className="w-full sm:w-auto">
              {t('profilePage.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
              {isSaving ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-border border-t-white" aria-hidden="true" />
                  {t('profilePage.saving')}
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
                  {t('profilePage.saveChanges')}
                </>
              )}
            </Button>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 truncate text-base font-semibold text-gray-900">{value}</p>
    </div>
  );
}
