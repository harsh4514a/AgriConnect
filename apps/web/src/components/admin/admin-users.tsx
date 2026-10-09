'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Eye,
  Filter,
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRoundX,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getLocalizedDomainName } from '@agri/domain-data';
import {
  adminGetUserApi,
  adminGetUserFiltersApi,
  adminGetUsersApi,
  adminUpdateUserStatusApi,
  type AdminUserDetails,
  type AdminUserListItem,
} from '@/services/admin-api/admin-users.api';

const PAGE_SIZE = 20;

function UserSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: 7 }).map((_, index) => (
        <div
          key={index}
          className="h-16 animate-pulse rounded-xl border border-slate-100 bg-slate-50"
        />
      ))}
    </div>
  );
}

function getUserName(
  user: Pick<AdminUserListItem, 'firstName' | 'lastName'>,
  fallback: string,
) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name || fallback;
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
  }).format(new Date(value));
}

function LocationText({
  user,
  noLocation,
  locale,
}: {
  user: AdminUserListItem;
  noLocation: string;
  locale: string;
}) {
  const parts = [
    getLocalizedDomainName(user.location.village, locale, 'village'),
    getLocalizedDomainName(user.location.taluka, locale, 'taluka'),
    getLocalizedDomainName(user.location.district, locale, 'district'),
  ].filter(Boolean);

  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
      <span className="truncate">{parts.join(', ') || noLocation}</span>
    </span>
  );
}

