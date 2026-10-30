# AgriConnect --- Smart Agricultural Marketplace

AgriConnect is a multilingual agricultural marketplace that connects
farmers directly with buyers. It helps farmers publish crop listings,
discover nearby produce, review market-yard prices, and access
agricultural resources.

**Live website:** https://agri-connect-opal.vercel.app/en/

## Table of Contents

-   [Features](#features)
-   [Technology Stack](#technology-stack)
-   [Project Structure](#project-structure)
-   [Prerequisites](#prerequisites)
-   [Local Setup](#local-setup)
-   [Environment Variables](#environment-variables)
-   [Database Setup](#database-setup)
-   [Run the Application](#run-the-application)
-   [Useful Commands](#useful-commands)
-   [Deployment](#deployment)
-   [Security](#security)
-   [Contributing](#contributing)
-   [License](#license)

## Features

-   Mobile-number OTP authentication and user profiles.
-   Agricultural marketplace for creating, browsing, and managing crop
    listings.
-   Nearby listings with location and distance-based discovery.
-   Market-yard price information through the configured data
    integration.
-   Buyer requirements for crop and quantity requests.
-   Crop guides and seasonal crop information.
-   Agricultural government scheme information.
-   Transport directory for discovering transport services.
-   English, Hindi, and Gujarati support in implemented areas.
-   Responsive, PWA-ready web experience.
-   Admin panel for supported administrative operations.

> Feature availability depends on the modules and integrations enabled
> in the deployed environment.

## Technology Stack

  -----------------------------------------------------------------------
  Area                                Technology
  ----------------------------------- -----------------------------------
  Frontend                            Next.js 15, React, TypeScript

  UI and styling                      Tailwind CSS, Radix UI /
                                      shadcn-based components, Lucide

  Internationalization                next-intl

  Backend                             NestJS, Node.js, TypeScript

  Database                            PostgreSQL

  ORM                                 Prisma

  Authentication                      Mobile OTP workflow and JWT

  Image management                    Cloudinary

  Maps                                Leaflet, OpenStreetMap

  Market data                         Data.gov.in integration

  Monorepo tooling                    pnpm workspaces, Turborepo

  Frontend hosting                    Vercel

  Backend hosting                     Render
  -----------------------------------------------------------------------

## Project Structure

``` text
AgriConnect/
├── apps/
│   ├── web/                 # Next.js frontend
│   └── api/                 # NestJS backend
├── packages/                # Shared workspace packages, if configured
├── docs/                    # Documentation, if present
├── scripts/                 # Project scripts, if present
├── package.json             # Root workspace scripts
├── pnpm-workspace.yaml      # pnpm workspace configuration
├── pnpm-lock.yaml           # Dependency lockfile
├── turbo.json               # Turborepo configuration
└── README.md
```

The exact contents of directories may evolve as the project develops.

## Prerequisites

-   **Node.js:** Node.js 20 or newer is the baseline stated in the
    supplied project documentation. Prefer the version specified by the
    repository's `engines` field or version file, if present.
-   **pnpm:** Version `9.15.9` is the version stated in the supplied
    project documentation.
-   **PostgreSQL:** A local instance or reachable hosted database.
-   **Git:** For source control.

Check installed versions:

``` bash
node --version
pnpm --version
git --version
psql --version
```

If Corepack is available:

``` bash
corepack enable
corepack prepare pnpm@9.15.9 --activate
```

## Local Setup

### 1. Clone the repository

``` bash
git clone https://github.com/harsh4514a/AgriConnect.git
cd AgriConnect
```

### 2. Install dependencies

Run from the repository root:

``` bash
pnpm install
```

### 3. Configure environment files

If these example files exist in your checkout, copy them:

``` bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

If an example file does not exist, inspect the current application
configuration rather than creating an empty environment file. Populate
the resulting files with your local values. See [Environment
Variables](#environment-variables).

## Environment Variables

The project may use separate environment files for the root workspace,
backend, and frontend.

  -----------------------------------------------------------------------
  File                                Intended use
  ----------------------------------- -----------------------------------
  `.env`                              Root-level tooling or shared
                                      configuration, if used

  `apps/api/.env`                     Backend, database, authentication,
                                      and server-side integrations

  `apps/web/.env`                     Frontend configuration and public
                                      API settings
  -----------------------------------------------------------------------

Use the checked-in `.env.example` files and the code that reads
environment variables as the source of truth. Variable names can change
between versions.

Typical configuration areas include: - PostgreSQL connection string used
by Prisma. - Backend port and frontend API base URL. - JWT secrets and
OTP configuration. - Cloudinary credentials. - Data.gov.in API key and
market-price synchronization settings. - Allowed frontend origins for
backend CORS. - Public website URL.

**Security:** Never commit real environment files, API keys, database
credentials, OTPs, or JWT secrets. Variables prefixed with
`NEXT_PUBLIC_` are exposed to the browser and must not contain private
credentials.

The development OTP flow may display OTP values in server logs or the
console, depending on the implementation. Do not treat this as
production SMS delivery. Production authentication requires a properly
configured SMS/OTP provider.

## Database Setup

AgriConnect uses PostgreSQL with Prisma.

### 1. Create a database

For a local PostgreSQL instance:

``` sql
CREATE DATABASE agriconnect;
```

Set the backend database connection string using the exact variable
expected by the Prisma configuration (commonly `DATABASE_URL`).

### 2. Generate Prisma Client

The existing project documentation identifies the API workspace as
`@agri/api`. Confirm that package name in `apps/api/package.json`.

``` bash
pnpm --filter @agri/api prisma:generate
```

Alternative direct Prisma CLI command, if the package script is not
defined:

``` bash
pnpm --dir apps/api exec prisma generate
```

### 3. Apply committed migrations

The existing project documentation lists this script; confirm it exists
in `apps/api/package.json`:

``` bash
pnpm --filter @agri/api db:migrate:deploy
```

Alternative direct Prisma CLI command:

``` bash
pnpm --dir apps/api exec prisma migrate deploy
```

### 4. Create a migration during development

After intentionally changing the Prisma schema:

``` bash
pnpm --dir apps/api exec prisma migrate dev --name describe_your_change
```

Review generated migration files before committing them.

### 5. Optional seed data

The supplied README lists these seed scripts. Run only those that exist
in the current API `package.json`, and inspect their implementations
first:

``` bash
pnpm --filter @agri/api db:seed
pnpm --filter @agri/api db:seed-admin
pnpm --filter @agri/api db:seed-crop-guides
pnpm --filter @agri/api db:seed-government-schemes
```

**Important:** Do not run `prisma migrate reset` on a database
containing data you need. Back up important data before migrations or
database maintenance.

## Run the Application

### Run the full workspace

From the repository root:

``` bash
pnpm dev
```

This requires a `dev` script in the root `package.json`. Check terminal
output for actual ports and startup status.

### Run the backend separately

``` bash
pnpm --filter @agri/api dev
```

### Run the frontend separately

``` bash
pnpm --filter @agri/web dev
```

The frontend is expected to run at:

``` text
http://localhost:3000
```

The backend port is determined by its configuration. Ensure the frontend
API URL points to the running backend and backend CORS permits the
frontend origin.

## Useful Commands

Run commands from the repository root unless stated otherwise.

### Workspace

  Command            Purpose
  ------------------ ------------------------------------------------------
  `pnpm install`     Install workspace dependencies
  `pnpm dev`         Run configured development tasks
  `pnpm build`       Build configured workspace packages and applications
  `pnpm lint`        Run configured lint tasks
  `pnpm typecheck`   Run configured TypeScript checks
  `pnpm test`        Run configured tests

These root commands require corresponding scripts in the root
`package.json` and task definitions in `turbo.json`.

### Frontend

  Command                           Purpose
  --------------------------------- ----------------------------------
  `pnpm --filter @agri/web dev`     Start Next.js development server
  `pnpm --filter @agri/web build`   Build frontend
  `pnpm --filter @agri/web start`   Start production frontend server

### Backend

  ---------------------------------------------------------------------------------
  Command                                       Purpose
  --------------------------------------------- -----------------------------------
  `pnpm --filter @agri/api dev`                 Start NestJS development server

  `pnpm --filter @agri/api build`               Build backend

  `pnpm --filter @agri/api start`               Start compiled backend

  `pnpm --filter @agri/api prisma:generate`     Generate Prisma Client

  `pnpm --filter @agri/api db:migrate:deploy`   Apply committed migrations

  `pnpm --filter @agri/api prisma:studio`       Open Prisma Studio, if configured
  ---------------------------------------------------------------------------------

Package-filter commands require the package names shown in the relevant
`package.json` files. Script commands require the named scripts to
exist. Inspect the current definitions:

``` bash
cat package.json
cat apps/web/package.json
cat apps/api/package.json
```

    public repositories.



