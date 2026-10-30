import { NextIntlClientProvider } from 'next-intl';
import type { Locale } from '@/i18n/config';
import { loadScopedLocaleMessages } from '@/i18n/server-messages';

export async function ScopedIntlProvider({
  locale,
  paths,
  children,
}: {
  locale: Locale;
  paths: readonly string[];
  children: React.ReactNode;
}) {
  const messages = await loadScopedLocaleMessages(locale, paths);
  return (
    <NextIntlClientProvider locale={locale} timeZone="Asia/Kolkata" messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
