import { createReadStream } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createGunzip } from 'node:zlib';
import { createInterface } from 'node:readline';
import { Prisma, PrismaClient } from '@prisma/client';

type JsonRecord = Record<string, unknown>;
type CanonicalDistrict = { id: string; name: string; stateName: string; lgdCode: number | null; census2011Code: string | null; latitude: number | null; longitude: number | null };
type CanonicalTaluka = { id: string; name: string; districtId: string; districtName: string; stateName: string; lgdCode: number | null; census2011Code: string | null; latitude: number | null; longitude: number | null };
type CanonicalVillage = { id: string; name: string; talukaId: string; talukaName: string; districtId: string; districtName: string; stateName: string; lgdCode: number | null; census2011Code: string | null; latitude: number | null; longitude: number | null };

type CoordinateCandidate = {
  latitude: number;
  longitude: number;
  source: string;
  sourceId: string;
  referenceType: string;
};

type UpdateRow = {
  id: string;
  lgdCode: number | null;
  census2011Code: string | null;
  latitude: number | null;
  longitude: number | null;
  coordinateSource: string | null;
  coordinateSourceId: string | null;
  coordinateReferenceType: string | null;
  coordinatesImportedAt: string | null;
};

const prisma = new PrismaClient();
const sourceDirectory = path.resolve(__dirname, '../prisma/seed/geography');
const reportDirectory = path.join(sourceDirectory, 'reports');
const applyChanges = process.argv.includes('--apply');
const batchSize = 1_000;
const importedAt = new Date();

const sourceFiles = {
  lgd: path.join(sourceDirectory, 'gujarat-lgd-villages.jsonl.gz'),
  nicVillages: path.join(sourceDirectory, 'gujarat-nic-village-points.geojsonl.gz'),
  nicTowns: path.join(sourceDirectory, 'gujarat-nic-town-points.geojsonl.gz'),
  nicDistricts: path.join(sourceDirectory, 'gujarat-nic-district-hq.jsonl.gz'),
  nicTalukas: path.join(sourceDirectory, 'gujarat-nic-subdistrict-hq.jsonl.gz'),
  soiVillages: path.join(sourceDirectory, 'gujarat-soi-village-points.geojsonl.gz'),
};

function normalizeName(value: unknown): string {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('en-IN')
    .replace(/[^a-z0-9]+/g, '');
}

function key(...parts: unknown[]): string {
  return parts.map(normalizeName).join('|');
}

function text(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const result = String(value).trim();
  return result.length ? result : null;
}

