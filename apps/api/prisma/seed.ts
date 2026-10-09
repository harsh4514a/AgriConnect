import { readFileSync } from 'node:fs';
import path from 'node:path';
import { PrismaClient, Prisma, State, District, Taluka, Village } from '@prisma/client';

type LocationRow = [stateName: string, districtName: string, talukaName: string, villageName: string];

const prisma = new PrismaClient();
const locationDataPath = path.resolve(__dirname, 'seed/gujarat-location-data.json');

const stateCache = new Map<string, State>();
const districtCache = new Map<string, District>();
const talukaCache = new Map<string, Taluka>();
const villageCache = new Map<string, Village>();

const summary = {
  statesCreated: 0,
  districtsCreated: 0,
  talukasCreated: 0,
  villagesCreated: 0,
  totalRowsProcessed: 0,
  failedRows: 0,
};

function normalizeText(value: unknown): string {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function cacheKey(...parts: string[]): string {
  return parts.map((part) => part.trim().toLowerCase()).join('::');
}

async function getOrCreateState(tx: Prisma.TransactionClient, stateName: string) {
  const key = cacheKey(stateName);
  const cached = stateCache.get(key);
  if (cached) {
    return { record: cached, created: false };
  }

  const existing = await tx.state.findFirst({
    where: { name: stateName },
  });

  if (existing) {
    stateCache.set(key, existing);
    return { record: existing, created: false };
  }

  const created = await tx.state.create({
    data: { name: stateName },
  });

  stateCache.set(key, created);
  summary.statesCreated += 1;
  return { record: created, created: true };
}

async function getOrCreateDistrict(
  tx: Prisma.TransactionClient,
  stateId: string,
  districtName: string,
) {
  const key = cacheKey(stateId, districtName);
  const cached = districtCache.get(key);
  if (cached) {
    return { record: cached, created: false };
  }

  const existing = await tx.district.findFirst({
    where: {
      stateId,
      name: districtName,
    },
  });

  if (existing) {
    districtCache.set(key, existing);
    return { record: existing, created: false };
  }

  const created = await tx.district.create({
    data: {
      stateId,
      name: districtName,
    },
  });

  districtCache.set(key, created);
  summary.districtsCreated += 1;
  return { record: created, created: true };
}

async function getOrCreateTaluka(
  tx: Prisma.TransactionClient,
  districtId: string,
  talukaName: string,
) {
  const key = cacheKey(districtId, talukaName);
  const cached = talukaCache.get(key);
  if (cached) {
    return { record: cached, created: false };
  }

  const existing = await tx.taluka.findFirst({
    where: {
      districtId,
      name: talukaName,
    },
  });

  if (existing) {
    talukaCache.set(key, existing);
    return { record: existing, created: false };
  }

  const created = await tx.taluka.create({
    data: {
      districtId,
      name: talukaName,
    },
  });

  talukaCache.set(key, created);
  summary.talukasCreated += 1;
  return { record: created, created: true };
}

async function getOrCreateVillage(
  tx: Prisma.TransactionClient,
  talukaId: string,
  villageName: string,
) {
  const key = cacheKey(talukaId, villageName);
  const cached = villageCache.get(key);
  if (cached) {
    return { record: cached, created: false };
  }

  const existing = await tx.village.findFirst({
    where: {
      talukaId,
      name: villageName,
    },
  });

  if (existing) {
    villageCache.set(key, existing);
    return { record: existing, created: false };
  }

  const created = await tx.village.create({
    data: {
      talukaId,
      name: villageName,
    },
  });

  villageCache.set(key, created);
  summary.villagesCreated += 1;
  return { record: created, created: true };
}

async function main() {
  console.log('Loading Gujarat LGD location reference data.');
  const parsedRows: unknown = JSON.parse(readFileSync(locationDataPath, 'utf8'));
  if (
    !Array.isArray(parsedRows) ||
    !parsedRows.every(
      (row): row is LocationRow =>
        Array.isArray(row) && row.length === 4 && row.every((value) => typeof value === 'string'),
    )
  ) {
    throw new Error('The location reference data has an invalid format.');
  }
  const rows = parsedRows;

  console.log(`Rows discovered: ${rows.length}`);

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    summary.totalRowsProcessed += 1;

    const [stateNameValue, districtNameValue, talukaNameValue, villageNameValue] = row;
    const stateName = normalizeText(stateNameValue);
    const districtName = normalizeText(districtNameValue);
    const talukaName = normalizeText(talukaNameValue);
    const villageName = normalizeText(villageNameValue);

    try {
      if (!stateName || !districtName || !talukaName || !villageName) {
        throw new Error('Missing one or more required location names.');
      }

      await prisma.$transaction(async (tx) => {
        const { record: state } = await getOrCreateState(tx, stateName);
        const { record: district } = await getOrCreateDistrict(tx, state.id, districtName);
        const { record: taluka } = await getOrCreateTaluka(tx, district.id, talukaName);
        await getOrCreateVillage(tx, taluka.id, villageName);
      });

      console.log(
        `[${summary.totalRowsProcessed}/${rows.length}] Imported: ${stateName} > ${districtName} > ${talukaName} > ${villageName}`,
      );
    } catch (error: unknown) {
      summary.failedRows += 1;
      const errorType = error instanceof Error ? error.name : 'UnknownError';
      console.error(`[${summary.totalRowsProcessed}/${rows.length}] Failed location entry (${errorType}).`);
    }
  }

  console.log('Seed import complete.');
  console.log(`States created: ${summary.statesCreated}`);
  console.log(`Districts created: ${summary.districtsCreated}`);
  console.log(`Talukas created: ${summary.talukasCreated}`);
  console.log(`Villages created: ${summary.villagesCreated}`);
  console.log(`Total rows processed: ${summary.totalRowsProcessed}`);
  console.log(`Failed rows: ${summary.failedRows}`);
}

main()
  .catch((error: unknown) => {
    const errorType = error instanceof Error ? error.name : 'UnknownError';
    console.error(`Location seed failed (${errorType}). Check database connectivity and workbook data.`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
