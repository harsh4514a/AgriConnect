# 🌱 AgriConnect — Smart Agricultural Marketplace

**Connecting Farmers Directly with Buyers**

AgriConnect is a web-based agricultural marketplace designed to help farmers connect directly with potential buyers, discover nearby agricultural products, access market-yard prices, and find useful farming information.

The platform aims to reduce dependency on intermediaries, improve market accessibility, and make agricultural information easier to access through a responsive, multilingual experience.

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Project Architecture](#-project-architecture)
- [Repository Structure](#-repository-structure)
- [Prerequisites](#-prerequisites)
- [Installation and Setup](#-installation-and-setup)
- [Environment Configuration](#-environment-configuration)
- [Database Setup](#-database-setup)
- [Running the Application](#-running-the-application)
- [Available Scripts](#-available-scripts)
- [Deployment](#-deployment)
- [Security](#-security)
- [Contributing](#-contributing)
- [License](#-license)

## 🌾 Overview

Traditional agricultural markets can make it difficult for farmers to reach buyers directly and obtain useful, timely information about crop prices and farming practices.

AgriConnect provides a digital platform where farmers can publish agricultural listings, buyers can discover available produce or post their requirements, and users can access agricultural resources in one place.

The application is designed as a responsive website with Progressive Web App (PWA) capabilities and multilingual support.

## ✨ Key Features

### 1. Authentication and User Profiles
- Mobile-number-based OTP authentication.
- User registration and profile management.
- Location information associated with user profiles.

### 2. Agricultural Marketplace
- Publish and browse agricultural product listings.
- View product and seller information.
- Discover available produce and contact sellers directly.

### 3. Nearby Listings
- Discover agricultural products around a selected location.
- Filter listings based on location and distance where supported.

### 4. Market-Yard Prices
- Retrieve agricultural market-price data from the Data.gov.in API.
- Store and manage market-price records in PostgreSQL.
- Synchronize available data for Gujarat.
- Display price information for supported commodities and markets.

### 5. Crop Guide
- Browse agricultural crop information.
- Search and filter crop guides.
- Access localized crop-guide content in supported languages.

### 6. Buyer Requirements
- Allow buyers to publish crop requirements.
- Specify the crop, quantity, unit, location, and optional details.
- Enable farmers to discover requirements and contact buyers directly.

### 7. Government Schemes
- Browse information about agricultural government schemes.
- Access scheme information through the supported application interface.

### 8. Seasonal Crop Calendar
- Access seasonal crop-planning information to support agricultural decisions.

### 9. Transport Directory
- Discover available agricultural transport services.
- View transporter contact information and vehicle details where provided.
- Contact service providers directly by phone.

### 10. Multilingual Interface
- Internationalization using `next-intl`.
- Support for English, Hindi, and Gujarati in implemented application areas.

### 11. Progressive Web App
- Responsive experience across desktop and mobile devices.
- PWA support for compatible browsers and devices.

### 12. Administration
- Dedicated administrator authentication and dashboard.
- User-management capabilities.
- Marketplace-management capabilities.
- Administrative tools for supported platform operations.

> Feature availability may vary by module and deployment configuration.

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript |
| Styling | Tailwind CSS, Radix UI, Lucide React |
| Internationalization | next-intl |
| Forms and Validation | React Hook Form, Zod |
| State Management | Zustand |
| Backend | NestJS, TypeScript, Node.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | JWT-based authentication and mobile OTP workflow |
| Image Management | Cloudinary |
| Maps | Leaflet, OpenStreetMap |
| Government Data | Data.gov.in API |
| Monorepo | pnpm workspaces, Turborepo |
| Frontend Deployment | Vercel |
| Backend Deployment | Render |

## 🏗️ Project Architecture

AgriConnect uses a monorepo architecture that separates the frontend, backend, and shared packages.

```text
                   ┌─────────────────────────┐
                   │       Web Browser       │
                   └────────────┬────────────┘
                                │
                                ▼
                   ┌─────────────────────────┐
                   │   Next.js Web Frontend  │
                   │       apps/web           │
                   └────────────┬────────────┘
                                │ HTTPS / REST
                                ▼
                   ┌─────────────────────────┐
                   │      NestJS API         │
                   │       apps/api           │
                   └──────┬──────────┬───────┘
                          │          │
                          ▼          ▼
                  ┌────────────┐  ┌────────────────┐
                  │ PostgreSQL │  │ External APIs  │
                  │  Prisma    │  │ Data.gov.in    │
                  └────────────┘  │ Cloudinary     │
                                  └────────────────┘
```

### Architecture Highlights

- **Frontend:** Renders the user interface and communicates with the backend API.
- **Backend:** Implements application logic, authentication, marketplace features, and data access.
- **Database:** Stores application data using PostgreSQL and Prisma.
- **Shared packages:** Reuse code and configuration across applications.
- **External services:** Provide market-price data and image-management functionality.

## 📁 Repository Structure

```text
AgriConnect/
├── apps/
│   ├── api/                 # NestJS backend
│   │   ├── prisma/          # Prisma schema, migrations and seeds
│   │   ├── src/             # API modules and business logic
│   │   ├── .env.example     # Backend environment template
│   │   └── package.json
│   │
│   └── web/                 # Next.js frontend
│       ├── src/             # Frontend application
│       ├── .env.example     # Frontend environment template
│       └── package.json
│
├── packages/
│   ├── config/              # Shared configuration
│   ├── types/               # Shared types
│   ├── ui/                  # Shared UI package
│   └── ...                  # Other shared workspace packages
│
├── .env.example             # Root environment template
├── package.json             # Root scripts and workspace configuration
├── pnpm-workspace.yaml      # pnpm workspace configuration
├── pnpm-lock.yaml           # Dependency lockfile
├── turbo.json               # Turborepo configuration
└── README.md
```

The exact contents of individual directories may evolve as the project develops.

## 💻 Prerequisites

Install the following software before starting development:

- **Node.js:** Version 20 or newer.
- **pnpm:** Version 9.15.9.
- **PostgreSQL:** A running local instance or a reachable PostgreSQL database.
- **Git:** To clone and manage the repository.

Verify your installations:

```bash
node --version
pnpm --version
git --version
psql --version
```

If pnpm is not installed or does not match the required version, enable Corepack where supported:

```bash
corepack enable
corepack prepare pnpm@9.15.9 --activate
```

## 🚀 Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/harsh4514a/AgriConnect.git
cd AgriConnect
```

### 2. Install Dependencies

Run the command from the repository root:

```bash
pnpm install
```

This installs dependencies for the workspace applications and shared packages.

### 3. Configure Environment Variables

The repository contains environment example files. Copy the relevant templates to create your local environment files.

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Review each file and replace example values with your local configuration.

**Important:** Never commit actual API keys, database passwords, JWT secrets, or private credentials.

See [Environment Configuration](#-environment-configuration) for the purpose of each environment file.

## ⚙️ Environment Configuration

AgriConnect uses separate environment configurations for the root workspace, backend, and frontend.

| File | Purpose |
|---|---|
| `.env` | Root workspace settings |
| `apps/api/.env` | Backend, database, authentication and server-side integrations |
| `apps/web/.env` | Frontend configuration and public API settings |

Use the corresponding `.env.example` file in the codebase as the source of truth for required variables and their intended format.

### Important Configuration Areas

- **Database:** PostgreSQL connection string used by Prisma.
- **Authentication:** Unique JWT secrets and the configured OTP provider.
- **Cloudinary:** Server-side credentials for image management.
- **Market prices:** Data.gov.in API configuration and synchronization settings.
- **Frontend:** Canonical site URL and backend API URL.
- **CORS:** Allowed frontend origins configured by the backend.

Frontend variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Never put private credentials in these variables.

The mock OTP provider is intended for development and does not send SMS. Configure a real, correctly integrated SMS authentication provider for production authentication.

## 🗄️ Database Setup

AgriConnect uses PostgreSQL with Prisma ORM.

### 1. Create a Database

Create a PostgreSQL database for local development, for example:

```sql
CREATE DATABASE agriconnect;
```

Ensure that the `DATABASE_URL` in `apps/api/.env` points to the correct database and includes any required connection parameters.

### 2. Generate the Prisma Client

From the repository root:

```bash
pnpm --filter @agri/api prisma:generate
```

### 3. Apply Database Migrations

For a database that already has the project's committed Prisma migrations:

```bash
pnpm --filter @agri/api db:migrate:deploy
```

This applies pending migrations; it does not create a new migration from schema changes.

For local development, if you intentionally need to create a migration after changing the Prisma schema, use Prisma's development migration workflow from the API workspace:

```bash
cd apps/api
pnpm exec prisma migrate dev --name describe_your_change
cd ../..
```

Review schema changes and migrations before applying them to a production database. Back up important data before any database operation that could alter or remove it.

### 4. Optional Database Seeds

The API package provides the following seed-related scripts:

```bash
pnpm --filter @agri/api db:seed
pnpm --filter @agri/api db:seed-admin
pnpm --filter @agri/api db:seed-crop-guides
pnpm --filter @agri/api db:seed-government-schemes
```

Run only the seeds you need. Check the corresponding seed implementation and required environment variables before running administrator or content seeds.

## ▶️ Running the Application

### Start the Full Workspace

From the repository root:

```bash
pnpm dev
```

The root script runs the workspace development tasks through Turborepo. Check the application logs for the actual ports and startup status.

### Start the Backend Separately

Open a terminal at the repository root:

```bash
pnpm --filter @agri/api dev
```

The backend defaults to port `3001` unless overridden by its configuration.

### Start the Frontend Separately

Open another terminal:

```bash
pnpm --filter @agri/web dev
```

The Next.js development server normally runs at:

**http://localhost:3000**

Make sure the frontend API URL points to the backend address and the backend permits requests from the frontend origin.

## 🧰 Available Scripts

### Root Workspace

Run these from the repository root.

| Command | Purpose |
|---|---|
| `pnpm install` | Install workspace dependencies |
| `pnpm dev` | Run workspace development tasks |
| `pnpm build` | Build workspace applications and packages |
| `pnpm lint` | Run workspace lint tasks |
| `pnpm typecheck` | Run workspace TypeScript checks |
| `pnpm test` | Run available workspace test tasks |
| `pnpm format` | Format files with Prettier |

### Backend — `@agri/api`

| Command | Purpose |
|---|---|
| `pnpm --filter @agri/api dev` | Start NestJS in watch mode |
| `pnpm --filter @agri/api build` | Build the backend |
| `pnpm --filter @agri/api start` | Start the compiled backend |
| `pnpm --filter @agri/api lint` | Run backend linting |
| `pnpm --filter @agri/api typecheck` | Run backend type checks |
| `pnpm --filter @agri/api prisma:generate` | Generate Prisma Client |
| `pnpm --filter @agri/api db:migrate:deploy` | Apply pending migrations |
| `pnpm --filter @agri/api prisma:studio` | Open Prisma Studio |
| `pnpm --filter @agri/api db:seed` | Run the configured Prisma seed |

### Frontend — `@agri/web`

| Command | Purpose |
|---|---|
| `pnpm --filter @agri/web dev` | Start the Next.js development server |
| `pnpm --filter @agri/web build` | Build the frontend |
| `pnpm --filter @agri/web start` | Start the production server |
| `pnpm --filter @agri/web lint` | Run frontend linting |
| `pnpm --filter @agri/web typecheck` | Run frontend type checks |

## ☁️ Deployment

AgriConnect uses a separate deployment for the frontend and backend.

### Frontend — Vercel

1. Import the GitHub repository into Vercel.
2. Configure the project for the monorepo's `apps/web` application.
3. Set the required frontend environment variables using `apps/web/.env.example` as the reference.
4. Configure the production API URL and canonical site URL.
5. Deploy and verify the build output.

The production API URL must point to the deployed NestJS backend, not `localhost`.

### Backend — Render

1. Create a web service connected to the GitHub repository.
2. Configure the service to use the `apps/api` application within the pnpm monorepo.
3. Install workspace dependencies from the repository root so that shared workspace packages resolve correctly.
4. Configure the backend environment variables using `apps/api/.env.example` as the reference.
5. Ensure the production database is reachable and Prisma migrations have been applied.
6. Configure the service to listen on the port supplied by Render.
7. Deploy and review the service logs.

The backend needs valid production secrets, CORS configuration, database access, and credentials for any enabled external integrations.

### Production Checklist

- [ ] Configure all required production environment variables.
- [ ] Use a production PostgreSQL database.
- [ ] Apply Prisma migrations.
- [ ] Use unique, strong JWT secrets.
- [ ] Configure the production frontend origin in CORS.
- [ ] Use HTTPS URLs for deployed services.
- [ ] Configure the OTP provider correctly for real SMS delivery.
- [ ] Verify Cloudinary and market-price integrations.
- [ ] Check frontend and backend logs after deployment.
- [ ] Never expose private environment values in logs or public repositories.

## 🔐 Security

- Never commit `.env` files containing real secrets.
- Keep `.env.example` files populated with placeholders, not production credentials.
- Use different, strong JWT secrets for each token purpose.
- Restrict CORS to trusted frontend origins.
- Keep server-side API keys and Cloudinary secrets on the backend.
- Do not log real users' OTPs in public production logs.
- Validate and sanitize incoming user data.
- Use secure HTTPS connections for deployed services.
- Back up production data before migrations or database maintenance.

## 🤝 Contributing

Contributions and suggestions are welcome.

1. Fork the repository.
2. Create a feature branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. Make your changes following the existing project structure.
4. Run relevant checks:

   ```bash
   pnpm lint
   pnpm typecheck
   pnpm build
   ```

5. Commit your changes with a clear message:

   ```bash
   git add .
   git commit -m "feat: describe your change"
   ```

6. Push your branch and open a pull request.

Avoid committing generated files, private credentials, local database dumps, or unrelated changes.
