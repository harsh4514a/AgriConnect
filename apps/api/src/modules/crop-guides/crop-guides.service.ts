import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryCropGuidesDto } from './dto/query-crop-guides.dto';

const SUPPORTED_LOCALES = ['en', 'hi', 'gu'] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

@Injectable()
export class CropGuidesService {
  constructor(private readonly prisma: PrismaService) {}

  private locale(value?: string): SupportedLocale {
    return SUPPORTED_LOCALES.includes(value as SupportedLocale)
      ? (value as SupportedLocale)
      : 'en';
  }

  private contentFor(
    contents: Array<{
      locale: string;
      name: string;
      aliases: string[];
      shortDescription: string;
      suitableSeason: string | null;
      sections: unknown;
    }>,
    locale: SupportedLocale,
  ) {
    return contents.find((content) => content.locale === locale);
  }

  private localizedSourceName(sourceName: string, locale: SupportedLocale) {
    const sourceNames: Record<string, Record<SupportedLocale, string>> = {
      'ICAR — Kharif Agro-Advisories for Farmers 2025': {
        en: 'ICAR — Kharif Agro-Advisories for Farmers 2025',
        hi: 'ICAR — किसानों के लिए खरीफ कृषि सलाह 2025',
        gu: 'ICAR — ખેડૂતો માટે ખરીફ કૃષિ સલાહ 2025',
      },
      'Gujarat Agro Industries Corporation — Gujarat Agriculture Strengths': {
        en: 'Gujarat Agro Industries Corporation — Gujarat Agriculture Strengths',
        hi: 'गुजरात एग्रो इंडस्ट्रीज कॉर्पोरेशन — गुजरात कृषि की विशेषताएं',
        gu: 'ગુજરાત એગ્રો ઇન્ડસ્ટ્રીઝ કોર્પોરેશન — ગુજરાત કૃષિની વિશેષતાઓ',
      },
      'Gujarat State Seeds Corporation — Seed Production Programme': {
        en: 'Gujarat State Seeds Corporation — Seed Production Programme',
        hi: 'गुजरात राज्य बीज निगम — बीज उत्पादन कार्यक्रम',
        gu: 'ગુજરાત રાજ્ય બીજ નિગમ — બીજ ઉત્પાદન કાર્યક્રમ',
      },
      'Government of Gujarat — Agricultural Produce Schedule': {
        en: 'Government of Gujarat — Agricultural Produce Schedule',
        hi: 'गुजरात सरकार — कृषि उपज अनुसूची',
        gu: 'ગુજરાત સરકાર — કૃષિ ઉપજની અનુસૂચિ',
      },
      'Junagadh Agricultural University — Farmer FIRST Programme': {
        en: 'Junagadh Agricultural University — Farmer FIRST Programme',
        hi: 'जूनागढ़ कृषि विश्वविद्यालय — Farmer FIRST कार्यक्रम',
        gu: 'જૂનાગઢ કૃષિ યુનિવર્સિટી — Farmer FIRST કાર્યક્રમ',
      },
      'Junagadh Agricultural University — Main Dry Farming Research Station': {
        en: 'Junagadh Agricultural University — Main Dry Farming Research Station',
        hi: 'जूनागढ़ कृषि विश्वविद्यालय — मुख्य शुष्क खेती अनुसंधान केंद्र',
        gu: 'જૂનાગઢ કૃષિ યુનિવર્સિટી — મુખ્ય સૂકી ખેતી સંશોધન કેન્દ્ર',
      },
      'ICAR — Gujarat State Agricultural Interventions': {
        en: 'ICAR — Gujarat State Agricultural Interventions',
        hi: 'ICAR — गुजरात राज्य कृषि हस्तक्षेप',
        gu: 'ICAR — ગુજરાત રાજ્ય કૃષિ હસ્તક્ષેપ',
      },
      'Junagadh Agricultural University — Pulses Research Station': {
        en: 'Junagadh Agricultural University — Pulses Research Station',
        hi: 'जूनागढ़ कृषि विश्वविद्यालय — दलहन अनुसंधान केंद्र',
        gu: 'જૂનાગઢ કૃષિ યુનિવર્સિટી — કઠોળ સંશોધન કેન્દ્ર',
      },
      'Junagadh Agricultural University — Castor Research Station': {
        en: 'Junagadh Agricultural University — Castor Research Station',
        hi: 'जूनागढ़ कृषि विश्वविद्यालय — अरंडी अनुसंधान केंद्र',
        gu: 'જૂનાગઢ કૃષિ યુનિવર્સિટી — એરંડા સંશોધન કેન્દ્ર',
      },
      'Junagadh Agricultural University — Main Oilseeds Research Station': {
        en: 'Junagadh Agricultural University — Main Oilseeds Research Station',
        hi: 'जूनागढ़ कृषि विश्वविद्यालय — मुख्य तिलहन अनुसंधान केंद्र',
        gu: 'જૂનાગઢ કૃષિ યુનિવર્સિટી — મુખ્ય તેલબિયાં સંશોધન કેન્દ્ર',
      },
      'Junagadh Agricultural University — Gujarat crop advisory record': {
        en: 'Junagadh Agricultural University — Gujarat crop advisory record',
        hi: 'जूनागढ़ कृषि विश्वविद्यालय — गुजरात फसल सलाह रिकॉर्ड',
        gu: 'જૂનાગઢ કૃષિ યુનિવર્સિટી — ગુજરાત પાક સલાહ રેકોર્ડ',
      },
      'Gujarat Agro Industries Corporation — Commodity Profile': {
        en: 'Gujarat Agro Industries Corporation — Commodity Profile',
        hi: 'गुजरात एग्रो इंडस्ट्रीज कॉर्पोरेशन — कमोडिटी प्रोफाइल',
        gu: 'ગુજરાત એગ્રો ઇન્ડસ્ટ્રીઝ કોર્પોરેશન — કોમોડિટી પ્રોફાઇલ',
      },
      'Anand Agricultural University — Research Recommendations': {
        en: 'Anand Agricultural University — Research Recommendations',
        hi: 'आनंद कृषि विश्वविद्यालय — अनुसंधान सिफारिशें',
        gu: 'આણંદ કૃષિ યુનિવર્સિટી — સંશોધન ભલામણો',
      },
    };

    return sourceNames[sourceName]?.[locale] ?? sourceName;
  }

