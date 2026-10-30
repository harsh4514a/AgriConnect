import assert from 'node:assert/strict';
import test from 'node:test';
import type { Listing } from '@prisma/client';
import { ListingsService } from '../src/modules/listings/listings.service';
import { LocationGeographyService } from '../src/modules/listings/location-geography.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { hasValidCoordinates, haversineKm } from '../src/modules/listings/geo-distance';

const viewer = { id: 'viewer', latitude: 22.5641749559389, longitude: 72.9184576060692 };

function destination(latitude: number, longitude: number, distanceKm: number, bearingDegrees = 0) {
  const earthRadiusKm = 6371.0088;
  const bearing = (bearingDegrees * Math.PI) / 180;
  const angularDistance = distanceKm / earthRadiusKm;
  const latitudeRadians = (latitude * Math.PI) / 180;
  const longitudeRadians = (longitude * Math.PI) / 180;
  const destinationLatitude = Math.asin(
    Math.sin(latitudeRadians) * Math.cos(angularDistance) +
      Math.cos(latitudeRadians) * Math.sin(angularDistance) * Math.cos(bearing),
  );
  const destinationLongitude = longitudeRadians + Math.atan2(
    Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latitudeRadians),
    Math.cos(angularDistance) - Math.sin(latitudeRadians) * Math.sin(destinationLatitude),
  );
  return {
    latitude: (destinationLatitude * 180) / Math.PI,
    longitude: (destinationLongitude * 180) / Math.PI,
  };
}

function listing(
  id: string,
  point: { latitude: number; longitude: number } | null,
  options: { cropKey?: string; village?: string; createdAt?: Date; userId?: string | null } = {},
): Listing {
  return {
    id,
    cropKey: options.cropKey ?? 'wheat',
    image: '/crops/wheat.svg',
    imageAlt: 'Wheat',
    farmerName: `${id} Farmer`,
    farmerNameShort: id,
    district: 'Anand',
    village: options.village ?? 'Anand City',
    taluka: 'Anand',
    state: 'Gujarat',
    quantity: 10,
    unit: 'quintal',
    price: 1000,
    primaryUnit: '20 kg',
    secondaryUnit: 'quintal',
    marketPrice: 1100,
    distanceKm: 0,
    postedHoursAgo: 0,
    availability: 'available',
    verified: true,
    mobileNumber: '0000000000',
    phoneLabel: id,
    readyToSell: true,
    lat: point?.latitude ?? 22.03,
    lng: point?.longitude ?? 71.2,
    hasExplicitCoordinates: point !== null,
    locationVillageId: null,
    description: null,
    variety: null,
    customCropName: null,
    qualityGrade: null,
    cropDate: null,
    farmerMemberSince: null,
    farmerListingCount: null,
    additionalImages: [],
    status: 'active',
    isUserCreated: true,
    userId: options.userId ?? 'farmer',
    createdAt: options.createdAt ?? new Date('2026-10-01T00:00:00Z'),
    updatedAt: options.createdAt ?? new Date('2026-10-01T00:00:00Z'),
  } as Listing;
}

function serviceWithRows(rows: Listing[], userLocation: object = viewer) {
  const owners = new Map<string, object>();
  for (const row of rows) {
    owners.set(row.userId ?? '', {
      latitude: null,
      longitude: null,
      district: { name: 'Anand' },
      taluka: { name: 'Anand' },
      village: { name: 'Anand City' },
    });
  }

  const matchesSearch = (row: Listing, where: Record<string, unknown>) => {
    const alternatives = where.OR as Array<Record<string, { contains: string }>> | undefined;
    if (!alternatives?.length) return true;
    return alternatives.some((alternative) => {
      const [field, condition] = Object.entries(alternative)[0] ?? [];
      const value = (row as unknown as Record<string, unknown>)[field];
      return typeof value === 'string' && value.toLowerCase().includes(condition.contains.toLowerCase());
    });
  };

  const prisma = {
    listing: {
      findMany: async ({ where = {} }: { where?: Record<string, unknown> }) => rows
        .filter((row) => (!where.status || row.status === where.status))
        .filter((row) => (!where.availability || row.availability === where.availability))
        .filter((row) => (!where.cropKey || row.cropKey === where.cropKey))
        .filter((row) => (!where.district || row.district === where.district))
        .filter((row) => (!where.village || row.village === where.village))
        .filter((row) => matchesSearch(row, where))
        .map((row) => ({ ...row, user: owners.get(row.userId ?? '') ?? null })),
      count: async () => rows.length,
    },
    user: {
      findUnique: async ({ where }: { where: { id: string } }) => where.id === viewer.id
        ? userLocation
        : null,
    },
  };

  const prismaService = prisma as unknown as PrismaService;
  return new ListingsService(
    prismaService,
    {} as never,
    new LocationGeographyService(prismaService),
  );
}

