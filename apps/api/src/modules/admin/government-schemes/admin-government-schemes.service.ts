import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AdminAuditService } from '../audit/admin-audit.service';
import { AdminProfileResponse } from '../auth/interfaces/admin-auth-response.interface';
import { AdminGovernmentSchemeDto } from './dto/admin-government-scheme.dto';
import { AdminGovernmentSchemeQueryDto } from './dto/admin-government-scheme-query.dto';
import { AdminGovernmentSchemeStatusDto } from './dto/admin-government-scheme-status.dto';
import {
  AdminGovernmentSchemeDetails,
  AdminGovernmentSchemeFiltersResponse,
  AdminGovernmentSchemeListItem,
  AdminGovernmentSchemeLocale,
  AdminGovernmentSchemesResponse,
} from './interfaces/admin-government-schemes-response.interface';

const LOCALES: AdminGovernmentSchemeLocale[] = ['en', 'gu', 'hi'];

@Injectable()
export class AdminGovernmentSchemesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
  ) {}

  private readonly listSelect = {
    id: true,
    slug: true,
    governmentLevel: true,
    department: true,
    category: true,
    status: true,
    availableStates: true,
    applicationUrl: true,
    sourceUrl: true,
    lastVerifiedAt: true,
    isPublished: true,
    sortOrder: true,
    createdAt: true,
    updatedAt: true,
    contents: {
      select: {
        locale: true,
        name: true,
        shortDescription: true,
      },
      orderBy: { locale: 'asc' as const },
    },
  } as const;

  private readonly detailSelect = {
    id: true,
    slug: true,
    governmentLevel: true,
    department: true,
    category: true,
    status: true,
    availableStates: true,
    applicationUrl: true,
    sourceUrl: true,
    lastVerifiedAt: true,
    isPublished: true,
    sortOrder: true,
    createdAt: true,
    updatedAt: true,
    contents: {
      select: {
        id: true,
        locale: true,
        name: true,
        shortDescription: true,
        description: true,
        benefits: true,
        eligibility: true,
        documents: true,
        applicationSteps: true,
        conditions: true,
        keywords: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { locale: 'asc' as const },
    },
  } as const;

  private strings(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === 'string');
  }

  private dateIso(value: Date | null): string | null {
    return value ? value.toISOString() : null;
  }

  private searchTextFor(content: {
    name: string;
    shortDescription: string;
    description: string;
    keywords?: string[];
    benefits?: string[];
    eligibility?: string[];
  }): string {
    return [
      content.name,
      content.shortDescription,
      content.description,
      ...(content.keywords ?? []),
      ...(content.benefits ?? []),
      ...(content.eligibility ?? []),
    ]
      .join(' ')
      .trim();
  }

  private contentData(content: AdminGovernmentSchemeDto['contents'][number]) {
    const benefits = (content.benefits ?? []).map((s) => s.trim()).filter(Boolean);
    const eligibility = (content.eligibility ?? []).map((s) => s.trim()).filter(Boolean);
    const documents = (content.documents ?? []).map((s) => s.trim()).filter(Boolean);
    const applicationSteps = (content.applicationSteps ?? []).map((s) => s.trim()).filter(Boolean);
    const conditions = (content.conditions ?? []).map((s) => s.trim()).filter(Boolean);
    const keywords = (content.keywords ?? []).map((s) => s.trim()).filter(Boolean);

    return {
      locale: content.locale,
      name: content.name.trim(),
      shortDescription: content.shortDescription.trim(),
      description: content.description.trim(),
      benefits: benefits as Prisma.InputJsonValue,
      eligibility: eligibility as Prisma.InputJsonValue,
      documents: documents as Prisma.InputJsonValue,
      applicationSteps: applicationSteps as Prisma.InputJsonValue,
      conditions: conditions as Prisma.InputJsonValue,
      keywords,
      searchText: this.searchTextFor({
        name: content.name,
        shortDescription: content.shortDescription,
        description: content.description,
        keywords,
        benefits,
        eligibility,
      }),
    };
  }

  private buildWhere(query: AdminGovernmentSchemeQueryDto): Prisma.GovernmentSchemeWhereInput {
    const search = query.search?.trim();

    const searchConditions: Prisma.GovernmentSchemeWhereInput[] = search
      ? [
          { slug: { contains: search, mode: 'insensitive' } },
          { department: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
          {
            contents: {
              some: {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { searchText: { contains: search, mode: 'insensitive' } },
                ],
              },
            },
          },
        ]
      : [];

    return {
      ...(query.category ? { category: query.category } : {}),
      ...(query.governmentLevel ? { governmentLevel: query.governmentLevel } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.isPublished === undefined ? {} : { isPublished: query.isPublished }),
      ...(query.state ? { availableStates: { has: query.state } } : {}),
      ...(query.locale ? { contents: { some: { locale: query.locale } } } : {}),
      ...(searchConditions.length > 0 ? { OR: searchConditions } : {}),
    };
  }

  async findAll(query: AdminGovernmentSchemeQueryDto): Promise<AdminGovernmentSchemesResponse> {
    const page = Math.max(query.page ?? 1, 1);
    const pageSize = Math.min(Math.max(query.pageSize ?? 20, 1), 50);
    const where = this.buildWhere(query);

    let orderBy: Prisma.GovernmentSchemeOrderByWithRelationInput[];
    switch (query.sort) {
      case 'name':
        orderBy = [{ slug: 'asc' }];
        break;
      case 'oldest':
        orderBy = [{ createdAt: 'asc' }];
        break;
      case 'sortOrder':
        orderBy = [{ sortOrder: 'asc' }, { createdAt: 'desc' }];
        break;
      case 'newest':
      default:
        orderBy = [{ createdAt: 'desc' }];
        break;
    }

    const [total, rows] = await Promise.all([
      this.prisma.governmentScheme.count({ where }),
      this.prisma.governmentScheme.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: this.listSelect,
      }),
    ]);

    return {
      items: rows.map((row) => this.toListItem(row)),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  async getFilters(): Promise<AdminGovernmentSchemeFiltersResponse> {
    const [categories, levels, statuses, stateRows] = await Promise.all([
      this.prisma.governmentScheme.findMany({
        distinct: ['category'],
        orderBy: { category: 'asc' },
        select: { category: true },
      }),
      this.prisma.governmentScheme.findMany({
        distinct: ['governmentLevel'],
        orderBy: { governmentLevel: 'asc' },
        select: { governmentLevel: true },
      }),
      this.prisma.governmentScheme.findMany({
        distinct: ['status'],
        orderBy: { status: 'asc' },
        select: { status: true },
      }),
      this.prisma.governmentScheme.findMany({
        select: { availableStates: true },
      }),
    ]);

    const distinctStates = [...new Set(stateRows.flatMap((r) => r.availableStates))].sort();

    return {
      categories: categories.map((c) => c.category),
      governmentLevels: levels.map((l) => l.governmentLevel),
      statuses: statuses.map((s) => s.status),
      states: distinctStates.length > 0 ? distinctStates : ['Gujarat'],
    };
  }

  async findOne(id: string): Promise<AdminGovernmentSchemeDetails> {
    const row = await this.prisma.governmentScheme.findUnique({
      where: { id },
      select: this.detailSelect,
    });

    if (!row) {
      throw new NotFoundException('Government scheme not found');
    }

    return this.toDetails(row);
  }

  async create(
    dto: AdminGovernmentSchemeDto,
    admin?: AdminProfileResponse,
  ): Promise<AdminGovernmentSchemeDetails> {
    this.validateContents(dto);

    try {
      const row = await this.prisma.governmentScheme.create({
        data: {
          slug: dto.slug.trim(),
          governmentLevel: dto.governmentLevel,
          department: dto.department.trim(),
          category: dto.category.trim(),
          status: dto.status,
          availableStates: dto.availableStates.map((s) => s.trim()).filter(Boolean),
          applicationUrl: dto.applicationUrl?.trim() || null,
          sourceUrl: dto.sourceUrl.trim(),
          lastVerifiedAt: dto.lastVerifiedAt ? new Date(dto.lastVerifiedAt) : null,
          isPublished: dto.isPublished ?? true,
          sortOrder: dto.sortOrder ?? 0,
          contents: {
            create: dto.contents.map((content) => this.contentData(content)),
          },
        },
        select: this.detailSelect,
      });

      await this.auditService.recordAuditLog({
        actorId: admin?.id,
        actorType: 'admin',
        actorName: admin?.username,
        action: 'GOVERNMENT_SCHEME_CREATE',
        resource: 'government_scheme',
        resourceId: row.id,
        description: `Administrator ${admin?.username || 'system'} created government scheme "${dto.slug}"`,
        metadata: { slug: dto.slug, category: dto.category, status: dto.status },
        status: 'SUCCESS',
      });

      return this.toDetails(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A government scheme with this slug or language already exists');
      }
      throw error;
    }
  }

  async update(
    id: string,
    dto: AdminGovernmentSchemeDto,
    admin?: AdminProfileResponse,
  ): Promise<AdminGovernmentSchemeDetails> {
    this.validateContents(dto);

    const existing = await this.prisma.governmentScheme.findUnique({
      where: { id },
      select: { id: true, slug: true },
    });

    if (!existing) {
      throw new NotFoundException('Government scheme not found');
    }

    try {
      const row = await this.prisma.$transaction(async (tx) => {
        await tx.governmentScheme.update({
          where: { id },
          data: {
            slug: dto.slug.trim(),
            governmentLevel: dto.governmentLevel,
            department: dto.department.trim(),
            category: dto.category.trim(),
            status: dto.status,
            availableStates: dto.availableStates.map((s) => s.trim()).filter(Boolean),
            applicationUrl: dto.applicationUrl?.trim() || null,
            sourceUrl: dto.sourceUrl.trim(),
            lastVerifiedAt: dto.lastVerifiedAt ? new Date(dto.lastVerifiedAt) : null,
            isPublished: dto.isPublished ?? true,
            sortOrder: dto.sortOrder ?? 0,
          },
        });

        for (const content of dto.contents) {
          const contentData = this.contentData(content);
          await tx.governmentSchemeContent.upsert({
            where: {
              schemeId_locale: {
                schemeId: id,
                locale: content.locale,
              },
            },
            update: contentData,
            create: {
              schemeId: id,
              ...contentData,
            },
          });
        }

        return tx.governmentScheme.findUniqueOrThrow({
          where: { id },
          select: this.detailSelect,
        });
      });

      await this.auditService.recordAuditLog({
        actorId: admin?.id,
        actorType: 'admin',
        actorName: admin?.username,
        action: 'GOVERNMENT_SCHEME_UPDATE',
        resource: 'government_scheme',
        resourceId: id,
        description: `Administrator ${admin?.username || 'system'} updated government scheme "${dto.slug}"`,
        metadata: { slug: dto.slug, category: dto.category },
        status: 'SUCCESS',
      });

      return this.toDetails(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A government scheme with this slug or language already exists');
      }
      throw error;
    }
  }

  async updateStatus(
    id: string,
    dto: AdminGovernmentSchemeStatusDto,
    admin?: AdminProfileResponse,
  ) {
    const existing = await this.prisma.governmentScheme.findUnique({
      where: { id },
      select: { id: true, slug: true },
    });

    if (!existing) {
      throw new NotFoundException('Government scheme not found');
    }

    const updated = await this.prisma.governmentScheme.update({
      where: { id },
      data: { isPublished: dto.isPublished },
      select: { id: true, isPublished: true },
    });

    await this.auditService.recordAuditLog({
      actorId: admin?.id,
      actorType: 'admin',
      actorName: admin?.username,
      action: 'GOVERNMENT_SCHEME_STATUS_CHANGE',
      resource: 'government_scheme',
      resourceId: id,
      description: `Administrator ${admin?.username || 'system'} ${dto.isPublished ? 'published' : 'unpublished'} government scheme "${existing.slug}"`,
      metadata: { schemeId: id, slug: existing.slug, isPublished: dto.isPublished },
      status: 'SUCCESS',
    });

    return updated;
  }

  async delete(id: string, admin?: AdminProfileResponse) {
    const existing = await this.prisma.governmentScheme.findUnique({
      where: { id },
      select: { id: true, slug: true },
    });

    if (!existing) {
      throw new NotFoundException('Government scheme not found');
    }

    await this.prisma.governmentScheme.delete({
      where: { id },
    });

    await this.auditService.recordAuditLog({
      actorId: admin?.id,
      actorType: 'admin',
      actorName: admin?.username,
      action: 'GOVERNMENT_SCHEME_DELETE',
      resource: 'government_scheme',
      resourceId: id,
      description: `Administrator ${admin?.username || 'system'} deleted government scheme "${existing.slug}"`,
      metadata: { schemeId: id, slug: existing.slug },
      status: 'SUCCESS',
    });

    return { id, slug: existing.slug, deleted: true };
  }

  private validateContents(dto: AdminGovernmentSchemeDto) {
    if (!dto.contents || dto.contents.length === 0) {
      throw new ConflictException('At least one language content is required');
    }

    const locales = dto.contents.map((c) => c.locale);
    if (new Set(locales).size !== locales.length) {
      throw new ConflictException('Each language content can only be provided once');
    }

    for (const content of dto.contents) {
      if (!content.name?.trim()) {
        throw new ConflictException(`Scheme name is required for language: ${content.locale}`);
      }
      if (!content.shortDescription?.trim()) {
        throw new ConflictException(`Short description is required for language: ${content.locale}`);
      }
      if (!content.description?.trim()) {
        throw new ConflictException(`Full description is required for language: ${content.locale}`);
      }
    }
  }

  private toListItem(row: {
    id: string;
    slug: string;
    governmentLevel: string;
    department: string;
    category: string;
    status: string;
    availableStates: string[];
    applicationUrl: string | null;
    sourceUrl: string;
    lastVerifiedAt: Date | null;
    isPublished: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
    contents: Array<{ locale: string; name: string; shortDescription: string }>;
  }): AdminGovernmentSchemeListItem {
    const contents = row.contents.filter(
      (c): c is typeof c & { locale: AdminGovernmentSchemeLocale } =>
        LOCALES.includes(c.locale as AdminGovernmentSchemeLocale),
    );

    return {
      id: row.id,
      slug: row.slug,
      governmentLevel: row.governmentLevel,
      department: row.department,
      category: row.category,
      status: row.status,
      availableStates: row.availableStates,
      applicationUrl: row.applicationUrl,
      sourceUrl: row.sourceUrl,
      lastVerifiedAt: this.dateIso(row.lastVerifiedAt),
      isPublished: row.isPublished,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      contents,
      availableLocales: contents.map((c) => c.locale),
    };
  }

  private toDetails(row: any): AdminGovernmentSchemeDetails {
    const listItem = this.toListItem(row);
    return {
      ...listItem,
      contents: row.contents.map((content: any) => ({
        id: content.id,
        locale: content.locale as AdminGovernmentSchemeLocale,
        name: content.name,
        shortDescription: content.shortDescription,
        description: content.description,
        benefits: this.strings(content.benefits),
        eligibility: this.strings(content.eligibility),
        documents: this.strings(content.documents),
        applicationSteps: this.strings(content.applicationSteps),
        conditions: this.strings(content.conditions),
        keywords: Array.isArray(content.keywords) ? content.keywords : [],
        createdAt: content.createdAt?.toISOString?.() ?? String(content.createdAt),
        updatedAt: content.updatedAt?.toISOString?.() ?? String(content.updatedAt),
      })),
    };
  }
}
