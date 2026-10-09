// 'use client';

// import { useMemo } from 'react';
// import { useAuth } from '@/hooks/use-auth';

// export interface ProfileLocation {
//   latitude: number;
//   longitude: number;
//   district?: string;
//   taluka?: string;
//   village?: string;
//   /** True when the user's saved profile location is available. */
//   available: boolean;
// }

// /**
//  * Resolve the user's saved profile location (district/taluka/village/lat/lng).
//  *
//  * The saved location comes from the completed profile — we do NOT use live
//  * GPS or device geolocation here. Nearby listings are computed against these
//  * saved coordinates. If the profile location is unavailable (e.g. profile not
//  * completed), `available` is false so the UI can disable Nearby and show the
//  * "Complete your profile location to use Nearby." prompt.
//  */
// export function useProfileLocation(): ProfileLocation {
//   const { user } = useAuth();
//   const saved = user?.location;

//   return useMemo<ProfileLocation>(() => {
//     if (saved && (saved.district || (saved.latitude && saved.longitude))) {
//       return {
//         latitude: saved.latitude || 0,
//         longitude: saved.longitude || 0,
//         district: saved.district,
//         taluka: saved.taluka,
//         village: saved.village,
//         available: true,
//       };
//     }

//     // No saved profile location yet — Nearby is unavailable until the user
//     // completes their profile location.
//     return {
//       latitude: 0,
//       longitude: 0,
//       district: undefined,
//       taluka: undefined,
//       village: undefined,
//       available: false,
//     };
//   }, [saved]);
// }

// /** Haversine distance (km) between two coordinates. */
// export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
//   const R = 6371;
//   const toRad = (deg: number) => (deg * Math.PI) / 180;
//   const dLat = toRad(lat2 - lat1);
//   const dLng = toRad(lng2 - lng1);
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
//   return 2 * R * Math.asin(Math.sqrt(a));
// }


'use client';

import { useMemo } from 'react';

import { useAuth } from '@/hooks/use-auth';

export interface ProfileLocation {
  latitude: number;
  longitude: number;
  district?: string;
  taluka?: string;
  village?: string;

  /**
   * True ONLY when usable latitude and longitude
   * are available.
   *
   * Nearby filtering depends on coordinates.
   */
  available: boolean;
}

/**
 * Resolve the user's SAVED profile location.
 *
 * Important:
 * - We do NOT use browser GPS here.
 * - We do NOT request location permission here.
 * - Nearby uses the coordinates already stored
 *   in the user's profile.
 */
export function useProfileLocation(): ProfileLocation {
  const { user } = useAuth();

  const saved = user?.location;

  return useMemo<ProfileLocation>(() => {
    const latitude =
      typeof saved?.latitude === 'number'
        ? saved.latitude
        : 0;

    const longitude =
      typeof saved?.longitude === 'number'
        ? saved.longitude
        : 0;

    /*
     * Coordinates must be real usable values.
     *
     * 0,0 is not considered a valid profile location.
     */
    const hasValidCoordinates =
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180 &&
      !(latitude === 0 &&
        longitude === 0);

    return {
      latitude,
      longitude,

      district:
        saved?.district,

      taluka:
        saved?.taluka,

      village:
        saved?.village,

      available:
        hasValidCoordinates,
    };
  }, [saved]);
}

/**
 * Calculate the great-circle distance between
 * two coordinates using the Haversine formula.
 *
 * Result is returned in kilometres.
 */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;

  const toRad = (
    degrees: number,
  ) =>
    (degrees * Math.PI) / 180;

  const dLat = toRad(
    lat2 - lat1,
  );

  const dLng = toRad(
    lng2 - lng1,
  );

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(
      toRad(lat1),
    ) *
      Math.cos(
        toRad(lat2),
      ) *
      Math.sin(
        dLng / 2,
      ) ** 2;

  return (
    2 *
    R *
    Math.asin(
      Math.sqrt(a),
    )
  );
}