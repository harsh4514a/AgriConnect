import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { Prisma } from '@prisma/client';
import type { QueryNotificationsDto } from './dto/query-notifications.dto';

export const NOTIFICATION_TYPES = {
  LISTING: 'listing',
  BUYER_REQUIREMENT: 'buyer_requirement',
  TRANSPORT: 'transport',
  GOVERNMENT_SCHEME: 'government_scheme',
  MARKET_PRICE: 'market_price',
  SYSTEM: 'system',
  ACCOUNT: 'account',
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

type NotificationData = Record<string, string | number | boolean | null>;

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  titleKey: string;
  messageKey: string;
  data?: NotificationData;
  relatedPath?: string;
  relatedType?: string;
  relatedId?: string;
  dedupeKey?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a notification without allowing notification failures to break
   * the business action that triggered it.
   *
   * dedupeKey makes event-triggered notifications idempotent when the same
   * business event is processed more than once.
   */
  async create(input: CreateNotificationInput): Promise<void> {
    try {
      const data: Prisma.NotificationCreateInput = {
        user: { connect: { id: input.userId } },
        type: input.type,
        titleKey: input.titleKey,
        messageKey: input.messageKey,
        data: input.data as Prisma.InputJsonValue | undefined,
        relatedPath: input.relatedPath,
        relatedType: input.relatedType,
        relatedId: input.relatedId,
        dedupeKey: input.dedupeKey,
      };

      if (input.dedupeKey) {
        await this.prisma.notification.upsert({
          where: { dedupeKey: input.dedupeKey },
          create: data,
          update: {},
        });
        return;
      }

      await this.prisma.notification.create({ data });
    } catch (error) {
      this.logger.error(
        `Notification creation failed for user ${input.userId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async findMine(userId: string, query: QueryNotificationsDto) {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 50);

    const readFilter =
      query.read === 'unread'
        ? { readAt: null }
        : query.read === 'read'
          ? { readAt: { not: null } }
          : {};

    const where = {
      userId,
      ...readFilter,
    };

    const [total, unreadCount, items] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { userId, readAt: null },
      }),
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          type: true,
          titleKey: true,
          messageKey: true,
          data: true,
          relatedPath: true,
          relatedType: true,
          relatedId: true,
          createdAt: true,
          readAt: true,
        },
      }),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        isRead: item.readAt !== null,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      unreadCount,
    };
  }

  async getUnreadCount(userId: string) {
    const unreadCount = await this.prisma.notification.count({
      where: {
        userId,
        readAt: null,
      },
    });

    return { unreadCount };
  }

  async markRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
      select: { id: true, readAt: true },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.readAt) {
      return { id: notification.id, isRead: true };
    }

    await this.prisma.notification.update({
      where: { id: notification.id },
      data: { readAt: new Date() },
    });

    return { id: notification.id, isRead: true };
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return {
      updatedCount: result.count,
    };
  }
}
