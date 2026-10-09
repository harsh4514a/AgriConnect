export type DomainLocale = 'en' | 'gu' | 'hi';
export type DomainNameType =
  | 'region'
  | 'district'
  | 'crop'
  | 'commodity'
  | 'market'
  | 'variety'
  | 'marketVariety'
  | 'grade'
  | 'state'
  | 'taluka'
  | 'village'
  | 'vehicleType'
  | 'unit';

export function getLocalizedDomainName(
  value: string | null | undefined,
  locale: string,
  domain: DomainNameType,
): string;

export function getDomainSearchAliases(query: string): string[];
