# AgriConnect performance baseline and follow-up

## Scope and measurement conditions

The baseline was captured before the optimization changes from the existing working tree, which was already substantially modified. The production web app was built and served locally with `SITE_URL=https://agriconnect.example.com` and `NEXT_PUBLIC_API_URL=https://api.agriconnect.example.com`; these are documentation-safe placeholders and no requests were sent to them. After the changes, the same production routes were requested on a freshly started local server in the same order. HTML byte counts below are uncompressed `curl` response sizes. TTFB values are one localhost sample per route, not browser navigation timings.

| Route | Baseline TTFB | After TTFB | Baseline HTML | After HTML | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| `/en` | 159.9 ms | 78.1 ms | 285,516 B | 284,507 B | 200; static locale route |
| `/hi` | 33.8 ms | 20.8 ms | 425,890 B | 424,881 B | 200; static locale route |
| `/gu` | 27.0 ms | 13.9 ms | 444,366 B | 443,357 B | 200; static locale route |
| `/en/dashboard` | 23.5 ms | 11.7 ms | 236,169 B | 236,340 B | 200; static shell, protected data still fetched from APIs |
| `/en/admin` | 14.3 ms | 9.8 ms | 204,184 B | 204,407 B | 200; static shell, admin data still fetched from APIs |
| `/en/dashboard/marketplace` | — | 9.3 ms | — | 217,791 B | 200 |
| `/en/admin/login` | — | 9.0 ms | — | 210,017 B | 200 |

The post-change TTFB samples are lower, but they are single local measurements and are sensitive to process startup and machine load. They do not establish a real-user speedup. HTML sizes are effectively unchanged (within 0.4%). The post-change dashboard response included `Cache-Control: s-maxage=31536000`. The production build generated 97 static paths; routes requiring IDs, slugs, or runtime metadata remain dynamic.

## Evidence and changes

| Finding | Evidence and severity | Change |
| --- | --- | --- |
| Dashboard preview read the owner's full listings even though it displayed only three. | The old client path fetched `/listings/mine` and selected the newest rows in the browser. High for users with many listings. | Added authenticated `/listings/mine/recent`, selecting only preview fields and at most three rows; the dashboard now uses it. |
| My Listings loaded all owned listings for client-side search, filters, and pagination. | The page used the unbounded owner-list response. High as listing history grows. | Added authenticated `/listings/mine/management` with bounded server pagination (12 by default, 50 maximum), search/status filtering, and grouped status totals. The existing `/listings/mine` response remains unchanged. |
| The auth background was delivered as a full-size CSS background. | `Background_Image.jpg` is 386,637 B. A local Next Image optimizer request at `w=640&q=72` returned 29,142 B WebP (92.5% below the source file). | Rendered it through `next/image` with a viewport-based size and priority. This optimizer result is a controlled variant, not a measured browser transfer at every viewport. |
| The default market-price path looked up the latest date twice. | Code-path inspection shows four Prisma calls on the no-date path before the change and three after; no database timings were available. | Reused the initial latest-date result. Explicit-date behavior is unchanged. |
| Localized route shells were rendered dynamically although their locale set is fixed. | The baseline Next build marked localized pages dynamic. The current build emits static localized shells; authenticated content remains behind protected browser API calls. | Added the supported `en`, `hi`, and `gu` static params and static route boundaries where `useSearchParams` required Suspense. |
| Listing photos used raw `<img>` elements in several views. | The app already configures Next image optimization for Cloudinary. A 640 px, quality 72 optimizer request for `image1.jpg` returned 43,450 B from a 3,377,892 B source (98.7% smaller); that image was already using Next Image before this work. | Added a shared image wrapper for HTTPS Cloudinary delivery URLs and responsive sizes in listing cards, details, and the dashboard. Other/legacy URLs retain their original delivery path. Real Cloudinary URLs were not available to verify. |

## Production bundle sizes

Values are the route-specific First Load JS figures printed by `next build`, in kB. They are not browser network-transfer measurements. The small increases on image-bearing routes come with the Next Image client runtime and should be checked against actual image delivery in a browser.

| Route | Before | After |
| --- | ---: | ---: |
| Home | 253 | 208 |
| Auth | 275 | 233 |
| Dashboard home | 201 | 207 |
| Marketplace browse | 218 | 223 |
| Marketplace detail | 228 | 234 |
| My Listings | 216 | 223 |
| Nearby Listings | 208 | 214 |
| Shared chunks | 103 | 103 |

## Checks and limits