function positiveCode(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function censusCode(value: unknown): string | null {
  const result = text(value);
  return result && result !== '0' ? result : null;
}

function coordinates(record: JsonRecord): { latitude: number; longitude: number } | null {
  const geometry = record.geometry as JsonRecord | undefined;
  const point = geometry?.coordinates;
  if (!Array.isArray(point) || point.length < 2) return null;
  const longitude = Number(point[0]);
  const latitude = Number(point[1]);
  if (
    !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
    latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180 ||
    (latitude === 0 && longitude === 0)
  ) return null;
  return { latitude, longitude };
}

function isValidCoordinatePair(latitude: number | null, longitude: number | null): boolean {
  return typeof latitude === 'number' && typeof longitude === 'number' &&
    Number.isFinite(latitude) && Number.isFinite(longitude) &&
    latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180 &&
    !(latitude === 0 && longitude === 0);
}

async function* readGzipJsonLines(filePath: string): AsyncGenerator<JsonRecord> {
  const input = createReadStream(filePath).pipe(createGunzip());
  const lines = createInterface({ input, crlfDelay: Infinity });
  for await (const line of lines) {
    if (!line.trim()) continue;
    yield JSON.parse(line) as JsonRecord;
  }
}

function groupByKey<T>(items: T[], getKey: (item: T) => string): Map<string, T[]> {
  const result = new Map<string, T[]>();
  for (const item of items) {
    const itemKey = getKey(item);
    const group = result.get(itemKey) ?? [];
    group.push(item);
    result.set(itemKey, group);
  }
  return result;
}

function uniqueCodeMap<T>(items: T[], getCode: (item: T) => string | null): Map<string, T> {
  const grouped = groupByKey(items.filter((item) => getCode(item) !== null), (item) => getCode(item)!);
  return new Map([...grouped.entries()].filter(([, rows]) => rows.length === 1).map(([code, rows]) => [code, rows[0]]));
}

function coordinateSourceCandidate(
  feature: JsonRecord,
  source: string,
  referenceType: string,
): CoordinateCandidate | null {
  const point = coordinates(feature);
  if (!point) return null;
  const properties = (feature.properties ?? feature) as JsonRecord;
  const id = text(properties.objectid ?? properties.objectid_12 ?? properties.orig_fid ?? feature.id);
  if (!id) return null;
  return {
    ...point,
    source,
    sourceId: id,
    referenceType,
  };
}

function toUpdateRow(
  entity: { id: string; lgdCode: number | null; census2011Code: string | null; latitude: number | null; longitude: number | null },
  candidate: CoordinateCandidate | undefined,
): UpdateRow {
  return {
    id: entity.id,
    lgdCode: entity.lgdCode,
    census2011Code: entity.census2011Code,
    latitude: candidate?.latitude ?? null,
    longitude: candidate?.longitude ?? null,
    coordinateSource: candidate?.source ?? null,
    coordinateSourceId: candidate?.sourceId ?? null,
    coordinateReferenceType: candidate?.referenceType ?? null,
    coordinatesImportedAt: candidate ? importedAt.toISOString() : null,
  };
}

async function updateTable(
  table: 'districts' | 'talukas' | 'villages',
  rows: UpdateRow[],
): Promise<void> {
  for (let offset = 0; offset < rows.length; offset += batchSize) {
    const batch = rows.slice(offset, offset + batchSize);
    const payload = JSON.stringify(batch);
    await prisma.$executeRaw(Prisma.sql`
      UPDATE ${Prisma.raw(`"${table}"`)} AS target
      SET
        "lgdCode" = COALESCE(target."lgdCode", input."lgdCode"),
        "census2011Code" = COALESCE(target."census2011Code", input."census2011Code"),
        "latitude" = CASE
          WHEN input."latitude" IS NOT NULL AND (
            target."latitude" IS NULL OR target."longitude" IS NULL OR
            target."latitude" < -90 OR target."latitude" > 90 OR
            target."longitude" < -180 OR target."longitude" > 180 OR
            (target."latitude" = 0 AND target."longitude" = 0)
          ) THEN input."latitude" ELSE target."latitude" END,
        "longitude" = CASE
          WHEN input."longitude" IS NOT NULL AND (
            target."latitude" IS NULL OR target."longitude" IS NULL OR
            target."latitude" < -90 OR target."latitude" > 90 OR
            target."longitude" < -180 OR target."longitude" > 180 OR
            (target."latitude" = 0 AND target."longitude" = 0)
          ) THEN input."longitude" ELSE target."longitude" END,
        "coordinateSource" = CASE WHEN input."latitude" IS NOT NULL AND (
            target."latitude" IS NULL OR target."longitude" IS NULL OR
            target."latitude" < -90 OR target."latitude" > 90 OR
            target."longitude" < -180 OR target."longitude" > 180 OR
            (target."latitude" = 0 AND target."longitude" = 0)
          ) THEN input."coordinateSource" ELSE target."coordinateSource" END,
        "coordinateSourceId" = CASE WHEN input."latitude" IS NOT NULL AND (
            target."latitude" IS NULL OR target."longitude" IS NULL OR
            target."latitude" < -90 OR target."latitude" > 90 OR
            target."longitude" < -180 OR target."longitude" > 180 OR
            (target."latitude" = 0 AND target."longitude" = 0)
          ) THEN input."coordinateSourceId" ELSE target."coordinateSourceId" END,
        "coordinateReferenceType" = CASE WHEN input."latitude" IS NOT NULL AND (
            target."latitude" IS NULL OR target."longitude" IS NULL OR
            target."latitude" < -90 OR target."latitude" > 90 OR
            target."longitude" < -180 OR target."longitude" > 180 OR
            (target."latitude" = 0 AND target."longitude" = 0)
          ) THEN input."coordinateReferenceType" ELSE target."coordinateReferenceType" END,
        "coordinatesImportedAt" = CASE WHEN input."latitude" IS NOT NULL AND (
            target."latitude" IS NULL OR target."longitude" IS NULL OR
            target."latitude" < -90 OR target."latitude" > 90 OR
            target."longitude" < -180 OR target."longitude" > 180 OR
            (target."latitude" = 0 AND target."longitude" = 0)
          ) THEN input."coordinatesImportedAt" ELSE target."coordinatesImportedAt" END
      FROM jsonb_to_recordset(${payload}::jsonb) AS input(
        "id" UUID,
        "lgdCode" INTEGER,
        "census2011Code" VARCHAR(20),
        "latitude" DOUBLE PRECISION,
        "longitude" DOUBLE PRECISION,
        "coordinateSource" VARCHAR(120),
        "coordinateSourceId" VARCHAR(180),
        "coordinateReferenceType" VARCHAR(40),
        "coordinatesImportedAt" TIMESTAMP(3)
      )
      WHERE target."id" = input."id"
    `);
  }
}

async function main() {
  const [districtRows, talukaRows, villageRows] = await Promise.all([
    prisma.district.findMany({
      select: {
        id: true, name: true, lgdCode: true, census2011Code: true, latitude: true, longitude: true,
        state: { select: { name: true } },
      },
    }),
    prisma.taluka.findMany({
      select: {
        id: true, name: true, districtId: true, lgdCode: true, census2011Code: true, latitude: true, longitude: true,
        district: { select: { name: true, state: { select: { name: true } } } },
      },
    }),
    prisma.village.findMany({
      select: {
        id: true, name: true, talukaId: true, lgdCode: true, census2011Code: true, latitude: true, longitude: true,
        taluka: { select: { name: true, districtId: true, district: { select: { name: true, state: { select: { name: true } } } } } },
      },
    }),
  ]);

  const districts: CanonicalDistrict[] = districtRows.map((row) => ({
    ...row,
    stateName: row.state.name,
  }));
  const talukas: CanonicalTaluka[] = talukaRows.map((row) => ({
    ...row,
    districtName: row.district.name,
    stateName: row.district.state.name,
  }));
  const villages: CanonicalVillage[] = villageRows.map((row) => ({
    ...row,
    talukaName: row.taluka.name,
    districtId: row.taluka.districtId,
    districtName: row.taluka.district.name,
    stateName: row.taluka.district.state.name,
  }));

  const districtByPath = groupByKey(districts, (row) => key(row.stateName, row.name));
  const talukaByPath = groupByKey(talukas, (row) => key(row.stateName, row.districtName, row.name));
  const villageByPath = groupByKey(villages, (row) => key(row.stateName, row.districtName, row.talukaName, row.name));
  const villagesByTalukaAndName = groupByKey(villages, (row) => key(row.talukaId, row.name));

  const lgdRows: JsonRecord[] = [];
  for await (const row of readGzipJsonLines(sourceFiles.lgd)) lgdRows.push(row);
  const nicVillageFeatures: JsonRecord[] = [];
  for await (const row of readGzipJsonLines(sourceFiles.nicVillages)) nicVillageFeatures.push(row);
  const nicTownFeatures: JsonRecord[] = [];
  for await (const row of readGzipJsonLines(sourceFiles.nicTowns)) nicTownFeatures.push(row);
  const nicDistrictFeatures: JsonRecord[] = [];
  for await (const row of readGzipJsonLines(sourceFiles.nicDistricts)) nicDistrictFeatures.push(row);
  const nicTalukaFeatures: JsonRecord[] = [];
  for await (const row of readGzipJsonLines(sourceFiles.nicTalukas)) nicTalukaFeatures.push(row);
  const soiVillageFeatures: JsonRecord[] = [];
  for await (const row of readGzipJsonLines(sourceFiles.soiVillages)) soiVillageFeatures.push(row);

  const invalidCoordinateSourceIds = {
    nicVillagePoints: nicVillageFeatures.filter((feature) => !coordinates(feature)).map((feature) => {
      const properties = (feature.properties ?? {}) as JsonRecord;
      return properties.objectid ?? feature.id ?? null;
    }),
    nicTownPoints: nicTownFeatures.filter((feature) => !coordinates(feature)).map((feature) => {
      const properties = (feature.properties ?? {}) as JsonRecord;
      return properties.objectid ?? feature.id ?? null;
    }),
    nicDistrictHeadquarters: nicDistrictFeatures.filter((feature) => !coordinates(feature)).map((feature) => {
      const properties = (feature.properties ?? {}) as JsonRecord;
      return properties.objectid ?? feature.id ?? null;
    }),
    nicTalukaHeadquarters: nicTalukaFeatures.filter((feature) => !coordinates(feature)).map((feature) => {
      const properties = (feature.properties ?? {}) as JsonRecord;
      return properties.objectid ?? feature.id ?? null;
    }),
    surveyOfIndiaVillagePoints: soiVillageFeatures.filter((feature) => !coordinates(feature)).map((feature) => {
      const properties = (feature.properties ?? {}) as JsonRecord;
      return properties.objectid_12 ?? properties.orig_fid ?? feature.id ?? null;
    }),
  };

  const lgdByPath = groupByKey(lgdRows, (row) => key(row.stateName, row.districtName, row.subdistrictName, row.villageName));
  const lgdMatchedByVillageId = new Map<string, JsonRecord>();
  const lgdMatchAmbiguities: JsonRecord[] = [];
  const canonicalWithoutLgd: CanonicalVillage[] = [];
  const matchedLgdVillageIds = new Set<string>();
  const matchedLgdRows: JsonRecord[] = [];

  for (const [pathKey, canonicalCandidates] of villageByPath.entries()) {
    const sourceCandidates = lgdByPath.get(pathKey) ?? [];
    if (sourceCandidates.length === 1 && canonicalCandidates.length === 1) {
      const canonical = canonicalCandidates[0];
      const source = sourceCandidates[0];
      lgdMatchedByVillageId.set(canonical.id, source);
      matchedLgdVillageIds.add(canonical.id);
      matchedLgdRows.push(source);
    } else if (sourceCandidates.length > 0 && canonicalCandidates.length > 0) {
      lgdMatchAmbiguities.push({
        canonicalPaths: canonicalCandidates.map(({ stateName, districtName, talukaName, name }) => [stateName, districtName, talukaName, name]),
        sourceVillageCodes: sourceCandidates.map(({ villageCode }) => villageCode),
        reason: 'normalized full hierarchy has multiple source or canonical candidates',
      });
    } else if (canonicalCandidates.length === 1) {
      canonicalWithoutLgd.push(canonicalCandidates[0]);
    }
  }

  const lgdUnmatchedSource = [...lgdByPath.entries()]
    .filter(([pathKey]) => !villageByPath.has(pathKey))
    .flatMap(([, records]) => records.map((row) => ({
      state: row.stateName,
      district: row.districtName,
      taluka: row.subdistrictName,
      village: row.villageName,
      lgdVillageCode: row.villageCode,
    })));

  const districtIdByLgdCode = new Map<string, string>();
  const talukaCodeTargets = new Map<string, Set<string>>();
  const districtLgdCandidateGroups = groupByKey(lgdRows, (row) => String(row.districtCode));
  const districtLgdAmbiguities: JsonRecord[] = [];
  for (const [code, rows] of districtLgdCandidateGroups.entries()) {
    const targetGroups = groupByKey(rows, (row) => key(row.stateName, row.districtName));
    const targetKeys = [...targetGroups.keys()];
    const candidates = targetKeys.flatMap((targetKey) => districtByPath.get(targetKey) ?? []);
    const uniqueTargets = [...new Map(candidates.map((row) => [row.id, row])).values()];
    if (rows.length && targetKeys.length === 1 && uniqueTargets.length === 1) {
      districtIdByLgdCode.set(code, uniqueTargets[0].id);
    } else if (rows.length) {
      districtLgdAmbiguities.push({ lgdDistrictCode: code, names: rows.map(({ districtName }) => districtName), reason: 'district LGD code did not resolve to one canonical district' });
    }
  }

  const talukaLgdCandidateGroups = groupByKey(lgdRows, (row) => `${row.districtCode}|${row.subdistrictCode}`);
  const talukaLgdAmbiguities: JsonRecord[] = [];
  for (const [codeKey, rows] of talukaLgdCandidateGroups.entries()) {
    const [districtCode, subdistrictCode] = codeKey.split('|');
    const districtId = districtIdByLgdCode.get(districtCode);
    const names = new Set(rows.map(({ subdistrictName }) => normalizeName(subdistrictName)));
    const candidates = districtId
      ? talukas.filter((row) => row.districtId === districtId && names.has(normalizeName(row.name)))
      : [];
    const uniqueTargets = [...new Map(candidates.map((row) => [row.id, row])).values()];
    if (rows.length && names.size === 1 && uniqueTargets.length === 1) {
      const targets = talukaCodeTargets.get(subdistrictCode) ?? new Set<string>();
      targets.add(uniqueTargets[0].id);
      talukaCodeTargets.set(subdistrictCode, targets);
    } else if (rows.length) {
      talukaLgdAmbiguities.push({ lgdDistrictCode: districtCode, lgdSubdistrictCode: subdistrictCode, names: [...new Set(rows.map(({ subdistrictName }) => String(subdistrictName)))], reason: 'subdistrict LGD code did not resolve to one canonical taluka' });
    }
  }
  const talukaIdByLgdCode = new Map([...talukaCodeTargets.entries()]
    .filter(([, targetIds]) => targetIds.size === 1)
    .map(([code, targetIds]) => [code, [...targetIds][0]]));
  for (const [code, targetIds] of talukaCodeTargets.entries()) {
    if (targetIds.size > 1) {
      talukaLgdAmbiguities.push({ lgdSubdistrictCode: code, canonicalTalukaIds: [...targetIds], reason: 'subdistrict LGD code is reused across canonical talukas' });
    }
  }

  const villageLgdCodeGroups = groupByKey(matchedLgdRows, (row) => String(row.villageCode));
  const villageLgdCodeById = new Map<string, number>();
  const censusByVillageId = new Map<string, string>();
  const canonicalByCensusCode = new Map<string, CanonicalVillage>();
  const ambiguousCensusCodes: JsonRecord[] = [];
  for (const [villageCode, sourceRows] of villageLgdCodeGroups.entries()) {
    const canonicalTargets = sourceRows.flatMap((source) => {
      const sourceKey = key(source.stateName, source.districtName, source.subdistrictName, source.villageName);
      return villageByPath.get(sourceKey) ?? [];
    });
    const uniqueTargets = [...new Map(canonicalTargets.map((row) => [row.id, row])).values()];
    if (sourceRows.length === 1 && uniqueTargets.length === 1) {
      const numericCode = positiveCode(villageCode);
      if (numericCode) villageLgdCodeById.set(uniqueTargets[0].id, numericCode);
      const code = censusCode(sourceRows[0].census2011Code);
      if (code) {
        censusByVillageId.set(uniqueTargets[0].id, code);
        const prior = canonicalByCensusCode.get(code);
        if (prior) {
          canonicalByCensusCode.delete(code);
          ambiguousCensusCodes.push({ census2011Code: code, villageIds: [prior.id, uniqueTargets[0].id], reason: 'Census 2011 code is repeated in the LGD roster' });
        } else if (!ambiguousCensusCodes.some((row) => row.census2011Code === code)) {
          canonicalByCensusCode.set(code, uniqueTargets[0]);
        }
      }
    }
  }

  const districtLgdCodeById = new Map<string, number>();
  for (const [code, id] of districtIdByLgdCode) {
    const numeric = positiveCode(code);
    if (numeric) districtLgdCodeById.set(id, numeric);
  }
  const talukaLgdCodeById = new Map<string, number>();
  for (const [code, id] of talukaIdByLgdCode) {
    const numeric = positiveCode(code);
    if (numeric) talukaLgdCodeById.set(id, numeric);
  }

  const sourceVillagePointsByCensus = groupByKey(
    nicVillageFeatures,
    (feature) => String((feature.properties as JsonRecord | undefined)?.vilcode11 ?? ''),
  );
  const villageCoordinateById = new Map<string, CoordinateCandidate>();
  const noNicPointForCensusCode: JsonRecord[] = [];
  const duplicateNicCensusPointCodes: JsonRecord[] = [];
  const nicParentCodeMismatchDetails: JsonRecord[] = [];
  for (const [code, canonical] of canonicalByCensusCode.entries()) {
    const sourceRows = sourceVillagePointsByCensus.get(code) ?? [];
    if (sourceRows.length !== 1) {
      if (sourceRows.length > 1) duplicateNicCensusPointCodes.push({ census2011Code: code, featureCount: sourceRows.length });
      else noNicPointForCensusCode.push({ path: [canonical.stateName, canonical.districtName, canonical.talukaName, canonical.name], census2011Code: code });
      continue;
    }
    const feature = sourceRows[0];
    const properties = (feature.properties ?? {}) as JsonRecord;
    const candidate = coordinateSourceCandidate(feature, 'NIC Bharat Maps Village Location (2011)', 'village_point_census_2011');
    if (!candidate) continue;
    const sourceDistrictCode = String(properties.dt_lgd ?? '');
    const sourceTalukaCode = String(properties.sdt_lgd ?? '');
    const matchedDistrictCode = districtLgdCodeById.get(canonical.districtId);
    const matchedTalukaCode = talukaLgdCodeById.get(canonical.talukaId);
    if (
      (matchedDistrictCode && sourceDistrictCode && String(matchedDistrictCode) !== sourceDistrictCode) ||
      (matchedTalukaCode && sourceTalukaCode && String(matchedTalukaCode) !== sourceTalukaCode)
    ) {
      nicParentCodeMismatchDetails.push({
        path: [canonical.stateName, canonical.districtName, canonical.talukaName, canonical.name],
        census2011Code: code,
        lgdDistrictCode: matchedDistrictCode ?? null,
        nic2011DistrictCode: sourceDistrictCode || null,
        lgdSubdistrictCode: matchedTalukaCode ?? null,
        nic2011SubdistrictCode: sourceTalukaCode || null,
        reason: 'unique Census village identity matched, but current LGD parent code differs from the 2011 point layer parent code',
      });
    }
    villageCoordinateById.set(canonical.id, {
      ...candidate,
      sourceId: `village-location:${properties.objectid ?? feature.id}:census-${code}`,
    });
  }

  const urbanVillageIds = new Set([...lgdMatchedByVillageId.entries()]
    .filter(([, row]) => normalizeName(row.villageCategory) === 'urban')
    .map(([id]) => id));
  const townSourceByPath = groupByKey(nicTownFeatures, (feature) => {
    const properties = (feature.properties ?? {}) as JsonRecord;
    return key('Gujarat', properties.dtname, properties.subdtname, properties.sh_name);
  });
  let townCentresImported = 0;
  const ambiguousTownCentres: JsonRecord[] = [];
  for (const [townPath, features] of townSourceByPath.entries()) {
    const candidates = villageByPath.get(townPath) ?? [];
    if (features.length !== 1 || candidates.length !== 1 || !urbanVillageIds.has(candidates[0].id)) {
      if (features.length > 0 && candidates.length > 0) ambiguousTownCentres.push({ path: townPath, sourceCount: features.length, canonicalIds: candidates.map(({ id }) => id) });
      continue;
    }
    const candidate = coordinateSourceCandidate(features[0], 'NIC Bharat Maps Town Location (2022)', 'town_centre');
    if (!candidate) continue;
    villageCoordinateById.set(candidates[0].id, candidate);
    townCentresImported += 1;
  }

  const soiFeaturesByParentAndName = groupByKey(soiVillageFeatures, (feature) => {
    const properties = (feature.properties ?? {}) as JsonRecord;
    return `${String(properties.lgd_district_code ?? '')}|${String(properties.lgd_sub_dist_code ?? '')}|${normalizeName(properties.vill_name_c ?? properties.vill_name)}`;
  });
  const villageIdsByTalukaAndName = new Map<string, CanonicalVillage[]>();
  for (const village of villages) {
    const villageKey = key(village.talukaId, village.name);
    const list = villageIdsByTalukaAndName.get(villageKey) ?? [];
    list.push(village);
    villageIdsByTalukaAndName.set(villageKey, list);
  }
  const soiAmbiguousMatches: JsonRecord[] = [];
  let soiVillageFallbackMatches = 0;
  for (const [sourceKey, features] of soiFeaturesByParentAndName.entries()) {
    if (features.length !== 1) continue;
    const [districtCode, talukaCode, villageName] = sourceKey.split('|');
    const talukaId = talukaIdByLgdCode.get(talukaCode);
    const taluka = talukas.find((row) => row.id === talukaId);
    if (!taluka || String(districtLgdCodeById.get(taluka.districtId) ?? '') !== districtCode) continue;
    const candidates = villageIdsByTalukaAndName.get(key(talukaId, villageName)) ?? [];
    if (candidates.length !== 1) {
      if (candidates.length > 1) soiAmbiguousMatches.push({ districtLgdCode: districtCode, subdistrictLgdCode: talukaCode, villageName, candidateIds: candidates.map(({ id }) => id) });
      continue;
    }
    const canonical = candidates[0];
    if (villageCoordinateById.has(canonical.id)) continue;
    const feature = features[0];
    const properties = (feature.properties ?? {}) as JsonRecord;
    const candidate = coordinateSourceCandidate(feature, 'Survey of India Gujarat Village Point Layer (2017)', 'settlement_point_soi');
    if (!candidate) continue;
    candidate.sourceId = `soi:${properties.objectid_12 ?? properties.orig_fid ?? feature.id}`;
    villageCoordinateById.set(canonical.id, candidate);
    soiVillageFallbackMatches += 1;
  }

  // Older SOI points can carry an LGD code from the 2011 administrative
  // hierarchy. If that code no longer matches current LGD after a district or
  // taluka reorganization, a unique full district/taluka/village path remains
  // a safe secondary crosswalk. This is never a village-name-only join.
  const soiFeaturesByFullPath = groupByKey(soiVillageFeatures, (feature) => {
    const properties = (feature.properties ?? {}) as JsonRecord;
    return key('Gujarat', properties.district, properties.subdivision, properties.vill_name_c ?? properties.vill_name);
  });
  const soiFullPathAmbiguities: JsonRecord[] = [];
  const soiFullPathParentCodeMismatches: JsonRecord[] = [];
  let soiFullHierarchyFallbackMatches = 0;
  for (const [fullPath, features] of soiFeaturesByFullPath.entries()) {
    if (features.length !== 1) continue;
    const canonicalRows = villageByPath.get(fullPath) ?? [];
    if (canonicalRows.length !== 1) {
      if (canonicalRows.length > 1) soiFullPathAmbiguities.push({
        fullPath,
        sourceFeatureId: (features[0].properties as JsonRecord | undefined)?.objectid_12 ?? features[0].id,
        candidateVillageIds: canonicalRows.map(({ id }) => id),
      });
      continue;
    }
    const canonical = canonicalRows[0];
    if (villageCoordinateById.has(canonical.id)) continue;
    const feature = features[0];
    const properties = (feature.properties ?? {}) as JsonRecord;
    const candidate = coordinateSourceCandidate(feature, 'Survey of India Gujarat Village Point Layer (2017)', 'settlement_point_soi');
    if (!candidate) continue;
    candidate.sourceId = `soi:${properties.objectid_12 ?? properties.orig_fid ?? feature.id}`;
    villageCoordinateById.set(canonical.id, candidate);
    soiFullHierarchyFallbackMatches += 1;

    const sourceDistrictCode = String(properties.lgd_district_code ?? '');
    const sourceTalukaCode = String(properties.lgd_sub_dist_code ?? '');
    const currentDistrictCode = districtLgdCodeById.get(canonical.districtId);
    const currentTalukaCode = talukaLgdCodeById.get(canonical.talukaId);
    if (
      (currentDistrictCode && sourceDistrictCode && String(currentDistrictCode) !== sourceDistrictCode) ||
      (currentTalukaCode && sourceTalukaCode && String(currentTalukaCode) !== sourceTalukaCode)
    ) {
      soiFullPathParentCodeMismatches.push({
        path: [canonical.stateName, canonical.districtName, canonical.talukaName, canonical.name],
        sourceLgdDistrictCode: sourceDistrictCode || null,
        currentLgdDistrictCode: currentDistrictCode ?? null,
        sourceLgdSubdistrictCode: sourceTalukaCode || null,
        currentLgdSubdistrictCode: currentTalukaCode ?? null,
        reason: 'unique full hierarchy path matched after administrative LGD code changes',
      });
    }
  }

  const uniqueDistrictCodeMatches = new Map<string, JsonRecord[]>();
  for (const feature of nicDistrictFeatures) {
    const properties = (feature.properties ?? {}) as JsonRecord;
    const code = String(properties.dist_lgd ?? '');
    const rows = uniqueDistrictCodeMatches.get(code) ?? [];
    rows.push(feature);
    uniqueDistrictCodeMatches.set(code, rows);
  }
  const districtCoordinateById = new Map<string, CoordinateCandidate>();
  const districtCensusById = new Map<string, string>();
  const ambiguousDistrictHq: JsonRecord[] = [];
  for (const [code, features] of uniqueDistrictCodeMatches.entries()) {
    const districtId = districtIdByLgdCode.get(code);
    if (!districtId || features.length !== 1) {
      if (features.length > 0) ambiguousDistrictHq.push({ lgdDistrictCode: code, featureCount: features.length });
      continue;
    }
    const candidate = coordinateSourceCandidate(features[0], 'NIC Bharat Maps District Headquarters (2017)', 'district_headquarters');
    if (candidate) districtCoordinateById.set(districtId, candidate);
    const properties = (features[0].properties ?? {}) as JsonRecord;
    const code11 = censusCode(properties.dtcode11);
    if (code11) districtCensusById.set(districtId, code11);
  }

  const uniqueTalukaCodeMatches = new Map<string, JsonRecord[]>();
  const talukaCensusById = new Map<string, string>();
  for (const feature of nicTalukaFeatures) {
    const properties = (feature.properties ?? {}) as JsonRecord;
    const code = String(properties.subdt_lgd ?? '');
    const rows = uniqueTalukaCodeMatches.get(code) ?? [];
    rows.push(feature);
    uniqueTalukaCodeMatches.set(code, rows);
  }
  const talukaCoordinateById = new Map<string, CoordinateCandidate>();
  const ambiguousTalukaHq: JsonRecord[] = [];
  for (const [code, features] of uniqueTalukaCodeMatches.entries()) {
    const talukaId = talukaIdByLgdCode.get(code);
    if (!talukaId || features.length !== 1) {
      if (features.length > 0) ambiguousTalukaHq.push({ lgdSubdistrictCode: code, featureCount: features.length });
      continue;
    }
    const candidate = coordinateSourceCandidate(features[0], 'NIC Bharat Maps SubDistrict Headquarters (2022)', 'taluka_headquarters');
    if (candidate) talukaCoordinateById.set(talukaId, candidate);
    const properties = (features[0].properties ?? {}) as JsonRecord;
    const code11 = censusCode(properties.sdtcode11);
    if (code11) talukaCensusById.set(talukaId, code11);
  }

  const districtSourceIdGroups = groupByKey(lgdRows, (row) => String(row.districtCode));
  const districtLgdById = new Map<string, number>();
  for (const [code, rows] of districtSourceIdGroups.entries()) {
    const districtId = districtIdByLgdCode.get(code);
    const numeric = positiveCode(code);
    if (districtId && numeric) districtLgdById.set(districtId, numeric);
  }
  const talukaLgdById = new Map<string, number>();
  for (const [code, id] of talukaIdByLgdCode.entries()) {
    const numeric = positiveCode(code);
    if (numeric) talukaLgdById.set(id, numeric);
  }

  const districtUpdateRows = districts.map((row) => toUpdateRow(
    row,
    districtCoordinateById.get(row.id),
  ));
  for (const row of districtUpdateRows) {
    row.lgdCode = districtLgdById.get(row.id) ?? row.lgdCode;
    row.census2011Code = districtCensusById.get(row.id) ?? row.census2011Code;
  }
  const talukaUpdateRows = talukas.map((row) => toUpdateRow(row, talukaCoordinateById.get(row.id)));
  for (const row of talukaUpdateRows) {
    row.lgdCode = talukaLgdById.get(row.id) ?? row.lgdCode;
    row.census2011Code = talukaCensusById.get(row.id) ?? row.census2011Code;
  }
  const villageUpdateRows = villages.map((row) => toUpdateRow(row, villageCoordinateById.get(row.id)));
  for (const row of villageUpdateRows) {
    row.lgdCode = villageLgdCodeById.get(row.id) ?? row.lgdCode;
    row.census2011Code = censusByVillageId.get(row.id) ?? row.census2011Code;
  }

  const preexistingValid = {
    districts: districts.filter((row) => isValidCoordinatePair(row.latitude, row.longitude)).length,
    talukas: talukas.filter((row) => isValidCoordinatePair(row.latitude, row.longitude)).length,
    villages: villages.filter((row) => isValidCoordinatePair(row.latitude, row.longitude)).length,
  };
  const districtById = new Map(districts.map((row) => [row.id, row]));
  const talukaById = new Map(talukas.map((row) => [row.id, row]));
  const villageById = new Map(villages.map((row) => [row.id, row]));
  const wouldUpdateCoordinates = {
    districts: districtUpdateRows.filter((row) => {
      const existing = districtById.get(row.id)!;
      return row.latitude !== null && !isValidCoordinatePair(existing.latitude, existing.longitude);
    }).length,
    talukas: talukaUpdateRows.filter((row) => {
      const existing = talukaById.get(row.id)!;
      return row.latitude !== null && !isValidCoordinatePair(existing.latitude, existing.longitude);
    }).length,
    villages: villageUpdateRows.filter((row) => {
      const existing = villageById.get(row.id)!;
      return row.latitude !== null && !isValidCoordinatePair(existing.latitude, existing.longitude);
    }).length,
  };

  const identifierMatches = {
      districts: districtLgdById.size,
      talukas: talukaLgdById.size,
      villages: villageLgdCodeById.size,
  };
  const unresolvedDistricts = districts.filter((row) => !districtLgdById.has(row.id)).map((row) => [row.stateName, row.name]);
  const unresolvedTalukas = talukas.filter((row) => !talukaLgdById.has(row.id)).map((row) => [row.stateName, row.districtName, row.name]);
  const unresolvedVillages = villages.filter((row) => !villageCoordinateById.has(row.id)).map((row) => ({
    path: [row.stateName, row.districtName, row.talukaName, row.name],
    lgdVillageMatch: matchedLgdVillageIds.has(row.id),
    census2011Code: censusByVillageId.get(row.id) ?? null,
  }));
  const unresolvedDistrictCoordinates = districts.filter((row) => !districtCoordinateById.has(row.id)).map((row) => [row.stateName, row.name]);
  const unresolvedTalukaCoordinates = talukas.filter((row) => !talukaCoordinateById.has(row.id)).map((row) => [row.stateName, row.districtName, row.name]);
  const urbanLgdRows = matchedLgdRows.filter((row) => normalizeName(row.villageCategory) === 'urban').length;
  const ruralLgdRows = matchedLgdRows.filter((row) => normalizeName(row.villageCategory) === 'rural').length;

  if (applyChanges) {
    await updateTable('districts', districtUpdateRows);
    await updateTable('talukas', talukaUpdateRows);
    await updateTable('villages', villageUpdateRows);
  }

  const [districtsAfter, talukasAfter, villagesAfter] = await Promise.all([
    prisma.district.findMany({ select: { id: true, latitude: true, longitude: true, coordinateSource: true, coordinateSourceId: true, coordinateReferenceType: true, coordinatesImportedAt: true } }),
    prisma.taluka.findMany({ select: { id: true, latitude: true, longitude: true, coordinateSource: true, coordinateSourceId: true, coordinateReferenceType: true, coordinatesImportedAt: true } }),
    prisma.village.findMany({ select: { id: true, latitude: true, longitude: true, coordinateSource: true, coordinateSourceId: true, coordinateReferenceType: true, coordinatesImportedAt: true } }),
  ]);
  const coordinatesPresentAfterRun = {
    districts: districtsAfter.filter((row) => isValidCoordinatePair(row.latitude, row.longitude)).length,
    talukas: talukasAfter.filter((row) => isValidCoordinatePair(row.latitude, row.longitude)).length,
    villages: villagesAfter.filter((row) => isValidCoordinatePair(row.latitude, row.longitude)).length,
  };
  const allLocationsAfter = [...districtsAfter, ...talukasAfter, ...villagesAfter];
  const storedCoordinatesByReferenceType = allLocationsAfter.reduce<Record<string, number>>((counts, row) => {
    if (isValidCoordinatePair(row.latitude, row.longitude) && row.coordinateReferenceType) {
      counts[row.coordinateReferenceType] = (counts[row.coordinateReferenceType] ?? 0) + 1;
    }
    return counts;
  }, {});
  const zeroZeroCoordinateSentinels = allLocationsAfter.filter(
    (row) => row.latitude === 0 && row.longitude === 0,
  ).length;
  const validCoordinatesMissingMetadata = allLocationsAfter
    .filter((row) => isValidCoordinatePair(row.latitude, row.longitude) && (
      !row.coordinateSource || !row.coordinateSourceId || !row.coordinateReferenceType || !row.coordinatesImportedAt
    ))
    .map(({ id, coordinateSource, coordinateSourceId, coordinateReferenceType, coordinatesImportedAt }) => ({
      id,
      coordinateSource,
      coordinateSourceId,
      coordinateReferenceType,
      coordinatesImportedAt,
    }));
  const [linkedListingCount, unlinkedListingCount] = await Promise.all([
    prisma.listing.count({ where: { locationVillageId: { not: null } } }),
    prisma.listing.count({ where: { locationVillageId: null } }),
  ]);

  const report = {
    generatedAt: importedAt.toISOString(),
    mode: applyChanges ? 'apply' : 'dry-run',
    matchingMethod: 'normalized complete state/district/taluka/village hierarchy; official LGD and Census codes where present; no name-only fuzzy matching',
    sourceData: {
      localGovernmentDirectory: {
        file: path.basename(sourceFiles.lgd),
        source: 'LGD directory download, preserved by vanga/india-local-government-directory',
        sourceSnapshotDate: '2026-05-25',
        license: 'Government Open Data License - India (GODL-India), with required source attribution',
        rows: lgdRows.length,
        urbanRows: lgdRows.filter((row) => normalizeName(row.villageCategory) === 'urban').length,
        ruralRows: lgdRows.filter((row) => normalizeName(row.villageCategory) === 'rural').length,
        sourceIds: ['stateCode', 'districtCode', 'subdistrictCode', 'villageCode', 'census2011Code'],
      },
      nicBharatMaps: {
        service: 'AdministrativeHeadQuarter MapServer, National Informatics Centre / Bharat Maps',
        licenseStatus: 'No layer-specific license field is published by the REST service; public citizen-facing source; retain NIC attribution/logo and confirm reuse terms before distributing a production database snapshot',
        villageLayerUpdated: 2011,
        townLayerUpdated: 2022,
        districtHeadquartersLayerUpdated: 2017,
        subdistrictHeadquartersLayerUpdated: 2022,
        villagePoints: nicVillageFeatures.length,
        townPoints: nicTownFeatures.length,
        districtHeadquarters: nicDistrictFeatures.length,
        subdistrictHeadquarters: nicTalukaFeatures.length,
        coordinateReferenceSystem: 'WGS 84 longitude/latitude',
        reportedMapScale: '1:50,000; this is source map scale, not a guarantee of point accuracy',
      },
      surveyOfIndia: {
        file: path.basename(sourceFiles.soiVillages),
        layerSnapshot: '2017 source layer',
        license: 'CC0 1.0 as declared by the source repository release',
        features: soiVillageFeatures.length,
        coordinateReferenceSystem: 'WGS 84 longitude/latitude',
        role: 'fallback village settlement points matched by current LGD parent codes, then by a unique complete district/taluka/village path when historic parent codes changed',
      },
    },
    existingCanonicalInventory: {
      states: new Set(districts.map(({ stateName }) => stateName)).size,
      districts: districts.length,
      talukas: talukas.length,
      villagesAndLocalities: villages.length,
      matchedLgdUrbanLocalities: urbanLgdRows,
      matchedLgdRuralVillages: ruralLgdRows,
      canonicalLocalitiesClassifiedUrban: urbanVillageIds.size,
    },
    sourceMatches: {
      uniqueLgdVillageRecordsMatched: matchedLgdVillageIds.size,
      canonicalVillageRecordsWithoutLgdMatch: canonicalWithoutLgd.length,
      unmatchedLgdSourceRows: lgdUnmatchedSource.length,
      ambiguousLgdVillageMatches: lgdMatchAmbiguities.length,
      districtIdentifiersMatched: identifierMatches.districts,
      talukaIdentifiersMatched: identifierMatches.talukas,
      villageIdentifiersMatched: identifierMatches.villages,
      censusCodeMatchedVillagePoints: [...canonicalByCensusCode.values()].filter(({ id }) => villageCoordinateById.has(id)).length,
      townCentrePointsMatched: townCentresImported,
      soiVillageFallbackPointsMatched: soiVillageFallbackMatches,
      soiFullHierarchyFallbackPointsMatched: soiFullHierarchyFallbackMatches,
      districtHeadquartersMatched: districtCoordinateById.size,
      talukaHeadquartersMatched: talukaCoordinateById.size,
      nicVillagePointParentCodeMismatches: nicParentCodeMismatchDetails.length,
      listingRowsLinkedToCanonicalVillage: linkedListingCount,
      listingRowsWithoutUniqueCanonicalVillage: unlinkedListingCount,
    },
    coordinateCoverage: {
      validCoordinatesBeforeImport: preexistingValid,
      matchedCoordinatesEligibleToImport: {
        districts: districtCoordinateById.size,
        talukas: talukaCoordinateById.size,
        villages: villageCoordinateById.size,
      },
      coordinatesToUpdateWithoutOverwritingExistingValidValues: wouldUpdateCoordinates,
      validCoordinatesPresentAfterRun: coordinatesPresentAfterRun,
      storedCoordinatesByReferenceType,
      zeroZeroCoordinateSentinels,
      validCoordinatesMissingMetadata,
    },
    ambiguities: {
      lgdVillage: lgdMatchAmbiguities,
      districtLgdCode: districtLgdAmbiguities,
      talukaLgdCode: talukaLgdAmbiguities,
      census2011Code: ambiguousCensusCodes,
      nicVillagePointCode: duplicateNicCensusPointCodes,
      townCentre: ambiguousTownCentres,
      surveyOfIndiaVillagePath: soiAmbiguousMatches,
      surveyOfIndiaFullPath: soiFullPathAmbiguities,
      surveyOfIndiaParentCodeMismatchDetails: soiFullPathParentCodeMismatches,
      districtHeadquarters: ambiguousDistrictHq,
      talukaHeadquarters: ambiguousTalukaHq,
      nicVillagePointParentCodeMismatchDetails: nicParentCodeMismatchDetails,
    },
    invalidSourceRecords: {
      invalidCoordinateSourceIds,
      invalidCoordinateCounts: Object.fromEntries(Object.entries(invalidCoordinateSourceIds).map(([name, ids]) => [name, ids.length])),
    },
    unresolved: {
      districtsWithoutLgdCode: unresolvedDistricts,
      talukasWithoutLgdCode: unresolvedTalukas,
      districtsWithoutCoordinateSource: unresolvedDistrictCoordinates,
      talukasWithoutCoordinateSource: unresolvedTalukaCoordinates,
      canonicalVillagesWithoutLgdMatch: canonicalWithoutLgd.map(({ stateName, districtName, talukaName, name }) => [stateName, districtName, talukaName, name]),
      sourceLgdRowsWithoutCanonicalMatch: lgdUnmatchedSource,
      villagesWithoutCoordinateMatch: unresolvedVillages,
      villageCensusCodesWithoutNicPoint: noNicPointForCensusCode,
    },
    notes: [
      'Village points, town centres, taluka headquarters, and district headquarters have different meanings and are labeled separately.',
      'NIC Village Location points use Census 2011 village codes when the LGD crosswalk supplies one; 0/missing Census codes are not guessed.',
      'Survey of India fallback points are not represented as exact Census village points.',
      'No point is written when coordinates are missing, invalid, ambiguous, or matched only by a village name without its hierarchy.',
      'Existing valid coordinates are preserved; identifiers only fill null identifier fields.',
    ],
  };

  await mkdir(reportDirectory, { recursive: true });
  const reportPath = path.join(reportDirectory, 'latest-import-report.json');
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({
    mode: report.mode,
    inventory: report.existingCanonicalInventory,
    sourceMatches: report.sourceMatches,
    coordinateCoverage: report.coordinateCoverage,
    unresolved: {
      districtsWithoutCoordinates: unresolvedDistrictCoordinates.length,
      talukasWithoutCoordinates: unresolvedTalukaCoordinates.length,
      villagesWithoutCoordinates: unresolvedVillages.length,
      sourceRowsWithoutCanonicalVillage: lgdUnmatchedSource.length,
      ambiguousVillagePaths: lgdMatchAmbiguities.length,
    },
    reportPath,
  }, null, 2));
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