export function AdminUsers() {
  const t = useTranslations('admin');
  const locale = (useParams()?.locale as string) || 'en';
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [districtId, setDistrictId] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [districts, setDistricts] = useState<Array<{ id: string; name: string }>>([]);
  const [registeredFrom, setRegisteredFrom] = useState('');
  const [registeredTo, setRegisteredTo] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserDetails | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<boolean | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<'success' | 'error' | null>(null);
  const [filtersError, setFiltersError] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let mounted = true;

    const loadFilters = async () => {
      try {
        const response = await adminGetUserFiltersApi();
        if (mounted) {
          setDistricts(response.districts);
          setFiltersError(false);
        }
      } catch {
        if (mounted) {
          setFiltersError(true);
          setDistricts([]);
        }
      }
    };

    void loadFilters();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedUser && pendingStatus === null) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isUpdatingStatus) {
        setPendingStatus(null);
        setSelectedUser(null);
        setSelectedUserId(null);
        setDetailsError(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isUpdatingStatus, pendingStatus, selectedUser]);

  const loadUsers = useCallback(
    async (page: number) => {
      setIsLoading(true);
      setError(false);

      try {
        const response = await adminGetUsersApi({
          page,
          pageSize: PAGE_SIZE,
          ...(search ? { search } : {}),
          ...(status !== 'all' ? { isActive: status === 'active' } : {}),
          ...(districtId ? { districtId } : {}),
          sort,
          ...(registeredFrom ? { registeredFrom: new Date(`${registeredFrom}T00:00:00`).toISOString() } : {}),
          ...(registeredTo
            ? {
                registeredTo: new Date(
                  `${registeredTo}T00:00:00`,
                ).getTime() + 24 * 60 * 60 * 1000 > 0
                  ? new Date(
                      new Date(`${registeredTo}T00:00:00`).getTime() +
                        24 * 60 * 60 * 1000,
                    ).toISOString()
                  : undefined,
              }
            : {}),
        });

        setUsers(response.items);
        setPagination(response.pagination);
      } catch {
        setUsers([]);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    },
    [districtId, registeredFrom, registeredTo, search, sort, status],
  );

  useEffect(() => {
    void loadUsers(1);
  }, [loadUsers]);

  const openDetails = async (id: string) => {
    setSelectedUserId(id);
    setSelectedUser(null);
    setDetailsError(false);
    setStatusMessage(null);
    setIsDetailsLoading(true);

    try {
      const user = await adminGetUserApi(id);
      setSelectedUser(user);
    } catch {
      setDetailsError(true);
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const confirmStatusChange = async () => {
    if (!selectedUser || pendingStatus === null) return;

    setIsUpdatingStatus(true);
    setStatusMessage(null);

    try {
      await adminUpdateUserStatusApi(selectedUser.id, pendingStatus);
      setSelectedUser((current) =>
        current ? { ...current, isActive: pendingStatus } : current,
      );
      setUsers((current) =>
        current.map((user) =>
          user.id === selectedUser.id
            ? { ...user, isActive: pendingStatus }
            : user,
        ),
      );
      await loadUsers(pagination.page);
      setPendingStatus(null);
      setStatusMessage('success');
    } catch {
      setStatusMessage('error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const showingFrom =
    pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const showingTo = Math.min(
    pagination.page * pagination.pageSize,
    pagination.total,
  );

  const statusLabel = useMemo(
    () => ({
      active: t('users.activeStatus'),
      inactive: t('users.inactiveStatus'),
    }),
    [t],
  );

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#d7ddd6] bg-[#f6f7f3] p-5 shadow-[0_10px_30px_rgba(15,23,42,0.035)] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
              {t('users.eyebrow')}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {t('users.title')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              {t('users.subtitle')}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-2.5">
            <p className="text-xs font-medium text-emerald-700">{t('users.user')}</p>
            <p className="mt-0.5 text-lg font-bold text-emerald-950">
              {pagination.total.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_170px_190px_150px_150px_150px_auto]">
          <div>
            <label htmlFor="admin-user-search" className="sr-only">
              {t('users.searchLabel')}
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="admin-user-search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={t('users.searchPlaceholder')}
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-[#f2f4f0] pl-10 pr-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-50"
              />
            </div>
          </div>

          <div>
            <label htmlFor="admin-user-status" className="sr-only">
              {t('users.statusFilter')}
            </label>
            <select
              id="admin-user-status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as typeof status);
              }}
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50"
            >
              <option value="all">{t('users.allStatuses')}</option>
              <option value="active">{t('users.activeStatus')}</option>
              <option value="inactive">{t('users.inactiveStatus')}</option>
            </select>
          </div>

          <div>
            <label htmlFor="admin-user-district" className="sr-only">
              {t('users.districtFilter')}
            </label>
            <select
              id="admin-user-district"
              value={districtId}
              onChange={(event) => setDistrictId(event.target.value)}
              disabled={filtersError}
              className="min-h-11 w-full rounded-xl border border-slate-700/20 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">{t('users.allDistricts')}</option>
              {districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {getLocalizedDomainName(district.name, locale, 'district')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="admin-user-sort" className="sr-only">
              {t('users.sortLabel')}
            </label>
            <select
              id="admin-user-sort"
              value={sort}
              onChange={(event) => setSort(event.target.value as typeof sort)}
              className="min-h-11 w-full rounded-xl border border-slate-700/20 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            >
              <option value="newest">{t('users.newest')}</option>
              <option value="oldest">{t('users.oldest')}</option>
            </select>
          </div>

          <div>
            <label htmlFor="admin-user-from" className="sr-only">
              {t('users.fromDate')}
            </label>
            <input
              id="admin-user-from"
              type="date"
              value={registeredFrom}
              onChange={(event) => setRegisteredFrom(event.target.value)}
              aria-label={t('users.fromDate')}
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50"
            />
          </div>

          <div>
            <label htmlFor="admin-user-to" className="sr-only">
              {t('users.toDate')}
            </label>
            <input
              id="admin-user-to"
              type="date"
              value={registeredTo}
              onChange={(event) => setRegisteredTo(event.target.value)}
              aria-label={t('users.toDate')}
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setSearch('');
              setStatus('all');
              setDistrictId('');
              setSort('newest');
              setRegisteredFrom('');
              setRegisteredTo('');
            }}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
          >
            <Filter className="h-4 w-4" aria-hidden="true" />
            {t('users.clearFilters')}
          </button>
        </div>
      </section>

      {statusMessage ? (
        <div
          role="status"
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
            statusMessage === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {statusMessage === 'success' ? (
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          ) : (
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
          )}
          {statusMessage === 'success'
            ? t('users.statusUpdateSuccess')
            : t('users.statusUpdateError')}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-[#d7ddd6] bg-[#fbfcfa] shadow-[0_12px_32px_rgba(20,45,31,0.07)]">
        <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">{t('users.title')}</h2>
            <p className="mt-1 text-xs text-slate-500">
              {t('users.showing', {
                from: showingFrom,
                to: showingTo,
                total: pagination.total,
              })}
            </p>
          </div>
          {isLoading ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              {t('users.loading')}
            </span>
          ) : null}
        </div>

        {error ? (
          <div className="p-8 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-red-500" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-slate-900">{t('users.loadError')}</p>
            <button
              type="button"
              onClick={() => void loadUsers(pagination.page)}
              className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {t('users.retry')}
            </button>
          </div>
        ) : isLoading ? (
          <div className="p-5 sm:p-6">
            <UserSkeleton />
          </div>
        ) : users.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <CircleUserRound className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-900">{t('users.noUsers')}</p>
            <p className="mt-1 text-sm text-slate-500">{t('users.noUsersHint')}</p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-[#f5f8f5]">
                    {[
                      'user',
                      'mobile',
                      'location',
                      'status',
                      'registered',
                      'activity',
                      'actions',
                    ].map((key) => (
                      <th
                        key={key}
                        scope="col"
                        className="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
                      >
                        {t(`users.${key}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-slate-100 last:border-b-0 hover:bg-emerald-50/40"
                    >
                      <td className="px-5 py-4">
                        <div className="flex min-w-[180px] items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                            <CircleUserRound className="h-4 w-4" aria-hidden="true" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {getUserName(user, t('users.noName'))}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-400">
                              {user.isVerified ? t('users.verified') : t('users.unverified')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">{user.mobileNumber}</td>
                      <td className="max-w-[220px] px-5 py-4 text-sm text-slate-600">
                        <LocationText user={user} noLocation={t('users.noLocation')} locale={locale} />
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            user.isActive
                              ? 'bg-emerald-50 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              user.isActive ? 'bg-emerald-600' : 'bg-slate-400'
                            }`}
                          />
                          {user.isActive ? statusLabel.active : statusLabel.inactive}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                        {formatDate(user.createdAt, locale)}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">
                        <span>{user.activity.listings} {t('users.listings')}</span>
                        <span className="mx-1 text-slate-300">·</span>
                        <span>{user.activity.buyerRequirements} {t('users.buyerRequirements')}</span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => void openDetails(user.id)}
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-50"
                        >
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                          {t('users.viewDetails')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden">
              {users.map((user) => (
                <article key={user.id} className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                        <CircleUserRound className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-slate-900">
                          {getUserName(user, t('users.noName'))}
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-500">{user.mobileNumber}</p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {user.isActive ? statusLabel.active : statusLabel.inactive}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-slate-500">
                    <LocationText user={user} noLocation={t('users.noLocation')} locale={locale} />
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                      {formatDate(user.createdAt, locale)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                      {user.activity.listings} {t('users.listings')} · {user.activity.buyerRequirements}{' '}
                      {t('users.buyerRequirements')} · {user.activity.transportListings}{' '}
                      {t('users.transport')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => void openDetails(user.id)}
                    className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
                  >
                    <Eye className="h-4 w-4" aria-hidden="true" />
                    {t('users.viewDetails')}
                  </button>
                </article>
              ))}
            </div>
          </>
        )}

        {!error && !isLoading && pagination.totalPages > 1 ? (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <span className="text-xs font-medium text-slate-500">
              {t('users.page', {
                page: pagination.page,
                totalPages: pagination.totalPages,
              })}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => void loadUsers(pagination.page - 1)}
                className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 hover:border-emerald-300 hover:text-emerald-700"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                {t('users.previous')}
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => void loadUsers(pagination.page + 1)}
                className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 hover:border-emerald-300 hover:text-emerald-700"
              >
                {t('users.next')}
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {isDetailsLoading || detailsError || selectedUser ? (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/30 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-user-details-title"
        >
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:max-w-2xl sm:rounded-3xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-[#fbfcfa]/95 px-5 py-4 backdrop-blur sm:px-6">
              <h2 id="admin-user-details-title" className="text-base font-bold text-slate-950">
                {t('users.detailsTitle')}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setSelectedUser(null);
                  setSelectedUserId(null);
                  setDetailsError(false);
                  setPendingStatus(null);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label={t('users.closeDetails')}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {isDetailsLoading ? (
              <div className="flex min-h-80 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600" aria-label={t('users.loading')} />
              </div>
            ) : detailsError ? (
              <div className="p-8 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-red-500" aria-hidden="true" />
                <p className="mt-3 text-sm font-semibold text-slate-900">{t('users.loadError')}</p>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedUserId) void openDetails(selectedUserId);
                  }}
                  className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  {t('users.retry')}
                </button>
              </div>
            ) : selectedUser ? (
              <div className="space-y-6 p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <CircleUserRound className="h-7 w-7" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl font-bold tracking-tight text-slate-950">
                      {getUserName(selectedUser, t('users.noName'))}
                    </h3>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-slate-500">
                      <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                      {selectedUser.mobileNumber}
                    </p>
                  </div>
                  <span
                    className={`ml-auto shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      selectedUser.isActive
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {selectedUser.isActive ? t('users.active') : t('users.inactive')}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    [t('users.role'), selectedUser.role],
                    [t('users.verifiedStatus'), selectedUser.isVerified ? t('users.verified') : t('users.unverified')],
                    [t('users.registrationDate'), formatDate(selectedUser.createdAt, locale)],
                    [t('users.updatedDate'), formatDate(selectedUser.updatedAt, locale)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-slate-100 bg-[#f2f4f0] p-3.5">
                      <p className="text-xs font-medium text-slate-400">{label}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-900">{t('users.location')}</h4>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {[
                      [t('users.state'), getLocalizedDomainName(selectedUser.location.state, locale, 'state')],
                      [t('users.district'), getLocalizedDomainName(selectedUser.location.district, locale, 'district')],
                      [t('users.taluka'), getLocalizedDomainName(selectedUser.location.taluka, locale, 'taluka')],
                      [t('users.village'), getLocalizedDomainName(selectedUser.location.village, locale, 'village')],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl border border-slate-100 p-3.5">
                        <p className="text-xs font-medium text-slate-400">{label}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {value || t('users.noLocation')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-900">{t('users.activitySummary')}</h4>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {[
                      [t('users.listings'), selectedUser.activity.listings],
                      [t('users.buyerRequirements'), selectedUser.activity.buyerRequirements],
                      [t('users.transport'), selectedUser.activity.transportListings],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl border border-slate-100 bg-white p-3 text-center shadow-sm">
                        <p className="text-xl font-bold text-slate-950">{value}</p>
                        <p className="mt-1 text-[11px] font-medium text-slate-500">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={() => setPendingStatus(!selectedUser.isActive)}
                    className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold ${
                      selectedUser.isActive
                        ? 'border border-red-200 bg-white text-red-700 hover:bg-red-50'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {selectedUser.isActive ? (
                      <UserRoundX className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    )}
                    {selectedUser.isActive ? t('users.disable') : t('users.enable')}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {pendingStatus !== null && selectedUser ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-user-status-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 id="admin-user-status-title" className="mt-4 text-lg font-bold text-slate-950">
              {pendingStatus ? t('users.enableTitle') : t('users.disableTitle')}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {pendingStatus ? t('users.enableDescription') : t('users.disableDescription')}
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => setPendingStatus(null)}
                className="min-h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                {t('users.cancel')}
              </button>
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => void confirmStatusChange()}
                className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white disabled:opacity-60 ${
                  pendingStatus
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isUpdatingStatus ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : null}
                {pendingStatus ? t('users.confirmEnable') : t('users.confirmDisable')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
