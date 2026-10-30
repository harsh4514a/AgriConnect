export interface GeoPoint {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
}

export interface DistanceRow<T> {
  item: T;
  distanceKm: number | null;
}

export function hasValidCoordinates(
  point: GeoPoint,
): point is { latitude: number; longitude: number } {
  const { latitude, longitude } = point;
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    !(latitude === 0 && longitude === 0)
  );
}

/** Great-circle distance in kilometres; invalid points return null. */
export function haversineKm(from: GeoPoint, to: GeoPoint): number | null {
  if (!hasValidCoordinates(from) || !hasValidCoordinates(to)) return null;

  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const lat1 = from.latitude;
  const lat2 = to.latitude;
  const deltaLat = radians(lat2 - lat1);
  const deltaLng = radians(to.longitude - from.longitude);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(deltaLng / 2) ** 2;
  const boundedA = Math.min(1, Math.max(0, a));

  return 2 * 6371.0088 * Math.atan2(Math.sqrt(boundedA), Math.sqrt(1 - boundedA));
}

export function isWithinRadius(distanceKm: number | null, radiusKm: number): boolean {
  return distanceKm !== null && Number.isFinite(distanceKm) && distanceKm <= radiusKm + 1e-9;
}

/** Known distances sort first; equal distances use newest date, then stable ID. */
export function compareDistanceRows<T extends { id: string; createdAt: Date | string }>(
  a: DistanceRow<T>,
  b: DistanceRow<T>,
): number {
  if (a.distanceKm === null && b.distanceKm !== null) return 1;
  if (a.distanceKm !== null && b.distanceKm === null) return -1;

  if (a.distanceKm !== null && b.distanceKm !== null) {
    const delta = a.distanceKm - b.distanceKm;
    if (Math.abs(delta) > 1e-9) return delta;
  }

  const aCreatedAt = new Date(a.item.createdAt).getTime();
  const bCreatedAt = new Date(b.item.createdAt).getTime();
  if (aCreatedAt !== bCreatedAt) return bCreatedAt - aCreatedAt;
  return a.item.id.localeCompare(b.item.id);
}

export function filterDistanceRows<T>(
  rows: DistanceRow<T>[],
  radiusKm: number,
): DistanceRow<T>[] {
  return rows.filter(({ distanceKm }) => isWithinRadius(distanceKm, radiusKm));
}
