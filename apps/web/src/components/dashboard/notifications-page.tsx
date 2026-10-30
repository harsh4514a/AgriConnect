'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Bell,
  BellRing,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CircleAlert,
  Landmark,
  Package,
  RefreshCw,
  Settings2,
  Truck,
  TrendingUp,
  UserRound,
} from 'lucide-react';

import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationFilter,
  type NotificationItem,
} from '@/services/api/notifications.api';
import { cn } from '@/utils/cn';

const PAGE_SIZE = 20;

function NotificationIcon({ type }: { type: NotificationItem['type'] }) {
  const Icon =
    type === 'listing'
      ? Package
      : type === 'buyer_requirement'
        ? ClipboardList
        : type === 'transport'
          ? Truck
          : type === 'government_scheme'
            ? Landmark
            : type === 'market_price'
              ? TrendingUp
              : type === 'account'
                ? UserRound
                : type === 'system'
                  ? Settings2
                  : CircleAlert;

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-subtle">
      <Icon
        className="h-5 w-5 text-accent"
        aria-hidden="true"
      />
    </div>
  );
}

function NotificationSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-surface/[0.045] p-4">
      <div className="flex gap-3">
        <div className="h-11 w-11 animate-pulse rounded-xl bg-surface-subtle" />

        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-2/5 animate-pulse rounded bg-surface-subtle" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-surface-subtle" />
          <div className="h-3 w-1/4 animate-pulse rounded bg-surface-subtle" />
        </div>
      </div>
    </div>
  );
}

