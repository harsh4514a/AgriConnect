import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import {
  AdminDashboardResponse,
  AdminRecentActivity,
} from './interfaces/admin-dashboard-response.interface';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(): Promise<AdminDashboardResponse> {
    const [
      totalUsers,
      activeListings,
      activeBuyerRequirements,
      activeTransportListings,
      publishedGovernmentSchemes,
      publishedCropGuides,
      marketPriceRecords,
      users,
      listings,
      buyerRequirements,
      transportListings,
      schemes,
      cropGuides,
    ] = await Promise.all([
      this.prisma.user.count(),

      this.prisma.listing.count({
        where: {
          status: 'active',
        },
      }),

      this.prisma.buyerRequirement.count({
        where: {
          status: 'active',
        },
      }),

      this.prisma.transportProvider.count({
        where: {
          isActive: true,
        },
      }),

      this.prisma.governmentScheme.count({
        where: {
          isPublished: true,
          status: 'active',
        },
      }),

      this.prisma.cropGuide.count({
        where: {
          isPublished: true,
        },
      }),

      this.prisma.marketPrice.count(),

      this.prisma.user.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 3,
      }),

      this.prisma.listing.findMany({
        select: {
          id: true,
          cropKey: true,
          customCropName: true,
          district: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 3,
      }),

      this.prisma.buyerRequirement.findMany({
        select: {
          id: true,
          cropKey: true,
          customCropName: true,
          district: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 3,
      }),

      this.prisma.transportProvider.findMany({
        select: {
          id: true,
          businessName: true,
          vehicleType: true,
          districtId: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 3,
      }),

      this.prisma.governmentScheme.findMany({
        select: {
          id: true,
          slug: true,
          department: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 3,
      }),

      this.prisma.cropGuide.findMany({
        select: {
          id: true,
          slug: true,
          category: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 3,
      }),
    ]);

    const recentActivity: AdminRecentActivity[] = [
      ...users.map((user) => ({
        id: user.id,
        type: 'user' as const,
        title: [user.firstName, user.lastName]
          .filter(Boolean)
          .join(' ')
          .trim(),
        detail: '',
        createdAt: user.createdAt.toISOString(),
      })),

      ...listings.map((listing) => ({
        id: listing.id,
        type: 'listing' as const,
        title: listing.customCropName || listing.cropKey,
        detail: listing.district,
        createdAt: listing.createdAt.toISOString(),
      })),

      ...buyerRequirements.map((requirement) => ({
        id: requirement.id,
        type: 'buyerRequirement' as const,
        title: requirement.customCropName || requirement.cropKey,
        detail: requirement.district,
        createdAt: requirement.createdAt.toISOString(),
      })),

      ...transportListings.map((transport) => ({
        id: transport.id,
        type: 'transport' as const,
        title: transport.businessName,
        detail: transport.vehicleType,
        createdAt: transport.createdAt.toISOString(),
      })),

      ...schemes.map((scheme) => ({
        id: scheme.id,
        type: 'governmentScheme' as const,
        title: scheme.slug,
        detail: scheme.department,
        createdAt: scheme.createdAt.toISOString(),
      })),

      ...cropGuides.map((guide) => ({
        id: guide.id,
        type: 'cropGuide' as const,
        title: guide.slug,
        detail: guide.category,
        createdAt: guide.createdAt.toISOString(),
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime(),
      )
      .slice(0, 8);

    return {
      metrics: {
        totalUsers,
        activeListings,
        activeBuyerRequirements,
        activeTransportListings,
        publishedGovernmentSchemes,
        publishedCropGuides,
        marketPriceRecords,
      },
      recentActivity,
    };
  }
}