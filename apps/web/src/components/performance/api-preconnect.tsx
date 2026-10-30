import { API_BASE_URL } from '@/lib/api-url';

/** Open the API connection while the page shell is being parsed. */
export function ApiPreconnect() {
  return <link rel="preconnect" href={new URL(API_BASE_URL).origin} crossOrigin="anonymous" />;
}
