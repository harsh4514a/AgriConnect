# Production deployment checklist

AgriConnect is a pnpm/Turborepo monorepo with a Next.js frontend, a NestJS API,
and PostgreSQL through Prisma. No production domain or hosting platform is
configured in this repository. Choose those first, then use the provider's
secret manager for the server-only variables below.

## Build and deploy

Use Node.js 20 or newer and the pnpm version pinned in the root
`package.json` (`pnpm@9.15.9`). From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm --filter @agri/api prisma:generate
pnpm --filter @agri/api db:migrate:deploy
pnpm --filter @agri/api build
pnpm --filter @agri/web build
```

Deploy `apps/api` as a persistent Node service with the API environment configured
before startup. Run `pnpm --filter @agri/api start` to start its compiled output.
Deploy `apps/web` as a Next.js Node service. `SITE_URL` and
`NEXT_PUBLIC_API_URL` must be set when building the frontend; `NEXT_PUBLIC_*`
values are compiled into browser code and changing them after build does not
change the bundle. Configure `SITE_URL` at runtime too so `robots.txt` and
`sitemap.xml` use the same canonical origin.

Do not run Prisma reset commands or load sample/demo listings in production.
Apply checked-in migrations with `db:migrate:deploy`. If the location reference
tables are empty, run `pnpm --filter @agri/api db:seed` from a one-time
initialization job; it imports the bundled Gujarat LGD location reference data
by creating missing rows and does not update or delete existing rows. The JSON
data is checked into `apps/api/prisma/seed/gujarat-location-data.json`; the
original workbook is retained as its source reference. Review the data and
database state before running that initialization.
Provision the first administrator explicitly with `ADMIN_USERNAME` and
`ADMIN_PASSWORD`, run `pnpm --filter @agri/api db:seed-admin` once, then remove
those seed credentials from runtime configuration.

## Frontend variables

Set these in the frontend build environment:

| Variable | Use |
| --- | --- |
| `SITE_URL` | Actual HTTPS website origin, with no path. Used for metadata, canonical URLs, sitemap, and robots. |
| `NEXT_PUBLIC_API_URL` | Actual HTTPS NestJS API origin. Public and embedded in the client bundle. |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase Web app config only; public/client-safe values. |
| `GOOGLE_SITE_VERIFICATION` | Optional verification string issued by Search Console; public by design. |

Never use localhost values for a production build. Do not configure a domain
until the real canonical host has been selected.

## API server-only variables

Configure these through the API host's secret manager. Do not expose them with a
`NEXT_PUBLIC_` prefix:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_REGISTRATION_SECRET`
- `JWT_ADMIN_ACCESS_SECRET`, `JWT_ADMIN_REFRESH_SECRET`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- `DATA_GOV_IN_API_KEY` when scheduled market-price syncing is enabled
- `CORS_ORIGINS`, `PORT`, and `NODE_ENV=production`
- `OTP_PROVIDER=firebase` in production
- `MARKET_PRICE_SYNC_ENABLED` and its `DATA_GOV_IN_*` settings as needed

Use five independent random JWT secrets of at least 32 characters. Production
startup rejects missing/weak/duplicate JWT secrets, non-Firebase OTP, missing
required Cloudinary/Firebase credentials, and missing Data.gov API credentials
when market-price syncing is enabled. Set `CORS_ORIGINS` to a comma-separated
list of exact HTTPS frontend origins, without paths or wildcards.

The `.env.example` files contain development examples and empty secret slots;
copy neither real credentials nor production values into source control.

## Runtime and operations

- `/health` checks database connectivity and returns an unavailable response if
  the database is not reachable. It does not expose connection details.
- The API starts without waiting for the initial market-price sync. Check API
  logs/provider status for sync failures; the data.gov.in service can return
  upstream/proxy 500 errors independently of AgriConnect.
- The market-price cron has no distributed lock. Run one API replica with
  `MARKET_PRICE_SYNC_ENABLED=true`, or disable syncing on extra replicas and
  assign one scheduler owner.
- OTP cooldown/attempt limits and admin login lockout are application-side. The
  admin lockout and scheduled state are process-local. Configure an ingress or
  shared rate limiter for public auth endpoints before scaling horizontally.
- The deployment platform must terminate HTTPS and redirect HTTP to HTTPS. Do
  not enable Express/Nest trust-proxy behavior until the selected platform's
  trusted proxy ranges are known. Forwarded headers are not used as trusted
  client IPs by the current admin login handler.
- Farmer and admin access/refresh tokens currently use browser localStorage and
  Authorization headers. This preserves the existing auth architecture, but
  tokens remain exposed to successful same-origin script injection; retain
  dependency hygiene and do not add unsafe HTML rendering.

## Search and indexing

- The homepage is the current public, indexable site surface: `/en`, `/gu`, and
  `/hi`. The root `/` permanently redirects to `/en`.
- Dashboard, authentication, and admin pages are marked `noindex`; robots also
  disallows crawling those paths. The sitemap lists only the localized home
  pages because the application has no public detail pages for guides, schemes,
  marketplace listings, or market prices yet.
- Configure the actual `SITE_URL`, then verify ownership in Google Search
  Console. If using the HTML tag method, put Google's issued value in
  `GOOGLE_SITE_VERIFICATION`. Submit `https://<your-domain>/sitemap.xml`, inspect
  each localized homepage, and review coverage after deployment.
- Choose one canonical host (www or non-www) in DNS and hosting, and configure
  its redirect there. Search Console verification, DNS, domain redirects, live
  sitemap retrieval, and Google indexing require production verification.

## Production verification still required

Before opening the site to users, verify the selected host's TLS, environment
values, database connectivity/migrations, Cloudinary uploads, Firebase OTP
delivery, exact CORS behavior, proxy/rate-limit configuration, market-price
provider access, and all farmer/admin flows. Run Search Console ownership and
sitemap checks against the real domain. These cannot be validated from this
workspace without the real deployment environment and credentials.