test('Haversine returns zero for the same location and a known city-pair distance in kilometres', () => {
  assert.equal(haversineKm(viewer, viewer), 0);
  const london = { latitude: 51.5074, longitude: -0.1278 };
  const paris = { latitude: 48.8566, longitude: 2.3522 };
  const distance = haversineKm(london, paris);
  assert.ok(distance !== null && distance > 340 && distance < 350, `Expected about 344 km, got ${distance}`);
});

test('invalid, missing, sentinel and out-of-range coordinates never produce a distance', () => {
  assert.equal(hasValidCoordinates({ latitude: Number.NaN, longitude: 72 }), false);
  assert.equal(hasValidCoordinates({ latitude: 91, longitude: 72 }), false);
  assert.equal(hasValidCoordinates({ latitude: 22, longitude: 181 }), false);
  assert.equal(haversineKm({ latitude: null, longitude: 72 }, viewer), null);
  assert.equal(haversineKm({ latitude: 0, longitude: 0 }, viewer), null);
});

test('nearby combines crop and search filters, includes the exact radius boundary, and excludes missing coordinates', async () => {
  const atFiveKm = destination(viewer.latitude, viewer.longitude, 5);
  const atBoundary = destination(viewer.latitude, viewer.longitude, 25, 90);
  const outside = destination(viewer.latitude, viewer.longitude, 25.1, 180);
  const rows = [
    listing('close-wheat', atFiveKm, { village: 'Changa' }),
    listing('boundary-wheat', atBoundary, { village: 'Changa' }),
    listing('outside-wheat', outside, { village: 'Changa' }),
    listing('close-chili', destination(viewer.latitude, viewer.longitude, 2), { cropKey: 'chili', village: 'Changa' }),
    listing('unknown-wheat', null, { village: 'Changa' }),
  ];
  const service = serviceWithRows(rows);
  const response = await service.findNearby(viewer.id, {
    radius: 25,
    cropKey: 'wheat',
    search: 'Changa',
    page: 1,
    limit: 12,
  } as never);

  assert.deepEqual(response.listings.map((item) => item.id), ['close-wheat', 'boundary-wheat']);
  assert.equal(response.total, 2);
  assert.equal(response.unlocatedCount, 1);
  assert.ok(response.listings.every((item) => item.locationDistanceVerified));

  const fiveKmResponse = await service.findNearby(viewer.id, {
    radius: 5,
    cropKey: 'wheat',
    search: 'Changa',
    page: 1,
    limit: 12,
  } as never);
  assert.deepEqual(fiveKmResponse.listings.map((item) => item.id), ['close-wheat']);
});

test('nearest sorts the complete result set before pagination and leaves unknown points last', async () => {
  const rows = [
    listing('far', destination(viewer.latitude, viewer.longitude, 300), { createdAt: new Date('2026-10-03') }),
    listing('near', destination(viewer.latitude, viewer.longitude, 3), { createdAt: new Date('2026-10-01') }),
    listing('middle', destination(viewer.latitude, viewer.longitude, 30), { createdAt: new Date('2026-10-02') }),
    listing('unknown', null, { createdAt: new Date('2026-10-04') }),
  ];
  const service = serviceWithRows(rows);
  const pageOne = await service.findAll({ sort: 'nearest', page: 1, limit: 2 } as never, viewer.id);
  const pageTwo = await service.findAll({ sort: 'nearest', page: 2, limit: 2 } as never, viewer.id);

  assert.deepEqual(pageOne.listings.map((item) => item.id), ['near', 'middle']);
  assert.deepEqual(pageTwo.listings.map((item) => item.id), ['far', 'unknown']);
  assert.equal(pageOne.total, 4);
  assert.equal(pageOne.unlocatedCount, 1);
  assert.equal(pageTwo.listings[1].locationDistanceVerified, false);
  assert.equal(pageTwo.listings[1].distanceKm, 0);
});

test('nearest explicitly reports when the viewer profile has no usable coordinates', async () => {
  const service = serviceWithRows([listing('listing', null)]);
  const response = await service.findAll({ sort: 'nearest', page: 1, limit: 10 } as never, 'different-user');

  assert.equal(response.locationAvailable, false);
  assert.equal(response.listings[0].locationDistanceVerified, false);
});

