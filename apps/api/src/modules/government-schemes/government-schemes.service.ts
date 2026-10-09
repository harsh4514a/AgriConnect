import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryGovernmentSchemesDto } from './dto/query-government-schemes.dto';

const SUPPORTED_LOCALES = ['en', 'hi', 'gu'] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

type SchemeContent = {
  locale: string;
  name: string;
  shortDescription: string;
  description: string;
  benefits: unknown;
  eligibility: unknown;
  documents: unknown;
  applicationSteps: unknown;
  conditions: unknown;
  keywords: string[];
};

@Injectable()
export class GovernmentSchemesService {
  constructor(private readonly prisma: PrismaService) {}

  private locale(value?: string): SupportedLocale {
    return SUPPORTED_LOCALES.includes(value as SupportedLocale)
      ? (value as SupportedLocale)
      : 'en';
  }

  private contentFor(contents: SchemeContent[], locale: SupportedLocale) {
    return contents.find((content) => content.locale === locale);
  }

  private strings(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === 'string');
  }

  private dateOnly(value: Date | null) {
    return value ? value.toISOString().slice(0, 10) : null;
  }

  async findAll(query: QueryGovernmentSchemesDto) {
    const locale = this.locale(query.locale);
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 12, 1), 50);
    const search = query.search?.trim();

    const where = {
      isPublished: true,
      ...(query.category ? { category: query.category } : {}),
      ...(query.governmentLevel ? { governmentLevel: query.governmentLevel } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.state ? { availableStates: { has: query.state } } : {}),
      ...(search
        ? {
            contents: {
              some: {
                searchText: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
            },
          }
        : {}),
    };

    const [total, rows, categories, levels, statuses] = await Promise.all([
      this.prisma.governmentScheme.count({ where }),
      this.prisma.governmentScheme.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          contents: {
            where: { locale },
            select: {
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
            },
          },
        },
      }),
      this.prisma.governmentScheme.findMany({
        where: { isPublished: true },
        select: { category: true },
        distinct: ['category'],
        orderBy: { category: 'asc' },
      }),
      this.prisma.governmentScheme.findMany({
        where: { isPublished: true },
        select: { governmentLevel: true },
        distinct: ['governmentLevel'],
        orderBy: { governmentLevel: 'asc' },
      }),
      this.prisma.governmentScheme.findMany({
        where: { isPublished: true },
        select: { status: true },
        distinct: ['status'],
        orderBy: { status: 'asc' },
      }),
    ]);

    return {
      items: rows
        .map((row) => {
          const content = this.contentFor(row.contents, locale);
          if (!content) return null;

          return {
            slug: row.slug,
            name: content.name,
            shortDescription: content.shortDescription,
            category: row.category,
            governmentLevel: row.governmentLevel,
            status: row.status,
            department: row.department,
            hasApplicationUrl: Boolean(row.applicationUrl),
            lastVerifiedAt: this.dateOnly(row.lastVerifiedAt),
          };
        })
        .filter(Boolean),
      categories: categories.map((item) => item.category),
      governmentLevels: levels.map((item) => item.governmentLevel),
      statuses: statuses.map((item) => item.status),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(slug: string, localeValue?: string) {
    const locale = this.locale(localeValue);
    const row = await this.prisma.governmentScheme.findFirst({
      where: { slug, isPublished: true },
      include: {
        contents: {
          select: {
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
          },
        },
      },
    });

    if (!row) {
      throw new NotFoundException('Government scheme not found');
    }

    const content = this.contentFor(row.contents, locale);
    if (!content) {
      throw new NotFoundException('Government scheme content not found');
    }

    return {
      slug: row.slug,
      name: content.name,
      shortDescription: content.shortDescription,
      description: content.description,
      category: row.category,
      governmentLevel: row.governmentLevel,
      department: row.department,
      status: row.status,
      availableStates: row.availableStates,
      benefits: this.strings(content.benefits),
      eligibility: this.strings(content.eligibility),
      documents: this.strings(content.documents),
      applicationSteps: this.strings(content.applicationSteps),
      conditions: this.strings(content.conditions),
      applicationUrl: row.applicationUrl,
      sourceUrl: row.sourceUrl,
      lastVerifiedAt: this.dateOnly(row.lastVerifiedAt),
    };
  }
}
