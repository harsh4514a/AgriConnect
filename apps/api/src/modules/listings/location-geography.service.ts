import { Injectable } from '@nestjs/common';
import type { Listing, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { hasValidCoordinates, haversineKm, type GeoPoint } from './geo-distance';

export type CanonicalCoordinatePoint = {
  latitude: number | null;
  longitude: number | null;
  name?: string;
};

export type UserGeographicLocation = {
  latitude: number | null;
  longitude: number | null;
  district?: { name: string; latitude?: number | null; longitude?: number | null } | null;
  taluka?: { name: string; latitude?: number | null; longitude?: number | null } | null;
  village?: { name: string; latitude?: number | null; longitude?: number | null } | null;
};

export type ListingGeographicContext = Listing & {
  locationVillage?: CanonicalCoordinatePoint | null;
  user: UserGeographicLocation | null;
};

function normalizeLocationName(value: string | null | undefined): string {
  return value?.trim().toLocaleLowerCase() ?? '';
}

export function listingMatchesProfileLocation(
  listing: Pick<Listing, 'district' | 'taluka' | 'village'>,
  profileLocation: Pick<UserGeographicLocation, 'district' | 'taluka' | 'village'>,
): boolean {
  // A district or taluka alone is too broad to validate a user's precise
  // profile point against a listing address.
  if (!profileLocation.village?.name) return false;

  const parts = [
    [profileLocation.district?.name, listing.district],
    [profileLocation.taluka?.name, listing.taluka],
    [profileLocation.village?.name, listing.village],
  ].filter(([profileName]) => Boolean(profileName));

  return parts.length > 0 && parts.every(
    ([profileName, listingName]) => normalizeLocationName(profileName) === normalizeLocationName(listingName),
  );
}

@Injectable()
export class LocationGeographyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolve a user's trusted origin in specificity order. Device/profile GPS
   * takes precedence, followed by the selected village, taluka, and district
   * reference points. Missing or invalid points remain unresolved.
   */
  resolveUserCoordinates(location: UserGeographicLocation | null | undefined): GeoPoint | null {
    if (!location) return null;

    const candidates = [
      location,
      location.village,
      location.taluka,
      location.district,
    ];
    const resolved = candidates.find((point) => point && hasValidCoordinates({
      latitude: point.latitude,
      longitude: point.longitude,
    }));
    return resolved
      ? { latitude: resolved.latitude, longitude: resolved.longitude }
      : null;
  }

  /**
   * Resolve a listing from an explicitly submitted point, its verified
   * canonical locality, or the owner's profile point when the full locality
   * path agrees. Legacy default coordinates are deliberately ignored.
   */
  resolveListingCoordinates(
    listing: ListingGeographicContext,
  ): { latitude: number; longitude: number } | null {
    if (listing.hasExplicitCoordinates && hasValidCoordinates({
      latitude: listing.lat,
      longitude: listing.lng,
    })) {
      return { latitude: listing.lat, longitude: listing.lng };
    }

    if (listing.locationVillage && hasValidCoordinates(listing.locationVillage)) {
      return {
        latitude: listing.locationVillage.latitude,
        longitude: listing.locationVillage.longitude,
      };
    }

    if (
      listing.user &&
      listingMatchesProfileLocation(listing, listing.user)
    ) {
      const ownerPoint = this.resolveUserCoordinates(listing.user);
      if (ownerPoint && hasValidCoordinates(ownerPoint)) {
        return { latitude: ownerPoint.latitude, longitude: ownerPoint.longitude };
      }
    }

    return null;
  }

  distanceKm(from: GeoPoint, to: GeoPoint): number | null {
    return haversineKm(from, to);
  }

  /**
   * Link listings to the existing canonical village row only when the full
   * state/district/taluka/village path has exactly one case-insensitive match.
   * This never creates locations or guesses from a village name alone.
   */
  async findCanonicalVillageId(address: {
    state: string;
    district: string;
    taluka: string;
    village: string;
  }): Promise<string | null> {
    const candidates = await this.prisma.village.findMany({
      where: {
        name: { equals: address.village.trim(), mode: 'insensitive' },
        taluka: {
          is: {
            name: { equals: address.taluka.trim(), mode: 'insensitive' },
            district: {
              is: {
                name: { equals: address.district.trim(), mode: 'insensitive' },
                state: { is: { name: { equals: address.state.trim(), mode: 'insensitive' } } },
              },
            },
          },
        },
      },
      select: { id: true },
      take: 2,
    });

    return candidates.length === 1 ? candidates[0].id : null;
  }

  canonicalLocationInclude(): Prisma.ListingInclude {
    return {
      locationVillage: {
        select: { latitude: true, longitude: true },
      },
      user: {
        select: {
          latitude: true,
          longitude: true,
          district: { select: { name: true, latitude: true, longitude: true } },
          taluka: { select: { name: true, latitude: true, longitude: true } },
          village: { select: { name: true, latitude: true, longitude: true } },
        },
      },
    };
  }

  userLocationSelect(): Prisma.UserSelect {
    return {
      latitude: true,
      longitude: true,
      district: { select: { name: true, latitude: true, longitude: true } },
      taluka: { select: { name: true, latitude: true, longitude: true } },
      village: { select: { name: true, latitude: true, longitude: true } },
    };
  }
}