test('canonical village points drive nearby filtering even when legacy listing coordinates are defaults', async () => {
  const within = destination(viewer.latitude, viewer.longitude, 15);
  const outside = destination(viewer.latitude, viewer.longitude, 300);
  const rows = [
    {
      ...listing('nearby-canonical', null, { village: 'Changa' }),
      locationVillage: { latitude: within.latitude, longitude: within.longitude },
    },
    {
      ...listing('far-canonical', null, { village: 'Porbandar' }),
      locationVillage: { latitude: outside.latitude, longitude: outside.longitude },
    },
  ] as unknown as Listing[];
  const response = await serviceWithRows(rows).findNearby(viewer.id, {
    radius: 25,
    page: 1,
    limit: 12,
  } as never);

  assert.deepEqual(response.listings.map(({ id }) => id), ['nearby-canonical']);
  assert.equal(response.listings[0].locationDistanceVerified, true);
});

test('nearest uses linked village coordinates instead of stale legacy listing defaults', async () => {
  const closePoint = destination(viewer.latitude, viewer.longitude, 3);
  const farPoint = destination(viewer.latitude, viewer.longitude, 90);
  const rows = [
    {
      ...listing('far-canonical', null, { village: 'Porbandar' }),
      locationVillage: { latitude: farPoint.latitude, longitude: farPoint.longitude },
    },
    {
      ...listing('close-canonical', null, { village: 'Changa' }),
      locationVillage: { latitude: closePoint.latitude, longitude: closePoint.longitude },
    },
  ] as unknown as Listing[];

  const response = await serviceWithRows(rows).findAll(
    { sort: 'nearest', page: 1, limit: 10 } as never,
    viewer.id,
  );

  assert.deepEqual(response.listings.map(({ id }) => id), ['close-canonical', 'far-canonical']);
  assert.equal(response.listings[0].distanceKm, 3);
  assert.equal(response.listings[1].distanceKm, 90);
});

test('nearby origin falls back from profile GPS to selected village, taluka, then district point', async () => {
  const profile = {
    latitude: 0,
    longitude: 0,
    village: { name: 'Anand City', latitude: 0, longitude: 0 },
    taluka: { name: 'Anand', latitude: 22.5642, longitude: 72.9185 },
    district: { name: 'Anand', latitude: 22.55, longitude: 72.95 },
  };
  const atTaluka = destination(22.5642, 72.9185, 8);
  const row = {
    ...listing('taluka-radius', null),
    locationVillage: { latitude: atTaluka.latitude, longitude: atTaluka.longitude },
  } as unknown as Listing;
  const response = await serviceWithRows([row], profile).findNearby(viewer.id, {
    radius: 10,
    page: 1,
    limit: 12,
  } as never);

  assert.deepEqual(response.listings.map(({ id }) => id), ['taluka-radius']);
  assert.equal(response.listings[0].distanceKm, 8);
});

test('profile point resolution falls back in village, taluka, district order', () => {
  const geography = new LocationGeographyService({} as PrismaService);
  const villagePoint = { latitude: 22.4, longitude: 72.8 };
  const talukaPoint = { latitude: 22.5, longitude: 72.9 };
  const districtPoint = { latitude: 22.6, longitude: 73.0 };
  const invalid = { latitude: 0, longitude: 0 };

  assert.deepEqual(geography.resolveUserCoordinates({
    latitude: 0,
    longitude: 0,
    village: { name: 'A', ...villagePoint },
    taluka: { name: 'T', ...talukaPoint },
    district: { name: 'D', ...districtPoint },
  }), villagePoint);
  assert.deepEqual(geography.resolveUserCoordinates({
    latitude: 0,
    longitude: 0,
    village: { name: 'A', ...invalid },
    taluka: { name: 'T', ...talukaPoint },
    district: { name: 'D', ...districtPoint },
  }), talukaPoint);
  assert.deepEqual(geography.resolveUserCoordinates({
    latitude: 0,
    longitude: 0,
    village: { name: 'A', ...invalid },
    taluka: { name: 'T', ...invalid },
    district: { name: 'D', ...districtPoint },
  }), districtPoint);
});

test('canonical listing location is left unlinked when a full path returns multiple candidates', async () => {
  const prisma = {
    village: {
      findMany: async () => [{ id: 'village-a' }, { id: 'village-b' }],
    },
  };
  const geography = new LocationGeographyService(prisma as never);

  const locationVillageId = await geography.findCanonicalVillageId({
    state: 'Gujarat',
    district: 'Anand',
    taluka: 'Petlad',
    village: 'Changa',
  });

  assert.equal(locationVillageId, null);
});
