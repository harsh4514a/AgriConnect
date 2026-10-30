import type { Locale, Messages } from './config';

/** Load only the active locale on the server so every browser session does not
 * download all three large translation dictionaries. */
export async function loadLocaleMessages(locale: Locale): Promise<Messages> {
  switch (locale) {
    case 'gu':
      return (await import('../../messages/gu.json')).default as unknown as Messages;
    case 'hi':
      return (await import('../../messages/hi.json')).default as unknown as Messages;
    case 'en':
    default:
      return (await import('../../messages/en.json')).default as Messages;
  }
}

/**
 * Build the subset needed by one route tree before it reaches the client.
 * Paths can select a whole namespace (`dashboard`) or one small branch of a
 * compatibility namespace (`api.transportManagement`).
 */
export function selectLocaleMessages(
  messages: Messages,
  paths: readonly string[],
): Messages {
  const sourceRoot = messages as unknown as Record<string, unknown>;
  const selected: Record<string, unknown> = {};

  for (const path of paths) {
    const segments = path.split('.').filter(Boolean);
    let source: unknown = sourceRoot;
    let destination = selected;

    for (const [index, segment] of segments.entries()) {
      if (!source || typeof source !== 'object' || !(segment in source)) break;
      const sourceRecord = source as Record<string, unknown>;
      if (index === segments.length - 1) {
        destination[segment] = sourceRecord[segment];
        break;
      }

      source = sourceRecord[segment];
      const existing = destination[segment];
      if (!existing || typeof existing !== 'object') destination[segment] = {};
      destination = destination[segment] as Record<string, unknown>;
    }
  }

  return selected as Messages;
}

export async function loadScopedLocaleMessages(
  locale: Locale,
  paths: readonly string[],
): Promise<Messages> {
  return selectLocaleMessages(await loadLocaleMessages(locale), paths);
}
