import { getLocalizedDomainName, getDomainSearchAliases } from '@agri/domain-data';

export { getDomainSearchAliases };

export function getLocalizedRegionName(name: string, locale: string): string {
  return getLocalizedDomainName(name, locale, 'region');
}

export function getLocalizedDistrictName(name: string, locale: string): string {
  return getLocalizedDomainName(name, locale, 'district');
}

export function getLocalizedCropName(name: string, locale: string): string {
  return getLocalizedDomainName(name, locale, 'commodity');
}

export function getLocalizedMarketName(name: string, locale: string): string {
  return getLocalizedDomainName(name, locale, 'market');
}

export function getLocalizedVariety(name: string, locale: string): string {
  return getLocalizedDomainName(name, locale, 'marketVariety');
}

export function getLocalizedGrade(name: string, locale: string): string {
  return getLocalizedDomainName(name, locale, 'grade');
}

export function getLocalizedLocationName(name: string, locale: string, type: 'district' | 'taluka' | 'village' | 'state'): string {
  return getLocalizedDomainName(name, locale, type);
}

export function getLocalizedVehicleType(name: string, locale: string): string {
  return getLocalizedDomainName(name, locale, 'vehicleType');
}

export function getLocalizedUnit(name: string, locale: string): string {
  return getLocalizedDomainName(name, locale, 'unit');
}

export function getLocalizedPriceUnitLabel(locale: string): string {
  if (locale === 'gu') return '₹/૨૦ કિલો';
  if (locale === 'hi') return '₹/20 किग्रा';
  return '₹/20 kg';
}

export function getLocalizedPriceUnitText(locale: string): string {
  if (locale === 'gu') return '૨૦ કિલો દીઠ ભાવ';
  if (locale === 'hi') return '२० किलोग्राम प्रति भाव';
  return 'Price per 20 kg';
}
