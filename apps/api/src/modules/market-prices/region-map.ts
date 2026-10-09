export const GUJARAT_REGIONS = [
  'Saurashtra',
  'North Gujarat',
  'Kutch',
  'Central Gujarat',
  'South Gujarat',
] as const;

export type GujaratRegion = (typeof GUJARAT_REGIONS)[number];

/**
 * Canonical district names used by AgriConnect for regional grouping.
 *
 * IMPORTANT:
 * These are canonical names only.
 * Government/source spelling variants are handled separately
 * through GUJARAT_DISTRICT_ALIASES.
 */
export const GUJARAT_REGION_DISTRICTS: Record<GujaratRegion, string[]> = {
  Saurashtra: [
    'Amreli',
    'Bhavnagar',
    'Botad',
    'Devbhumi Dwarka',
    'Gir Somnath',
    'Jamnagar',
    'Junagadh',
    'Morbi',
    'Porbandar',
    'Rajkot',
    'Surendranagar',
  ],

  'North Gujarat': [
    'Ahmedabad',
    'Aravalli',
    'Banaskantha',
    'Gandhinagar',
    'Mehsana',
    'Patan',
    'Sabarkantha',
    'Vav Tharad',
  ],

  Kutch: ['Kachchh'],

  'Central Gujarat': [
    'Anand',
    'Chhota Udepur',
    'Dahod',
    'Kheda',
    'Mahisagar',
    'Panchmahal',
    'Vadodara',
  ],

  'South Gujarat': [
    'Bharuch',
    'Dang',
    'Narmada',
    'Navsari',
    'Surat',
    'Tapi',
    'Valsad',
  ],
};

/**
 * Government/source spelling variants mapped to one canonical district.
 *
 * IMPORTANT:
 * Keys are normalized to lower-case and trimmed before lookup.
 *
 * This list intentionally contains source spellings found in the
 * AgriConnect MarketPrice dataset.
 */
export const GUJARAT_DISTRICT_ALIASES: Record<string, string> = {
  // ============================================================
  // KUTCH
  // ============================================================

  kachchh: 'Kachchh',
  kutch: 'Kachchh',
  kachch: 'Kachchh',
  cutch: 'Kachchh',

  // ============================================================
  // DEVBHUMI DWARKA
  // ============================================================

  'devbhumi dwarka': 'Devbhumi Dwarka',
  'devbhoomi dwarka': 'Devbhumi Dwarka',
  'devbhumi dwaraka': 'Devbhumi Dwarka',
  'devbhoomi dwaraka': 'Devbhumi Dwarka',

  // ============================================================
  // ARAVALLI
  // ============================================================

  aravalli: 'Aravalli',
  arvalli: 'Aravalli',

  // ============================================================
  // CHHOTA UDEPUR
  // ============================================================

  'chhota udepur': 'Chhota Udepur',
  'chhota udaipur': 'Chhota Udepur',
  chhotaudepur: 'Chhota Udepur',
  chhotaudaipur: 'Chhota Udepur',

  // ============================================================
  // PANCHMAHAL
  // ============================================================

  panchmahal: 'Panchmahal',
  panchmahals: 'Panchmahal',
  'panch mahals': 'Panchmahal',

  // Common source spelling
  mahisagar: 'Mahisagar',
  'mahi sagar': 'Mahisagar',

  // ============================================================
  // DANG
  // ============================================================

  dang: 'Dang',
  dangs: 'Dang',

  // Government/source dataset uses "The Dangs"
  'the dangs': 'Dang',

  // ============================================================
  // JUNAGADH
  // ============================================================

  // Government/source dataset uses "Junagarh"
  junagarh: 'Junagadh',

  // Other common spelling variants
  junagadh: 'Junagadh',
  junagar: 'Junagadh',
  'geer somnath': 'Gir Somnath',
  'gir-somnath': 'Gir Somnath',

  // ============================================================
  // VADODARA
  // ============================================================

  // Government/source dataset uses "Vadodara(Baroda)"
  'vadodara(baroda)': 'Vadodara',

  // Common variants
  vadodara: 'Vadodara',
  baroda: 'Vadodara',

  // ============================================================
  // BANASKANTHA
  // ============================================================

  'banas kantha': 'Banaskantha',
  banaskanth: 'Banaskantha',
  banaskantha: 'Banaskantha',

  // Vav-Tharad became a separate district; keep common source spellings
  // together under the canonical district name.
  'vav tharad': 'Vav Tharad',
  'vav-tharad': 'Vav Tharad',
  'vavtharad': 'Vav Tharad',

  // ============================================================
  // DAHOD
  // ============================================================

  dohad: 'Dahod',

  // ============================================================
  // SURENDRANAGAR
  // ============================================================

  'surendra nagar': 'Surendranagar',
};

/**
 * Return the canonical district key used for comparisons and counting.
 *
 * The function:
 * 1. trims whitespace
 * 2. normalizes repeated spaces
 * 3. checks explicit source aliases
 * 4. checks punctuation/spacing-insensitive matches
 * 5. preserves unknown values instead of silently deleting them
 */
export function canonicalizeGujaratDistrict(district: string): string {
  const value = district.trim().replace(/\s+/g, ' ');

  if (!value) {
    return value;
  }

  const lower = value.toLowerCase();

  // ------------------------------------------------------------
  // 1. Explicit government/source aliases
  // ------------------------------------------------------------

  const alias = GUJARAT_DISTRICT_ALIASES[lower];

  if (alias) {
    return alias;
  }

  // ------------------------------------------------------------
  // 2. Exact canonical district match
  // ------------------------------------------------------------

  for (const region of GUJARAT_REGIONS) {
    for (const canonicalDistrict of GUJARAT_REGION_DISTRICTS[region]) {
      if (canonicalDistrict.toLowerCase() === lower) {
        return canonicalDistrict;
      }
    }
  }

  // ------------------------------------------------------------
  // 3. Punctuation/spacing-insensitive comparison
  //
  // Example:
  // "Surendra Nagar"
  // "Surendranagar"
  // ------------------------------------------------------------

  const compact = lower.replace(/[^a-z0-9]/g, '');

  for (const region of GUJARAT_REGIONS) {
    for (const canonicalDistrict of GUJARAT_REGION_DISTRICTS[region]) {
      const canonicalCompact = canonicalDistrict
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

      if (canonicalCompact === compact) {
        return canonicalDistrict;
      }
    }
  }

  // ------------------------------------------------------------
  // 4. Preserve unknown districts
  //
  // Do NOT silently discard them.
  // The service can log them so a new government spelling
  // can be added later.
  // ------------------------------------------------------------

  return value;
}

/**
 * Reverse lookup from canonical district to AgriConnect region.
 */
export function getGujaratRegionForDistrict(
  district: string,
): GujaratRegion | null {
  const canonical = canonicalizeGujaratDistrict(district);

  for (const region of GUJARAT_REGIONS) {
    if (GUJARAT_REGION_DISTRICTS[region].includes(canonical)) {
      return region;
    }
  }

  return null;
}