export function NotificationsPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const [filter, setFilter] =
    useState<NotificationFilter>('all');

  const [page, setPage] = useState(1);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const filters = useMemo(
    () => [
      {
        value: 'all' as const,
        label: t('dashboard.notifications.filters.all'),
      },
      {
        value: 'unread' as const,
        label: t('dashboard.notifications.filters.unread'),
      },
      {
        value: 'read' as const,
        label: t('dashboard.notifications.filters.read'),
      },
    ],
    [t],
  );

  /**
   * Notify the dashboard notification panel only after React has
   * completed rendering the NotificationsPage.
   *
   * This prevents a child/shared component from being updated
   * while NotificationsPage is rendering.
   */
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('agri:notifications-updated', {
        detail: { unreadCount },
      }),
    );
  }, [unreadCount]);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const response = await getNotifications({
        read: filter,
        page,
        limit: PAGE_SIZE,
      });

      setItems(response.items);
      setTotal(response.total);
      setTotalPages(response.totalPages);
      setUnreadCount(response.unreadCount);
    } catch {
      setItems([]);
      setTotal(0);
      setTotalPages(0);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const selectFilter = (nextFilter: NotificationFilter) => {
    setFilter(nextFilter);
    setPage(1);
  };

  const markRead = async (id: string) => {
    const target = items.find((item) => item.id === id);

    if (!target || target.isRead || markingId) {
      return;
    }

    setMarkingId(id);

    try {
      await markNotificationAsRead(id);

      setItems((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                isRead: true,
                readAt: new Date().toISOString(),
              }
            : item,
        ),
      );

      setUnreadCount((current) => Math.max(0, current - 1));

      if (filter === 'unread') {
        setItems((current) =>
          current.filter((item) => item.id !== id),
        );

        const nextTotal = Math.max(0, total - 1);
        const nextTotalPages = Math.ceil(nextTotal / PAGE_SIZE);

        setTotal(nextTotal);
        setTotalPages(nextTotalPages);

        if (page > Math.max(1, nextTotalPages)) {
          setPage(Math.max(1, nextTotalPages));
        }
      }
    } catch {
      // Keep the item unread when the server update fails.
    } finally {
      setMarkingId(null);
    }
  };

  const openNotification = async (
    notification: NotificationItem,
  ) => {
    if (!notification.isRead) {
      await markRead(notification.id);
    }

    if (notification.relatedPath) {
      router.push(`/${locale}${notification.relatedPath}`);
    }
  };

  const markAllRead = async () => {
    if (unreadCount === 0 || markingAll) {
      return;
    }

    setMarkingAll(true);

    try {
      await markAllNotificationsAsRead();

      setItems((current) =>
        current.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt ?? new Date().toISOString(),
        })),
      );

      setUnreadCount(0);

      if (filter === 'unread') {
        setItems([]);
        setTotal(0);
        setTotalPages(0);
        setPage(1);
      }
    } catch {
      // The list remains unchanged when the server update fails.
    } finally {
      setMarkingAll(false);
    }
  };

  const formatDateTime = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));

  const emptyTitle =
    filter === 'unread'
      ? t('dashboard.notifications.emptyUnreadTitle')
      : filter === 'read'
        ? t('dashboard.notifications.emptyReadTitle')
        : t('dashboard.notifications.emptyTitle');

  const emptyDescription =
    filter === 'unread'
      ? t('dashboard.notifications.emptyUnreadDesc')
      : filter === 'read'
        ? t('dashboard.notifications.emptyReadDesc')
        : t('dashboard.notifications.emptyDesc');

  return (
    <section
      aria-labelledby="notifications-page-title"
      className="space-y-5"
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="notifications-page-title"
            className="text-2xl font-black tracking-tight text-foreground sm:text-3xl"
          >
            {t('dashboard.notifications.pageTitle')}
          </h2>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            {t('dashboard.notifications.pageDescription')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void markAllRead()}
          disabled={
            unreadCount === 0 ||
            markingAll ||
            loading ||
            error
          }
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-surface/[0.06] px-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-subtle hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          {markingAll ? (
            <RefreshCw
              className="h-4 w-4 animate-spin"
              aria-hidden="true"
            />
          ) : (
            <Check
              className="h-4 w-4"
              aria-hidden="true"
            />
          )}

          {t('dashboard.notifications.markAllRead')}
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div
          className="inline-flex rounded-xl border border-border bg-surface/[0.04] p-1"
          role="tablist"
          aria-label={t(
            'dashboard.notifications.filterLabel',
          )}
        >
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={filter === item.value}
              onClick={() => selectFilter(item.value)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                filter === item.value
                  ? 'bg-surface-subtle text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {unreadCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent">
            <BellRing
              className="h-3.5 w-3.5"
              aria-hidden="true"
            />

            {t('dashboard.notifications.unreadCount', {
              count: unreadCount,
            })}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3" aria-busy="true">
          {Array.from({ length: 5 }).map((_, index) => (
            <NotificationSkeleton key={index} />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-danger/15 bg-danger-soft p-6 text-center">
          <CircleAlert
            className="mx-auto h-8 w-8 text-danger/80"
            aria-hidden="true"
          />

          <h3 className="mt-3 text-base font-semibold text-foreground">
            {t('dashboard.notifications.errorTitle')}
          </h3>

          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {t(
              'dashboard.notifications.errorDescription',
            )}
          </p>

          <button
            type="button"
            onClick={() => void loadNotifications()}
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-surface-subtle px-4 text-sm font-semibold text-foreground transition-colors hover:bg-surface-subtle"
          >
            <RefreshCw
              className="h-4 w-4"
              aria-hidden="true"
            />

            {t('dashboard.notifications.retry')}
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface/[0.045] px-6 py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-subtle">
            <Bell
              className="h-7 w-7 text-muted-foreground"
              aria-hidden="true"
            />
          </div>

          <h3 className="mt-4 text-base font-semibold text-foreground">
            {emptyTitle}
          </h3>

          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {emptyDescription}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3" aria-live="polite">
            {items.map((notification) => {
              const rawData = notification.data ?? {};

              const cropKey =
                typeof rawData.cropKey === 'string'
                  ? rawData.cropKey
                  : '';

              const customCropName =
                typeof rawData.customCropName === 'string'
                  ? rawData.customCropName.trim()
                  : '';

              const cropName =
                customCropName ||
                (cropKey
                  ? t(
                      `dashboard.marketplaceBrowse.crop.${cropKey}`,
                    )
                  : '');

              const values = {
                ...rawData,
                cropName,
              };

              return (
                <article
                  key={notification.id}
                  className={cn(
                    'rounded-2xl border p-4 transition-colors sm:p-5',
                    notification.isRead
                      ? 'border-border bg-surface/[0.035]'
                      : 'border-border bg-surface-subtle',
                  )}
                >
                  <div className="flex gap-3 sm:gap-4">
                    <NotificationIcon
                      type={notification.type}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground">
                            {t(
                              notification.titleKey,
                              values as never,
                            )}
                          </h3>

                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {t(
                              notification.messageKey,
                              values as never,
                            )}
                          </p>
                        </div>

                        {!notification.isRead && (
                          <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-accent">
                            <span className="h-1.5 w-1.5 rounded-full bg-accent" />

                            {t(
                              'dashboard.notifications.unread',
                            )}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <time
                          dateTime={notification.createdAt}
                          className="text-xs text-muted-foreground"
                        >
                          {formatDateTime(
                            notification.createdAt,
                          )}
                        </time>

                        <div className="flex flex-wrap items-center gap-2">
                          {!notification.isRead && (
                            <button
                              type="button"
                              onClick={() =>
                                void markRead(
                                  notification.id,
                                )
                              }
                              disabled={
                                markingId ===
                                notification.id
                              }
                              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-surface-subtle hover:text-foreground disabled:opacity-40"
                            >
                              {markingId ===
                              notification.id ? (
                                <RefreshCw
                                  className="h-3.5 w-3.5 animate-spin"
                                  aria-hidden="true"
                                />
                              ) : (
                                <Check
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                              )}

                              {t(
                                'dashboard.notifications.markRead',
                              )}
                            </button>
                          )}

                          {notification.relatedPath && (
                            <button
                              type="button"
                              onClick={() =>
                                void openNotification(
                                  notification,
                                )
                              }
                              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-surface-subtle px-3 text-xs font-semibold text-foreground transition-colors hover:bg-surface-subtle"
                            >
                              {t(
                                'dashboard.notifications.open',
                              )}

                              <ChevronRight
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {totalPages > 1 && (
            <nav
              className="flex items-center justify-between rounded-2xl border border-border bg-surface/[0.035] px-3 py-2.5 sm:px-4"
              aria-label={t(
                'dashboard.notifications.paginationLabel',
              )}
            >
              <button
                type="button"
                onClick={() =>
                  setPage((current) =>
                    Math.max(1, current - 1),
                  )
                }
                disabled={page <= 1}
                className="inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-foreground hover:bg-surface-subtle hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft
                  className="h-4 w-4"
                  aria-hidden="true"
                />

                {t('dashboard.notifications.previous')}
              </button>

              <span className="text-xs text-muted-foreground">
                {t('dashboard.notifications.pageOf', {
                  page,
                  totalPages,
                })}
              </span>

              <button
                type="button"
                onClick={() =>
                  setPage((current) =>
                    Math.min(
                      totalPages,
                      current + 1,
                    ),
                  )
                }
                disabled={page >= totalPages}
                className="inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-foreground hover:bg-surface-subtle hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
              >
                {t('dashboard.notifications.next')}

                <ChevronRight
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </button>
            </nav>
          )}

          {total > 0 && (
            <p className="text-center text-xs text-muted-foreground">
              {t('dashboard.notifications.totalCount', {
                count: total,
              })}
            </p>
          )}
        </>
      )}
    </section>
  );
}
