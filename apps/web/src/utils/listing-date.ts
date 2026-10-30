export interface FormattedListingDate {
  iso: string;
  timestamp: number;
  label: string;
}

export function getListingCreatedAtTimestamp(
  createdAt: string | Date | null | undefined,
): number | null {
  if (!createdAt) return null;

  const timestamp = (createdAt instanceof Date ? createdAt : new Date(createdAt)).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function formatListingCreatedAt(
  createdAt: string | Date | null | undefined,
  locale: string,
): FormattedListingDate | null {
  const timestamp = getListingCreatedAtTimestamp(createdAt);
  if (timestamp === null) return null;

  const date = new Date(timestamp);

  return {
    iso: date.toISOString(),
    timestamp,
    label: new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date),
  };
}
