import { api } from './axios';

export type NotificationFilter = 'all' | 'unread' | 'read';

export type NotificationType =
  | 'listing'
  | 'buyer_requirement'
  | 'transport'
  | 'government_scheme'
  | 'market_price'
  | 'system'
  | 'account';

export interface NotificationData {
  cropKey?: string;
  customCropName?: string | null;
  [key: string]: string | number | boolean | null | undefined;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  titleKey: string;
  messageKey: string;
  data?: NotificationData | null;
  relatedPath?: string | null;
  relatedType?: string | null;
  relatedId?: string | null;
  createdAt: string;
  readAt?: string | null;
  isRead: boolean;
}

export interface NotificationsResponse {
  items: NotificationItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}


export function emitNotificationsChanged(unreadCount?: number): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('agri:notifications-updated', {
        detail:
          typeof unreadCount === 'number'
            ? { unreadCount }
            : undefined,
      }),
    );
  }
}

export async function getNotifications(
  params: {
    read?: NotificationFilter;
    page?: number;
    limit?: number;
  } = {},
): Promise<NotificationsResponse> {
  const { data } = await api.get<NotificationsResponse>('/notifications', {
    params: {
      read: params.read ?? 'all',
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    },
  });

  return data;
}

export async function getUnreadNotificationCount(): Promise<number> {
  const { data } = await api.get<{ unreadCount: number }>(
    '/notifications/unread-count',
  );

  return data.unreadCount;
}

export async function markNotificationAsRead(
  id: string,
): Promise<{ id: string; isRead: boolean }> {
  const { data } = await api.patch<{ id: string; isRead: boolean }>(
    `/notifications/${encodeURIComponent(id)}/read`,
  );

  return data;
}

export async function markAllNotificationsAsRead(): Promise<{
  updatedCount: number;
}> {
  const { data } = await api.patch<{ updatedCount: number }>(
    '/notifications/read-all',
  );

  return data;
}
