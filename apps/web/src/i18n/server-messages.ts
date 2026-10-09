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
