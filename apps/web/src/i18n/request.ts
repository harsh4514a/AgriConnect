import { getRequestConfig } from 'next-intl/server';
import { type Locale, defaultLocale, isLocale } from './config';
import { loadLocaleMessages } from './server-messages';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: Locale = isLocale(requested) ? requested : defaultLocale;

  return {
    locale,
    messages: await loadLocaleMessages(locale),
  };
});
