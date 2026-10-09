import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AdminAuditService } from '../audit/admin-audit.service';
import { AdminProfileResponse } from '../auth/interfaces/admin-auth-response.interface';
import { AdminCropGuideDto } from './dto/admin-crop-guide.dto';
import { AdminCropGuideQueryDto } from './dto/admin-crop-guide-query.dto';
import { AdminCropGuideStatusDto } from './dto/admin-crop-guide-status.dto';
import {
  AdminCropGuideDetails,
  AdminCropGuideFiltersResponse,
  AdminCropGuideListItem,
  AdminCropGuidesResponse,
} from './interfaces/admin-crop-guides-response.interface';

const LOCALES = ['en', 'gu', 'hi'] as const;
type Locale = (typeof LOCALES)[number];

@Injectable()
export class AdminCropGuidesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
  ) {}

  private readonly listSelect = {
    id: true,
    slug: true,
    image: true,
    imageAlt: true,
    category: true,
    seasonKeys: true,
    sortOrder: true,
    isPublished: true,
    sourceName: true,
    sourceUrl: true,
    createdAt: true,
    updatedAt: true,
    contents: { select: { locale: true, name: true, shortDescription: true } },
  } as const;

  private readonly detailSelect = {
    ...this.listSelect,
    contents: {
      select: {
        id: true,
        locale: true,
        name: true,
        aliases: true,
        shortDescription: true,
        suitableSeason: true,
        sections: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { locale: 'asc' as const },
    },
  } as const;

  private buildWhere(query: AdminCropGuideQueryDto): Prisma.CropGuideWhereInput {
    const search = query.search?.trim();
    const contentWhere =
      query.locale || search
        ? {
            locale: query.locale,
            ...(search ? { searchText: { contains: search, mode: 'insensitive' as const } } : {}),
          }
        : undefined;

    return {
      ...(query.category ? { category: query.category } : {}),
      ...(query.season ? { seasonKeys: { has: query.season } } : {}),
      ...(query.isPublished === undefined ? {} : { isPublished: query.isPublished }),
      ...(contentWhere ? { contents: { some: contentWhere } } : {}),
    };
  }

  async findAll(query: AdminCropGuideQueryDto): Promise<AdminCropGuidesResponse> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = this.buildWhere(query);
    const orderBy =
      query.sort === 'name'
        ? { slug: 'asc' as const }
        : { createdAt: query.sort === 'oldest' ? ('asc' as const) : ('desc' as const) };

    const [total, rows] = await Promise.all([
      this.prisma.cropGuide.count({ where }),
      this.prisma.cropGuide.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: this.listSelect,
      }),
    ]);

    return {
      items: rows.map((row) => this.toListItem(row)),
      pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    };
  }

  async getFilters(): Promise<AdminCropGuideFiltersResponse> {
    const [categories, seasonRows] = await Promise.all([
      this.prisma.cropGuide.findMany({
        distinct: ['category'],
        orderBy: { category: 'asc' },
        select: { category: true },
      }),
      this.prisma.cropGuide.findMany({ select: { seasonKeys: true } }),
    ]);
    return {
      categories: categories.map(({ category }) => category),
      seasons: [...new Set(seasonRows.flatMap(({ seasonKeys }) => seasonKeys))].sort(),
    };
  }

  async findOne(id: string): Promise<AdminCropGuideDetails> {
    const row = await this.prisma.cropGuide.findUnique({
      where: { id },
      select: this.detailSelect,
    });
    if (!row) throw new NotFoundException('Crop guide not found');
    return this.toDetails(row);
  }

  async create(
    dto: AdminCropGuideDto,
    admin?: AdminProfileResponse,
  ): Promise<AdminCropGuideDetails> {
    this.validateContents(dto);
    try {
      const row = await this.prisma.cropGuide.create({
        data: {
          slug: dto.slug,
          image: dto.image,
          imageAlt: dto.imageAlt,
          category: dto.category,
          seasonKeys: dto.seasonKeys,
          sortOrder: dto.sortOrder ?? 0,
          isPublished: dto.isPublished ?? false,
          sourceName: dto.sourceName,
          sourceUrl: dto.sourceUrl,
          contents: { create: dto.contents.map((content) => this.contentData(content)) },
        },
        select: this.detailSelect,
      });

      await this.auditService.recordAuditLog({
        actorId: admin?.id,
        actorType: 'admin',
        actorName: admin?.username,
        action: 'CROP_GUIDE_CREATE',
        resource: 'crop_guide',
        resourceId: row.id,
        description: `Administrator ${admin?.username || 'system'} created crop guide for "${dto.slug}"`,
        metadata: { slug: dto.slug, category: dto.category, isPublished: dto.isPublished },
        status: 'SUCCESS',
      });

      return this.toDetails(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A crop guide with this slug or language already exists');
      }
      throw error;
    }
  }

  async update(
    id: string,
    dto: AdminCropGuideDto,
    admin?: AdminProfileResponse,
  ): Promise<AdminCropGuideDetails> {
    this.validateContents(dto);
    const existing = await this.prisma.cropGuide.findUnique({
      where: { id },
      select: { id: true, slug: true },
    });
    if (!existing) throw new NotFoundException('Crop guide not found');

    try {
      const row = await this.prisma.$transaction(async (tx) => {
        await tx.cropGuide.update({
          where: { id },
          data: {
            slug: dto.slug,
            image: dto.image,
            imageAlt: dto.imageAlt,
            category: dto.category,
            seasonKeys: dto.seasonKeys,
            sortOrder: dto.sortOrder ?? 0,
            isPublished: dto.isPublished ?? false,
            sourceName: dto.sourceName,
            sourceUrl: dto.sourceUrl,
          },
        });
        for (const content of dto.contents) {
          await tx.cropGuideContent.upsert({
            where: { cropGuideId_locale: { cropGuideId: id, locale: content.locale } },
            update: this.contentData(content),
            create: { cropGuideId: id, ...this.contentData(content) },
          });
        }
        return tx.cropGuide.findUniqueOrThrow({ where: { id }, select: this.detailSelect });
      });

      await this.auditService.recordAuditLog({
        actorId: admin?.id,
        actorType: 'admin',
        actorName: admin?.username,
        action: 'CROP_GUIDE_UPDATE',
        resource: 'crop_guide',
        resourceId: id,
        description: `Administrator ${admin?.username || 'system'} updated crop guide for "${dto.slug}"`,
        metadata: { slug: dto.slug, category: dto.category },
        status: 'SUCCESS',
      });

      return this.toDetails(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A crop guide with this slug or language already exists');
      }
      throw error;
    }
  }

  async updateStatus(
    id: string,
    dto: AdminCropGuideStatusDto,
    admin?: AdminProfileResponse,
  ) {
    const existing = await this.prisma.cropGuide.findUnique({
      where: { id },
      select: { id: true, slug: true },
    });
    if (!existing) throw new NotFoundException('Crop guide not found');

    const updated = await this.prisma.cropGuide.update({
      where: { id },
      data: { isPublished: dto.isPublished },
      select: { id: true, isPublished: true },
    });

    await this.auditService.recordAuditLog({
      actorId: admin?.id,
      actorType: 'admin',
      actorName: admin?.username,
      action: 'CROP_GUIDE_STATUS_CHANGE',
      resource: 'crop_guide',
      resourceId: id,
      description: `Administrator ${admin?.username || 'system'} ${dto.isPublished ? 'published' : 'unpublished'} crop guide for "${existing.slug}"`,
      metadata: { cropGuideId: id, slug: existing.slug, isPublished: dto.isPublished },
      status: 'SUCCESS',
    });

    return updated;
  }

  private validateContents(dto: AdminCropGuideDto) {
    const locales = dto.contents.map((content) => content.locale);
    if (new Set(locales).size !== locales.length)
      throw new ConflictException('Each language can only be supplied once');
    for (const content of dto.contents) {
      for (const [key, points] of Object.entries(content.sections ?? {})) {
        if (!Array.isArray(points) || points.some((point) => typeof point !== 'string')) {
          throw new ConflictException(`Invalid content section: ${key}`);
        }
      }
    }
  }

  private contentData(content: AdminCropGuideDto['contents'][number]) {
    const aliases = (content.aliases ?? []).map((alias) => alias.trim()).filter(Boolean);
    const sections = Object.fromEntries(
      Object.entries(content.sections).map(([key, points]) => [
        key,
        points.map((point) => point.trim()).filter(Boolean),
      ]),
    );
    return {
      locale: content.locale,
      name: content.name.trim(),
      aliases,
      searchText: [content.name, ...aliases, content.shortDescription, content.suitableSeason ?? '']
        .join(' ')
        .trim(),
      shortDescription: content.shortDescription.trim(),
      suitableSeason: content.suitableSeason?.trim() || null,
      sections,
    };
  }

  private toListItem(row: {
    id: string;
    slug: string;
    image: string;
    imageAlt: string;
    category: string;
    seasonKeys: string[];
    sortOrder: number;
    isPublished: boolean;
    sourceName: string;
    sourceUrl: string;
    createdAt: Date;
    updatedAt: Date;
    contents: Array<{ locale: string; name: string; shortDescription: string }>;
  }): AdminCropGuideListItem {
    const contents = row.contents.filter(
      (content): content is typeof content & { locale: Locale } =>
        LOCALES.includes(content.locale as Locale),
    );
    return {
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      contents,
      availableLocales: contents.map((content) => content.locale),
    };
  }

  private toDetails(row: any): AdminCropGuideDetails {
    return {
      ...this.toListItem(row),
      contents: row.contents.map((content: any) => ({
        ...content,
        sections: this.normalizeSections(content.sections),
        createdAt: content.createdAt.toISOString(),
        updatedAt: content.updatedAt.toISOString(),
      })),
    };
  }

  private normalizeSections(value: unknown): Record<string, string[]> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, points]) => [
        key,
        Array.isArray(points)
          ? points.filter((point): point is string => typeof point === 'string')
          : [],
      ]),
    );
  }
}
