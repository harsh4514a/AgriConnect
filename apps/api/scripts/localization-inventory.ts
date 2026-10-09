import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';

type Locale = 'en' | 'gu' | 'hi';
type Domain =
  | 'state'
  | 'district'
  | 'taluka'
  | 'village'
  | 'region'
  | 'market'
  | 'crop'
  | 'commodity'
  | 'variety'
  | 'marketVariety'
  | 'grade'
  | 'vehicleType'
  | 'unit';

type CatalogEntry = { en?: string; gu?: string; hi?: string };
type Catalog = Record<string, Record<string, CatalogEntry> | Record<string, string>>;
type InventoryEntry = {
  category: string;
  canonicalId: string;
  sourceValue: string;
  english: string;
  gujarati: string | null;
  hindi: string | null;
  localeCoverage: Record<Locale, 'present' | 'missing' | 'not-applicable'>;
  translationStatus: 'catalog-complete' | 'source-retained-untranslated' | 'missing-gujarati' | 'missing-hindi' | 'requires-ui-or-content-audit';
  reviewStatus: 'needs-human-review';
  sources: string[];
  parentCanonicalId?: string;
  catalogKey?: string;
  notes: string[];
};

const locales: Locale[] = ['en', 'gu', 'hi'];
const domainData = require('../../../packages/domain-data/domain-localization.json') as Catalog;
const { getLocalizedDomainName } = require('@agri/domain-data') as {
  getLocalizedDomainName(value: string, locale: string, domain: Domain): string;
};

const catalogDomains: Record<string, { domain: Domain; catalogKey: string; aliasKey?: string }> = {
  state: { domain: 'state', catalogKey: 'states' },
  district: { domain: 'district', catalogKey: 'districts', aliasKey: 'districtAliases' },
  taluka: { domain: 'taluka', catalogKey: 'talukas', aliasKey: 'talukaAliases' },
  village: { domain: 'village', catalogKey: 'villages', aliasKey: 'villageAliases' },
  region: { domain: 'region', catalogKey: 'regions' },
  market: { domain: 'market', catalogKey: 'markets', aliasKey: 'marketAliases' },
  commodity: { domain: 'commodity', catalogKey: 'crops', aliasKey: 'cropAliases' },
  cropKey: { domain: 'crop', catalogKey: 'crops', aliasKey: 'cropAliases' },
  variety: { domain: 'marketVariety', catalogKey: 'varieties', aliasKey: 'varietyAliases' },
  grade: { domain: 'grade', catalogKey: 'grades' },
  vehicleType: { domain: 'vehicleType', catalogKey: 'vehicleTypes' },
  unit: { domain: 'unit', catalogKey: 'units' },
  schemeState: { domain: 'state', catalogKey: 'states' },
};

