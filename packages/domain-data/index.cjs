'use strict';

const catalog = require('./domain-localization.json');

const localeAliases = { en: 'en', 'en-US': 'en', 'en-IN': 'en', gu: 'gu', 'gu-IN': 'gu', hi: 'hi', 'hi-IN': 'hi' };
const normalize = (value) => String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const normalizedIndexes = new WeakMap();
const normalizedAliasIndexes = new WeakMap();

function getNormalizedIndex(map) {
  let index = normalizedIndexes.get(map);
  if (!index) {
    index = new Map();
    for (const [name, translations] of Object.entries(map)) {
      for (const alias of [name, translations.en, translations.gu, translations.hi]) {
        const key = normalize(alias);
        if (key && !index.has(key)) index.set(key, [name, translations]);
      }
    }
    normalizedIndexes.set(map, index);
  }
  return index;
}

function getAliasValue(map, value) {
  if (!map) return undefined;
  let index = normalizedAliasIndexes.get(map);
  if (!index) {
    index = new Map(Object.entries(map).map(([alias, canonical]) => [normalize(alias), canonical]));
    normalizedAliasIndexes.set(map, index);
  }
  return index.get(normalize(value));
}

function getDomainMap(domain) {
  switch (domain) {
    case 'region': return catalog.regions;
    case 'district': return catalog.districts;
    case 'crop':
    case 'commodity': return catalog.crops;
    case 'market': return catalog.markets;
    case 'variety': return catalog.varieties;
    case 'marketVariety': return catalog.varieties;
    case 'grade': return catalog.grades;
    case 'state': return catalog.states;
    case 'vehicleType': return catalog.vehicleTypes;
    case 'unit': return catalog.units;
    case 'taluka': return catalog.talukas || {};
    case 'village': return catalog.villages || {};
    default: return undefined;
  }
}

function getNormalizedEntry(value, domain, map) {
  const key = normalize(value);
  if (!key || !map) return undefined;
  const index = getNormalizedIndex(map);
  const direct = index.get(key);
  if (direct) return direct;

  if (domain === 'district') {
    const canonical = getAliasValue(catalog.districtAliases, key);
    if (canonical) {
      const entry = index.get(normalize(canonical));
      if (entry) return entry;
    }
  }

  if (domain === 'crop' || domain === 'commodity') {
    const canonical = getAliasValue(catalog.cropAliases, key);
    if (canonical) {
      const entry = index.get(normalize(canonical));
      if (entry) return entry;
    }
  }

  // Government mandi feeds often put a commodity name in the variety field
  // (for example, "Bottle Gourd"). Reuse an exact crop entry only after the
  // market-variety catalog and its reviewed aliases have been checked.
  if (domain === 'marketVariety') {
    const cropEntry = getNormalizedIndex(catalog.crops || {}).get(key);
    if (cropEntry) return cropEntry;
    const canonical = getAliasValue(catalog.cropAliases, key);
    if (canonical) {
      const entry = getNormalizedIndex(catalog.crops || {}).get(normalize(canonical));
      if (entry) return entry;
    }
  }

  if (domain === 'market') {
    const canonical = getAliasValue(catalog.marketAliases, key);
    if (canonical) {
      const entry = index.get(normalize(canonical));
      if (entry) return entry;
    }
  }

  if (domain === 'variety' || domain === 'marketVariety') {
    const canonical = getAliasValue(catalog.varietyAliases, key);
    if (canonical) {
      const entry = index.get(normalize(canonical));
      if (entry) return entry;
    }
  }

  if (domain === 'taluka' || domain === 'village') {
    const aliases = domain === 'village' ? catalog.villageAliases : catalog.talukaAliases;
    const canonical = getAliasValue(aliases, key);
    if (canonical) {
      const entry = index.get(normalize(canonical)) || getNormalizedIndex(catalog.markets || {}).get(normalize(canonical));
      if (entry) return entry;
    }
  }

  // Some older locality rows use an APMC label as their canonical spelling.
  if (domain === 'taluka') {
    const marketEntry = getNormalizedIndex(catalog.markets || {}).get(key);
    if (marketEntry) return marketEntry;
  }

  if (domain === 'market' || domain === 'taluka' || domain === 'village') {
    const cleaned = key
      .replace(/^the agricultural produce market committee\s*/, '')
      .replace(/^agricultural produce market committee\s*/, '')
      .replace(/\ba\s+p\s+m\s+c\b/g, '')
      .replace(/\b(apmc|market yard|market committee)\b/g, '')
      .trim();
    const market = index.get(cleaned) || index.get(cleaned.replace(/^the\s+/, ''));
    if (market) return market;
    if (domain === 'market') {
      const canonical = getAliasValue(catalog.marketAliases, cleaned);
      if (canonical) {
        const entry = index.get(normalize(canonical));
        if (entry) return entry;
      }
    }
  }

  return undefined;
}

