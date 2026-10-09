// import { MarketPricesPage } from '@/components/market-prices/market-prices-page';

// export default function MarketPricesRoute() {
//     return <MarketPricesPage />;
// }

import { MarketPricesPage } from '@/components/market-prices/market-prices-page';

/**
 * All Market Prices sub-pages share this pathname and are differentiated by
 * query parameters (?view=regions, ?view=regionMarkets&region=..., etc.).
 *
 * The MarketPricesPage component manages its own view state internally and
 * resets to the home screen via its useEffect([searchQuery]) whenever the
 * sidebar navigates back to the clean /dashboard/market-prices URL.
 *
 * We intentionally do NOT pass a key prop here. The old key-based strategy
 * (remounting on every query-param change) conflicted with the router.replace
 * calls used for inner navigation — those also change query params, which
 * would remount the component mid-navigation, causing a blink and requiring
 * multiple clicks to reach a sub-page.
 */
export default function MarketPricesRoute() {
    return <MarketPricesPage />;
}