function normalize(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('en')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function safeReadLocalEnv(): void {
  if (process.env.DATABASE_URL) return;

  const envPath = resolve(__dirname, '../.env');
  if (!existsSync(envPath)) return;

  const line = readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .find((candidate) => /^\s*DATABASE_URL\s*=/.test(candidate));
  if (!line) return;

  let value = line.slice(line.indexOf('=') + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  } else {
    value = value.replace(/\s+#.*$/, '').trim();
  }
  if (value) process.env.DATABASE_URL = value;
}

function assertLocalDevelopmentDatabase(): string {
  safeReadLocalEnv();
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    throw new Error('DATABASE_URL is not set and apps/api/.env has no DATABASE_URL.');
  }

  let databaseUrl: URL;
  try {
    databaseUrl = new URL(rawUrl);
  } catch {
    throw new Error('DATABASE_URL is malformed; its value has been suppressed.');
  }

  const host = databaseUrl.hostname.toLowerCase();
  const loopback = host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]';
  const databaseName = decodeURIComponent(databaseUrl.pathname.replace(/^\//, '')).toLowerCase();
  if (!loopback || /(^|[-_])(prod|production|live)([-_]|$)/.test(databaseName)) {
    throw new Error(
      'Refusing to inspect a non-local or production-named database. Use a local development database or a verified read-only local tunnel.',
    );
  }
  if (!databaseUrl.searchParams.has('connect_timeout')) databaseUrl.searchParams.set('connect_timeout', '5');
  return databaseUrl.toString();
}

function findCatalogMatch(category: string, sourceValue: string): { key: string; names: CatalogEntry } | undefined {
  const config = catalogDomains[category];
  if (!config) return undefined;

  const map = domainData[config.catalogKey] as Record<string, CatalogEntry> | undefined;
  if (!map) return undefined;

  const candidateValues = new Set([normalize(sourceValue)]);
  if (category === 'market' || category === 'taluka' || category === 'village') {
    candidateValues.add(
      normalize(sourceValue)
        .replace(/^the agricultural produce market committee\s*/, '')
        .replace(/^agricultural produce market committee\s*/, '')
        .replace(/\b(apmc|market yard|market committee)\b/g, '')
        .trim(),
    );
  }

  const aliasMap = config.aliasKey
    ? (domainData[config.aliasKey] as Record<string, string> | undefined)
    : undefined;
  for (const candidate of [...candidateValues]) {
    const alias = aliasMap
      ? Object.entries(aliasMap).find(([key]) => normalize(key) === candidate)?.[1]
      : undefined;
    if (alias) candidateValues.add(normalize(alias));
  }

  // Taluka/village records have historically shared market-name aliases.
  if ((category === 'taluka' || category === 'village') && domainData.markets) {
    const marketMap = domainData.markets as Record<string, CatalogEntry>;
    for (const [key, names] of Object.entries(marketMap)) {
      if ([key, names.en, names.gu, names.hi].some((value) => value && candidateValues.has(normalize(value)))) {
        return { key, names };
      }
    }
  }

  for (const [key, names] of Object.entries(map)) {
    if ([key, names.en, names.gu, names.hi].some((value) => value && candidateValues.has(normalize(value)))) {
      return { key, names };
    }
  }
  return undefined;
}

const entries = new Map<string, InventoryEntry>();

function addValue(
  category: string,
  value: unknown,
  source: string,
  options: { canonicalId?: string; parentCanonicalId?: string; note?: string } = {},
): void {
  if (typeof value !== 'string' || !value.trim()) return;
  const sourceValue = value.trim();
  const locationCategories = new Set(['state', 'district', 'taluka', 'village']);
  const matchingLocationEntries = !options.canonicalId && locationCategories.has(category)
    ? [...entries.values()].filter((entry) => entry.category === category && entry.sourceValue === sourceValue)
    : [];
  const canonicalId = options.canonicalId ??
    (matchingLocationEntries.length === 1
      ? matchingLocationEntries[0].canonicalId
      : `candidate:${category}:${createHash('sha256').update(sourceValue, 'utf8').digest('hex').slice(0, 16)}`);
  const key = `${category}\u0000${canonicalId}\u0000${sourceValue}`;
  const existing = entries.get(key);
  if (existing) {
    if (!existing.sources.includes(source)) existing.sources.push(source);
    return;
  }

  const config = catalogDomains[category];
  const match = findCatalogMatch(category, sourceValue);
  const notes: string[] = [];
  if (options.note) notes.push(options.note);
  if (match) notes.push('A catalog entry exists; a fluent speaker should review the Gujarati and Hindi forms.');
  else if (config) notes.push('No reviewed catalog entry matched this database value.');
  else notes.push('No domain catalog is configured; verify its next-intl message or database-content locale coverage.');

  const localized = (locale: Locale): string | null => {
    if (!config) return null;
    return getLocalizedDomainName(sourceValue, locale, config.domain) || null;
  };
  const gujarati = localized('gu');
  const hindi = localized('hi');
  const hasGujarati = Boolean(match?.names.gu || (gujarati && gujarati !== sourceValue));
  const hasHindi = Boolean(match?.names.hi || (hindi && hindi !== sourceValue));
  const localeCoverage: InventoryEntry['localeCoverage'] = config
    ? {
        // The English source spelling is the catalog key; most catalog rows
        // intentionally store only Gujarati and Hindi values.
        en: match ? 'present' : 'missing',
        gu: hasGujarati ? 'present' : 'missing',
        hi: hasHindi ? 'present' : 'missing',
      }
    : { en: 'not-applicable', gu: 'not-applicable', hi: 'not-applicable' };
  const translationStatus: InventoryEntry['translationStatus'] = !config
    ? 'requires-ui-or-content-audit'
    : localeCoverage.gu === 'missing' && localeCoverage.hi === 'missing'
      ? 'source-retained-untranslated'
      : localeCoverage.gu === 'missing'
        ? 'missing-gujarati'
        : localeCoverage.hi === 'missing'
          ? 'missing-hindi'
          : 'catalog-complete';

  entries.set(key, {
    category,
    canonicalId,
    sourceValue,
    english: match?.names.en || match?.key || sourceValue,
    gujarati,
    hindi,
    localeCoverage,
    translationStatus,
    reviewStatus: 'needs-human-review',
    sources: [source],
    ...(options.parentCanonicalId ? { parentCanonicalId: options.parentCanonicalId } : {}),
    ...(match ? { catalogKey: match.key } : {}),
    notes,
  });
}

function addGroupValues(category: string, rows: Array<Record<string, unknown>>, field: string, source: string): void {
  for (const row of rows) {
    const value = row[field];
    addValue(category, typeof value === 'boolean' ? String(value) : value, source);
  }
}

function coverageSummary(modelRows: Array<{ contents: Array<{ locale: string }> }>) {
  return {
    entities: modelRows.length,
    missingByLocale: Object.fromEntries(
      locales.map((locale) => [locale, modelRows.filter((row) => !row.contents.some((content) => content.locale === locale)).length]),
    ),
  };
}

async function groupValues(delegate: any, field: string): Promise<Array<Record<string, unknown>>> {
  return delegate.groupBy({ by: [field], orderBy: { [field]: 'asc' } });
}

async function readDatabaseInventory(prisma: PrismaClient) {
  return prisma.$transaction(
    async (tx) => {
      // Enforce read-only semantics for every query in this transaction.
      await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');

      const [
        states,
        districts,
        talukas,
        villages,
        regions,
        marketStates,
        marketDistricts,
        markets,
        commodities,
        varieties,
        grades,
        marketSources,
        listingCropKeys,
        listingUnits,
        listingPrimaryUnits,
        listingSecondaryUnits,
        listingAvailability,
        listingStatuses,
        requirementCropKeys,
        requirementUnits,
        requirementStatuses,
        vehicleTypes,
        transportActive,
        transportAvailable,
        userRoles,
        guideCategories,
        guideSeasons,
        guideCoverageRows,
        schemeLevels,
        schemeDepartments,
        schemeCategories,
        schemeStatuses,
        schemeStates,
        schemeCoverageRows,
      ] = await Promise.all([
        tx.state.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
        tx.district.findMany({ select: { id: true, name: true, stateId: true }, orderBy: { name: 'asc' } }),
        tx.taluka.findMany({ select: { id: true, name: true, districtId: true }, orderBy: { name: 'asc' } }),
        tx.village.findMany({ select: { id: true, name: true, talukaId: true }, orderBy: { name: 'asc' } }),
        tx.gujaratMarketRegion.findMany({ select: { id: true, region: true, district: true }, orderBy: { region: 'asc' } }),
        groupValues(tx.marketPrice, 'state'),
        groupValues(tx.marketPrice, 'district'),
        groupValues(tx.marketPrice, 'market'),
        groupValues(tx.marketPrice, 'commodity'),
        groupValues(tx.marketPrice, 'variety'),
        groupValues(tx.marketPrice, 'grade'),
        groupValues(tx.marketPrice, 'source'),
        groupValues(tx.listing, 'cropKey'),
        groupValues(tx.listing, 'unit'),
        groupValues(tx.listing, 'primaryUnit'),
        groupValues(tx.listing, 'secondaryUnit'),
        groupValues(tx.listing, 'availability'),
        groupValues(tx.listing, 'status'),
        groupValues(tx.buyerRequirement, 'cropKey'),
        groupValues(tx.buyerRequirement, 'unit'),
        groupValues(tx.buyerRequirement, 'status'),
        groupValues(tx.transportProvider, 'vehicleType'),
        groupValues(tx.transportProvider, 'isActive'),
        groupValues(tx.transportProvider, 'isAvailable'),
        groupValues(tx.user, 'role'),
        groupValues(tx.cropGuide, 'category'),
        tx.cropGuide.findMany({ select: { seasonKeys: true } }),
        tx.cropGuide.findMany({ select: { contents: { select: { locale: true } } } }),
        groupValues(tx.governmentScheme, 'governmentLevel'),
        groupValues(tx.governmentScheme, 'department'),
        groupValues(tx.governmentScheme, 'category'),
        groupValues(tx.governmentScheme, 'status'),
        tx.governmentScheme.findMany({ select: { availableStates: true } }),
        tx.governmentScheme.findMany({ select: { contents: { select: { locale: true } } } }),
      ]);

      for (const row of states) addValue('state', row.name, 'State.name', { canonicalId: `state:${row.id}` });
      for (const row of districts) addValue('district', row.name, 'District.name', { canonicalId: `district:${row.id}`, parentCanonicalId: `state:${row.stateId}` });
      for (const row of talukas) addValue('taluka', row.name, 'Taluka.name', { canonicalId: `taluka:${row.id}`, parentCanonicalId: `district:${row.districtId}` });
      for (const row of villages) addValue('village', row.name, 'Village.name', { canonicalId: `village:${row.id}`, parentCanonicalId: `taluka:${row.talukaId}` });

      for (const row of regions) {
        addValue('region', row.region, 'GujaratMarketRegion.region', { canonicalId: `region:${normalize(row.region).replace(/\s+/g, '-')}` });
        addValue('district', row.district, 'GujaratMarketRegion.district');
      }

      addGroupValues('state', marketStates, 'state', 'MarketPrice.state');
      addGroupValues('district', marketDistricts, 'district', 'MarketPrice.district');
      addGroupValues('market', markets, 'market', 'MarketPrice.market');
      addGroupValues('commodity', commodities, 'commodity', 'MarketPrice.commodity');
      addGroupValues('variety', varieties, 'variety', 'MarketPrice.variety');
      addGroupValues('grade', grades, 'grade', 'MarketPrice.grade');
      addGroupValues('dataSource', marketSources, 'source', 'MarketPrice.source');

      addGroupValues('cropKey', listingCropKeys, 'cropKey', 'Listing.cropKey');
      addGroupValues('unit', listingUnits, 'unit', 'Listing.unit');
      addGroupValues('unit', listingPrimaryUnits, 'primaryUnit', 'Listing.primaryUnit');
      addGroupValues('unit', listingSecondaryUnits, 'secondaryUnit', 'Listing.secondaryUnit');
      addGroupValues('listingAvailability', listingAvailability, 'availability', 'Listing.availability');
      addGroupValues('listingStatus', listingStatuses, 'status', 'Listing.status');
      addGroupValues('cropKey', requirementCropKeys, 'cropKey', 'BuyerRequirement.cropKey');
      addGroupValues('unit', requirementUnits, 'unit', 'BuyerRequirement.unit');
      addGroupValues('requirementStatus', requirementStatuses, 'status', 'BuyerRequirement.status');
      addGroupValues('vehicleType', vehicleTypes, 'vehicleType', 'TransportProvider.vehicleType');
      addGroupValues('transportIsActive', transportActive, 'isActive', 'TransportProvider.isActive');
      addGroupValues('transportIsAvailable', transportAvailable, 'isAvailable', 'TransportProvider.isAvailable');
      addGroupValues('userRole', userRoles, 'role', 'User.role');

      addGroupValues('cropGuideCategory', guideCategories, 'category', 'CropGuide.category');
      const seasonValues = new Set(guideSeasons.flatMap((row) => row.seasonKeys));
      for (const value of seasonValues) addValue('cropGuideSeason', value, 'CropGuide.seasonKeys');

      addGroupValues('governmentLevel', schemeLevels, 'governmentLevel', 'GovernmentScheme.governmentLevel');
      addGroupValues('organization', schemeDepartments, 'department', 'GovernmentScheme.department');
      addGroupValues('schemeCategory', schemeCategories, 'category', 'GovernmentScheme.category');
      addGroupValues('schemeStatus', schemeStatuses, 'status', 'GovernmentScheme.status');
      const availableStates = new Set(schemeStates.flatMap((row) => row.availableStates));
      for (const value of availableStates) addValue('schemeState', value, 'GovernmentScheme.availableStates');

      return {
        modelCounts: {
          State: states.length,
          District: districts.length,
          Taluka: talukas.length,
          Village: villages.length,
          GujaratMarketRegion: regions.length,
        },
        contentCoverage: {
          CropGuide: coverageSummary(guideCoverageRows),
          GovernmentScheme: coverageSummary(schemeCoverageRows),
        },
      };
    },
    { timeout: 120_000, maxWait: 10_000, isolationLevel: 'RepeatableRead' },
  );
}

function buildPossibleAliases(items: InventoryEntry[]) {
  const buckets = new Map<string, Set<string>>();
  for (const entry of items) {
    if (!entry.catalogKey || !catalogDomains[entry.category]) continue;
    const key = `${entry.category}\u0000${entry.catalogKey}`;
    const values = buckets.get(key) ?? new Set<string>();
    values.add(entry.sourceValue);
    buckets.set(key, values);
  }
  return [...buckets.entries()]
    .filter(([, values]) => values.size > 1)
    .map(([key, values]) => {
      const [category, catalogKey] = key.split('\u0000');
      return {
        category,
        catalogKey,
        sourceValues: [...values].sort((a, b) => a.localeCompare(b)),
        classification: 'possible-alias-or-variant; human review required; no values merged',
      };
    });
}

function summarize(items: InventoryEntry[]) {
  const categories: Record<string, {
    values: number;
    distinctSourceValues: number;
    mapped: number;
    distinctMappedSourceValues: number;
    catalogComplete: number;
    distinctCatalogCompleteSourceValues: number;
    sourceRetainedUntranslated: number;
    distinctUntranslatedSourceValues: number;
    missingGujarati: number;
    missingHindi: number;
    humanReview: number;
  }> = {};
  for (const entry of items) {
    const category = categories[entry.category] ??= {
      values: 0,
      distinctSourceValues: 0,
      mapped: 0,
      distinctMappedSourceValues: 0,
      catalogComplete: 0,
      distinctCatalogCompleteSourceValues: 0,
      sourceRetainedUntranslated: 0,
      distinctUntranslatedSourceValues: 0,
      missingGujarati: 0,
      missingHindi: 0,
      humanReview: 0,
    };
    category.values += 1;
    if (entry.catalogKey) category.mapped += 1;
    if (entry.translationStatus === 'catalog-complete') category.catalogComplete += 1;
    if (entry.translationStatus === 'source-retained-untranslated') category.sourceRetainedUntranslated += 1;
    if (entry.localeCoverage.gu === 'missing') category.missingGujarati += 1;
    if (entry.localeCoverage.hi === 'missing') category.missingHindi += 1;
    if (entry.reviewStatus === 'needs-human-review') category.humanReview += 1;
  }

  for (const categoryName of Object.keys(categories)) {
    const categoryEntries = items.filter((entry) => entry.category === categoryName);
    const distinctEntries = new Map<string, InventoryEntry>();
    for (const entry of categoryEntries) {
      const current = distinctEntries.get(entry.sourceValue);
      if (!current || (!current.catalogKey && entry.catalogKey)) {
        distinctEntries.set(entry.sourceValue, entry);
      }
    }
    const values = [...distinctEntries.values()];
    const category = categories[categoryName];
    category.distinctSourceValues = values.length;
    category.distinctMappedSourceValues = values.filter((entry) => entry.catalogKey).length;
    category.distinctCatalogCompleteSourceValues = values.filter((entry) => entry.translationStatus === 'catalog-complete').length;
    category.distinctUntranslatedSourceValues = values.filter((entry) => entry.translationStatus === 'source-retained-untranslated').length;
  }
  return categories;
}

async function main(): Promise<void> {
  if (process.argv.includes('--help')) {
    process.stdout.write(
      'Read-only local database localization inventory. Writes apps/api/localization-inventory.json by default.\n' +
        'Use --audit-existing-snapshot to re-evaluate the saved database snapshot against the current reviewed catalog without connecting to PostgreSQL.\n' +
        'Run from apps/api: npm run db:localization-audit.\n' +
        'The script refuses remote/production-named databases and sets the transaction READ ONLY.\n',
    );
    return;
  }

  if (process.argv.includes('--audit-existing-snapshot')) {
    const outputPath = resolve(process.env.LOCALIZATION_INVENTORY_OUT || 'localization-inventory.json');
    const previous = JSON.parse(readFileSync(outputPath, 'utf8')) as {
      [key: string]: unknown;
      entries: InventoryEntry[];
    };
    entries.clear();
    for (const entry of previous.entries) {
      for (const source of entry.sources) {
        addValue(entry.category, entry.sourceValue, source, {
          canonicalId: entry.canonicalId,
          parentCanonicalId: entry.parentCanonicalId,
        });
      }
    }
    const refreshedEntries = [...entries.values()].sort((a, b) =>
      `${a.category}\u0000${a.sourceValue}\u0000${a.canonicalId}`.localeCompare(`${b.category}\u0000${b.sourceValue}\u0000${b.canonicalId}`),
    );
    previous.catalogAuditedAt = new Date().toISOString();
    previous.summary = summarize(refreshedEntries);
    previous.possibleAliases = buildPossibleAliases(refreshedEntries);
    previous.entries = refreshedEntries;
    writeFileSync(outputPath, `${JSON.stringify(previous, null, 2)}\n`, { mode: 0o600 });
    process.stdout.write(`Saved database snapshot audited against current catalog: ${outputPath}\n`);
    process.stdout.write(`Entries: ${refreshedEntries.length}; catalog audit: ${String(previous.catalogAuditedAt)}\n`);
    return;
  }

  const databaseUrl = assertLocalDevelopmentDatabase();
  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
    log: ['error'],
  });

  try {
    const databaseSummary = await readDatabaseInventory(prisma);
    const inventoryEntries = [...entries.values()].sort((a, b) =>
      `${a.category}\u0000${a.sourceValue}\u0000${a.canonicalId}`.localeCompare(`${b.category}\u0000${b.sourceValue}\u0000${b.canonicalId}`),
    );
    const sourceModels = new Set(inventoryEntries.flatMap((entry) => entry.sources.map((source) => source.split('.')[0])));
    if (databaseSummary.contentCoverage.CropGuide.entities > 0) sourceModels.add('CropGuideContent');
    if (databaseSummary.contentCoverage.GovernmentScheme.entities > 0) sourceModels.add('GovernmentSchemeContent');
    const outputPath = resolve(process.env.LOCALIZATION_INVENTORY_OUT || 'localization-inventory.json');
    const inventory = {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      source: { environment: 'local-development', readOnly: true },
      privacy: {
        exportedFields: 'Curated domain values and public content locale coverage only.',
        excludedFields: [
          'User names, phone numbers, coordinates, auth records, tokens, and audit logs',
          'Listing and buyer free-text crop names, varieties, descriptions, requirements, and locations',
          'Transport business names, contact names, phone numbers, custom vehicle labels, details, and coordinates',
          'Guide and scheme narrative bodies',
        ],
        note: 'Free-form user values are deliberately excluded so the inventory cannot disclose private user content.',
      },
      databaseModelsInspected: [
        'State', 'District', 'Taluka', 'Village', 'GujaratMarketRegion', 'MarketPrice', 'Listing',
        'BuyerRequirement', 'TransportProvider', 'User', 'CropGuide', 'CropGuideContent',
        'GovernmentScheme', 'GovernmentSchemeContent',
      ],
      tablesWithUserFacingValues: [...sourceModels].sort(),
      tableCountWithUserFacingValues: sourceModels.size,
      schemaFindings: {
        cropMasterModel: false,
        marketMasterModel: false,
        note: 'The current Prisma schema has no Crop or Market master model. Commodity/market names are raw MarketPrice values; listing crop keys are constrained strings.',
      },
      databaseSummary,
      summary: summarize(inventoryEntries),
      possibleAliases: buildPossibleAliases(inventoryEntries),
      entries: inventoryEntries,
    };

    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, `${JSON.stringify(inventory, null, 2)}\n`, { mode: 0o600 });
    process.stdout.write(
      `Localization inventory written: ${outputPath}\n` +
        `Entries: ${inventoryEntries.length}; possible alias/variant groups: ${inventory.possibleAliases.length}\n` +
        `Location rows: ${JSON.stringify(databaseSummary.modelCounts)}\n` +
        'Only whitelisted domain fields were read; no database writes were attempted.\n',
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code)
    : undefined;
  const suffix = code ? ` (database error ${code})` : '';
  process.stderr.write(
    `Localization inventory failed${suffix}. Check that the local development PostgreSQL service is running and that the Prisma schema matches it. Error details are suppressed to protect credentials. No database writes were attempted.\n`,
  );
  process.exitCode = 1;
});