  private normalizeSections(value: unknown): Record<string, string[]> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, points]) => [
        key,
        Array.isArray(points)
          ? points.filter((point): point is string => typeof point === 'string')
          : [],
      ]),
    );
  }

  async findAll(query: QueryCropGuidesDto) {
    const locale = this.locale(query.locale);
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 24, 1), 50);
    const search = query.search?.trim();

    const where = {
      isPublished: true,
      ...(query.category ? { category: query.category } : {}),
      ...(query.season ? { seasonKeys: { has: query.season } } : {}),
      contents: { some: { locale } },
      ...(search
        ? {
            AND: [
              {
                contents: {
                  some: {
                    searchText: { contains: search, mode: 'insensitive' as const },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [total, rows, categories, seasons] = await Promise.all([
      this.prisma.cropGuide.count({ where }),
      this.prisma.cropGuide.findMany({
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
              aliases: true,
              shortDescription: true,
              suitableSeason: true,
              sections: true,
            },
          },
        },
      }),
      this.prisma.cropGuide.findMany({
        where: { isPublished: true },
        select: { category: true },
        distinct: ['category'],
        orderBy: { category: 'asc' },
      }),
      this.prisma.cropGuide.findMany({
        where: { isPublished: true },
        select: { seasonKeys: true },
      }),
    ]);

    const seasonSet = new Set(seasons.flatMap((row) => row.seasonKeys));

    return {
      items: rows.map((row) => {
        const content = this.contentFor(row.contents, locale);

        if (!content) return null;

        return {
          slug: row.slug,
          image: row.image,
          imageAlt: content?.name ?? row.imageAlt,
          category: row.category,
          seasonKeys: row.seasonKeys,
          name: content?.name ?? row.slug,
          aliases: content?.aliases ?? [],
          shortDescription: content?.shortDescription ?? '',
          suitableSeason: content?.suitableSeason ?? null,
        };
      }).filter(Boolean),
      categories: categories.map((item) => item.category),
      seasons: ['kharif', 'rabi', 'summer', 'yearRound'].filter((season) =>
        seasonSet.has(season),
      ),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(slug: string, localeValue?: string) {
    const locale = this.locale(localeValue);
    const row = await this.prisma.cropGuide.findFirst({
      where: { slug, isPublished: true },
      include: { contents: true },
    });

    if (!row) {
      throw new NotFoundException('Crop guide not found');
    }

    const content = this.contentFor(row.contents, locale);

    if (!content) {
      throw new NotFoundException('Crop guide content not found');
    }

    return {
      slug: row.slug,
      image: row.image,
      imageAlt: content.name || row.imageAlt,
      category: row.category,
      seasonKeys: row.seasonKeys,
      name: content.name,
      aliases: content.aliases,
      shortDescription: content.shortDescription,
      suitableSeason: content.suitableSeason,
      sections: this.normalizeSections(content.sections),
      source: { name: this.localizedSourceName(row.sourceName, locale), url: row.sourceUrl },
    };
  }
}
