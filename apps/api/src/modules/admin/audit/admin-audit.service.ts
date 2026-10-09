import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AdminAuditQueryDto } from './dto/admin-audit-query.dto';
import {
  AdminAuditDetails,
  AdminAuditFiltersResponse,
  AdminAuditResponse,
  CreateAuditEntryInput,
} from './interfaces/admin-audit.interface';

@Injectable()
export class AdminAuditService {
  private readonly logger = new Logger(AdminAuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Records an immutable audit log entry.
   * Strips any sensitive properties from metadata before persistence.
   */
  async recordAuditLog(entry: CreateAuditEntryInput): Promise<void> {
    try {
      const sanitizedMetadata = this.sanitizeMetadata(entry.metadata);

      await this.prisma.auditLog.create({
        data: {
          actorId: entry.actorId ?? null,
          actorType: entry.actorType || 'admin',
          actorName: entry.actorName ? entry.actorName.slice(0, 100) : null,
          action: entry.action.slice(0, 80),
          resource: entry.resource.slice(0, 80),
          resourceId: entry.resourceId ? String(entry.resourceId).slice(0, 120) : null,
          description: entry.description.slice(0, 500),
          metadata: sanitizedMetadata as Prisma.InputJsonValue,
          ipAddress: entry.ipAddress ? entry.ipAddress.slice(0, 45) : null,
          userAgent: entry.userAgent ? entry.userAgent.slice(0, 255) : null,
          status: entry.status || 'SUCCESS',
        },
      });
    } catch (err: unknown) {
      // Never crash the primary business operation if audit logging encounters an issue
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to record audit log: ${message}`, err instanceof Error ? err.stack : undefined);
    }
  }

  /**
   * Returns a paginated, filtered list of audit records for authorized administrators.
   */
  async findAll(query: AdminAuditQueryDto): Promise<AdminAuditResponse> {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.AuditLogWhereInput = {};

    if (query.action?.trim()) {
      where.action = query.action.trim();
    }

    if (query.resource?.trim()) {
      where.resource = query.resource.trim();
    }

    if (query.actorId?.trim()) {
      where.actorId = query.actorId.trim();
    }

    if (query.status?.trim()) {
      where.status = query.status.trim();
    }

    // Date range filter
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) {
        const fromDate = new Date(query.dateFrom);
        if (!isNaN(fromDate.getTime())) {
          fromDate.setHours(0, 0, 0, 0);
          where.createdAt.gte = fromDate;
        }
      }
      if (query.dateTo) {
        const toDate = new Date(query.dateTo);
        if (!isNaN(toDate.getTime())) {
          toDate.setHours(23, 59, 59, 999);
          where.createdAt.lte = toDate;
        }
      }
    }

    // Free text search
    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { description: { contains: s, mode: 'insensitive' } },
        { action: { contains: s, mode: 'insensitive' } },
        { resource: { contains: s, mode: 'insensitive' } },
        { actorName: { contains: s, mode: 'insensitive' } },
        { resourceId: { contains: s, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.AuditLogOrderByWithRelationInput = {
      createdAt: query.sort === 'oldest' ? 'asc' : 'desc',
    };

    const [total, records] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        select: {
          id: true,
          actorId: true,
          actorType: true,
          actorName: true,
          action: true,
          resource: true,
          resourceId: true,
          description: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    const items = records.map((record) => ({
      id: record.id,
      actorId: record.actorId,
      actorType: record.actorType,
      actorName: record.actorName,
      action: record.action,
      resource: record.resource,
      resourceId: record.resourceId,
      description: record.description,
      status: record.status,
      createdAt: record.createdAt.toISOString(),
    }));

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  /**
   * Returns complete details for a single audit log entry by ID.
   */
  async findOne(id: string): Promise<AdminAuditDetails> {
    const record = await this.prisma.auditLog.findUnique({
      where: { id },
    });

    if (!record) {
      throw new NotFoundException('Audit log record not found');
    }

    return {
      id: record.id,
      actorId: record.actorId,
      actorType: record.actorType,
      actorName: record.actorName,
      action: record.action,
      resource: record.resource,
      resourceId: record.resourceId,
      description: record.description,
      status: record.status,
      metadata: record.metadata as Record<string, any> | null,
      ipAddress: record.ipAddress,
      userAgent: record.userAgent,
      createdAt: record.createdAt.toISOString(),
    };
  }

  /**
   * Retrieves distinct filter options (actions, resources, actors) from existing records.
   */
  async getFilters(): Promise<AdminAuditFiltersResponse> {
    const [actionRows, resourceRows, admins] = await Promise.all([
      this.prisma.auditLog.findMany({
        distinct: ['action'],
        select: { action: true },
        orderBy: { action: 'asc' },
      }),
      this.prisma.auditLog.findMany({
        distinct: ['resource'],
        select: { resource: true },
        orderBy: { resource: 'asc' },
      }),
      this.prisma.admin.findMany({
        select: { id: true, username: true },
        orderBy: { username: 'asc' },
      }),
    ]);

    const standardActions = [
      'ADMIN_LOGIN',
      'USER_STATUS_CHANGE',
      'LISTING_STATUS_CHANGE',
      'CROP_GUIDE_CREATE',
      'CROP_GUIDE_UPDATE',
      'CROP_GUIDE_STATUS_CHANGE',
      'GOVERNMENT_SCHEME_CREATE',
      'GOVERNMENT_SCHEME_UPDATE',
      'GOVERNMENT_SCHEME_DELETE',
      'TRANSPORT_STATUS_CHANGE',
    ];

    const standardResources = [
      'auth',
      'user',
      'marketplace',
      'crop_guide',
      'government_scheme',
      'transport',
      'market_price',
    ];

    const actionsSet = new Set([
      ...actionRows.map((r) => r.action),
      ...standardActions,
    ]);

    const resourcesSet = new Set([
      ...resourceRows.map((r) => r.resource),
      ...standardResources,
    ]);

    return {
      actions: Array.from(actionsSet).sort(),
      resources: Array.from(resourcesSet).sort(),
      actors: admins.map((a) => ({ id: a.id, username: a.username })),
    };
  }

  /**
   * Recursively sanitizes metadata to prevent passwords, tokens, and secrets from being stored.
   */
  private sanitizeMetadata(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeMetadata(item));
    }

    const sensitiveKeyPatterns = [
      'password',
      'hash',
      'token',
      'secret',
      'authorization',
      'credit',
      'card',
      'bearer',
    ];

    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitiveKeyPatterns.some((pattern) => lowerKey.includes(pattern));

      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeMetadata(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}