- `pnpm typecheck`: passed (4 tasks).
- `pnpm lint`: passed (5 tasks).
- `pnpm build`: passed; Turbo replayed successful cached API and web build outputs. A fresh direct web build also completed during this work and generated the 97 static paths.
- `pnpm test`: no test tasks are configured (`0 successful, 0 total`); no tests ran.
- `git diff --check`: passed.
- Production HTTP smoke checks: the seven listed routes returned 200. This verifies local HTML responses only, not authentication flows or API behavior.
- PostgreSQL was not running locally (`localhost:5432` did not respond). No API/database latency, query plans, row counts, or authenticated integration tests could be measured. No schema/index changes or cache service were introduced.
- No browser automation or Lighthouse run was available. LCP, INP, CLS, browser console errors, route-transition behavior, admin interaction latency, and responsive/theme behavior remain unmeasured. Use a production-like seeded database and browser run to collect them.
- Admin lists already had server pagination and debounced search in the inspected code, so they were left intact. Leaflet is installed but no Leaflet import/component was found in the web source.

## Follow-up measurements

Run a browser-based Lighthouse/DevTools pass against a deployed or production-like environment for English, Hindi, and Gujarati, including mobile and desktop. Then profile the new listing endpoints and market-price path against a seeded PostgreSQL database; add endpoint tests for owner isolation, pagination bounds, filters, and counts. Finally, verify Cloudinary `srcset` selection and image layout on representative records and compare gzip/brotli transfer sizes and Core Web Vitals. The current evidence does not support claiming the application is fully optimized.

## Follow-up for constrained connections

The follow-up pass reduces client-side translation payloads by route, removes Framer Motion from the homepage's static sections, and defers auth-flow animation code until the OTP or registration steps are opened. Initial route code now measures 208 kB for Home (down from 253 kB) and 233 kB for Auth (down from 275 kB). The shared first-load chunk remains 103 kB. These are Next.js build report values, not end-to-end browser timings.

The homepage hero now waits five seconds between slides and pauses automatic rotation when the browser reports 2G or data-saver mode. Large images use responsive Next Image delivery at lower quality settings; the listing image wrapper requests smaller variants. Internal links now use connection-aware prefetch: visible destinations can warm on normal connections, while 2G and data-saver connections avoid background downloads. Superseded dashboard/search requests are aborted. The dashboard preview uses a bounded recent-listings endpoint; My Listings uses server pagination. The initial market-prices screen no longer requests the same filters twice.

The root `pnpm dev` command now starts API and web directly, checks both ports before launch, reuses an AgriConnect API already on the API port, and terminates the owned child process groups on Ctrl+C. A local startup/shutdown smoke run confirmed both owned ports were released after Ctrl+C. The existing port conflict was an orphaned Nest watch process from a prior dev run; it was identified as belonging to this workspace and stopped before the clean-run check. Next.js development mode still compiles a route on its first visit; production route prefetch is the relevant behavior for deployed first-click navigation.

Fresh local production requests returned 200 with gzip for the following routes. Counts are compressed HTML response bytes only:

| Route | Gzip HTML |
| --- | ---: |
| `/en` | 32,843 B |
| `/gu` | 36,185 B |
| `/hi` | 36,320 B |
| `/en/auth` | 12,622 B |
| `/en/dashboard` | 28,285 B |
| `/en/dashboard/marketplace` | 28,796 B |
| `/en/dashboard/market-prices` | 28,541 B |
| `/en/dashboard/my-listings` | 29,131 B |
| `/gu/dashboard/buyer-requirements` | 32,716 B |
| `/en/admin` | 18,449 B |
| `/hi/admin/transport` | 23,053 B |

At an illustrative transfer rate of 20 kB/s (about 160 kbit/s), those HTML responses alone take roughly 0.6–1.9 seconds to transfer, before network round-trip time, JavaScript, CSS, images, or API data. The reported 208 kB Home and 233 kB Auth first-load JavaScript would take about 10.4 and 11.7 seconds respectively at that rate if downloaded uncached. This is byte-budget arithmetic, not a carrier or browser simulation, and it shows why “load within milliseconds” cannot be guaranteed on 2G. The pages render server HTML first; actual interactive readiness and Core Web Vitals still need a browser run on a throttled connection.

The final build generated 97 static paths, including the supported localized route variants, and all 11 local production smoke checks returned 200. The first scoped-message version logged missing shared navigation/footer translations despite returning 200; the root scope was expanded for shared labels, and the home route stopped sending a duplicate full landing-page message block. The rebuilt server returned the sampled routes without translation errors.