function getLocalizedDomainName(value, locale, domain) {
  const original = String(value ?? '').trim();
  if (!original) return '';
  const safeLocale = localeAliases[locale] ?? 'en';
  const map = getDomainMap(domain);
  const entry = getNormalizedEntry(original, domain, map);
  if (!entry) {
    if (safeLocale === 'en') return original;
    // Proper names without a reviewed/source-backed native form must retain
    // their original spelling. Guessing pronunciation from English changes
    // village, market, and crop identities.
    return original;
  }
  const [canonical, names] = entry;

  if (domain === 'market') {
    const normalizedOriginal = normalize(original);
    const sourceHasApmc = /(?:^|\s)(?:apmc|a p m c)(?:$|\s)|market committee|agricultural produce market committee/i.test(normalizedOriginal);
    const baseName = safeLocale === 'en' ? canonical : names[safeLocale] || canonical;
    const apmcLabel = safeLocale === 'gu' ? 'એ.પી.એમ.સી.' : safeLocale === 'hi' ? 'एपीएमसी' : 'APMC';
    return sourceHasApmc ? `${baseName} ${apmcLabel}` : baseName;
  }

  if (safeLocale === 'en') return canonical;
  return names[safeLocale] || original;
}

const searchableDomainEntries = ['district', 'taluka', 'village', 'crop', 'market', 'variety', 'grade', 'region', 'state', 'vehicleType']
  .flatMap((domain) => Object.entries(getDomainMap(domain) || {}).map(([canonical, translations]) => ({
    canonical,
    names: [canonical, translations.gu, translations.hi].filter(Boolean).map(normalize),
  })));
const cropAliasEntries = Object.entries(catalog.cropAliases).map(([alias, canonical]) => [normalize(alias), alias, canonical]);
const districtAliasEntries = Object.entries(catalog.districtAliases).map(([alias, canonical]) => [normalize(alias), alias, canonical]);
const talukaAliasEntries = Object.entries(catalog.talukaAliases).map(([alias, canonical]) => [normalize(alias), alias, canonical]);
const marketAliasEntries = Object.entries(catalog.marketAliases || {}).map(([alias, canonical]) => [normalize(alias), alias, canonical]);
const varietyAliasEntries = Object.entries(catalog.varietyAliases || {}).map(([alias, canonical]) => [normalize(alias), alias, canonical]);
const villageAliasEntries = Object.entries(catalog.villageAliases || {}).map(([alias, canonical]) => [normalize(alias), alias, canonical]);

function getDomainSearchAliases(query) {
  const term = normalize(query);
  if (term.length < 2) return [];
  const aliases = new Set();

  for (const { canonical, names } of searchableDomainEntries) {
    if (names.some((name) => name.includes(term) || (name.length >= 4 && term.includes(name)))) aliases.add(canonical);
  }

  for (const entries of [cropAliasEntries, districtAliasEntries, talukaAliasEntries, marketAliasEntries, varietyAliasEntries, villageAliasEntries]) {
    const matchedCanonicals = new Set([...aliases].map(normalize));
    for (const [normalizedAlias, , canonical] of entries) {
      if (normalizedAlias.includes(term) || term.includes(normalizedAlias)) {
        matchedCanonicals.add(normalize(canonical));
        aliases.add(canonical);
      }
    }
    for (const [normalizedAlias, alias, canonical] of entries) {
      if (matchedCanonicals.has(normalize(canonical))) {
        aliases.add(alias);
        aliases.add(canonical);
      }
    }
  }

  return [...aliases].slice(0, 12);
}

module.exports = { getLocalizedDomainName, getDomainSearchAliases };
