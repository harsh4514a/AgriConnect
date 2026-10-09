# 🌾 AgriConnect — Complete A–Z Project Documentation

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Monorepo Structure](#3-monorepo-structure)
4. [Prisma Database Schema (All Models)](#4-prisma-database-schema-all-models)
5. [Backend Architecture (NestJS)](#5-backend-architecture-nestjs)
6. [Frontend Architecture (Next.js 15)](#6-frontend-architecture-nextjs-15)
7. [Authentication Module — Complete Details](#7-authentication-module--complete-details)
8. [Environment Variables](#8-environment-variables)
9. [API Endpoints (Swagger)](#9-api-endpoints-swagger)
10. [Quick Setup Commands](#10-quick-setup-commands)
11. [Postman Testing Guide](#11-postman-testing-guide)
12. [Coding Standards & Naming Conventions](#12-coding-standards--naming-conventions)
13. [Git Workflow](#13-git-workflow)

---

## 1. Project Overview

**AgriConnect** is a Smart Agricultural Marketplace that connects farmers directly with buyers. It is built as a monorepo using **pnpm workspaces + Turborepo**.

---

## 2. Tech Stack

| Layer    | Technology                                                     |
| -------- | -------------------------------------------------------------- |
| Frontend | Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui + next-intl |
| Backend  | NestJS + Prisma ORM + PostgreSQL + JWT Authentication          |
| Map      | Leaflet + OpenStreetMap                                        |
| Media    | Cloudinary                                                     |
| State    | Zustand                                                        |
| Forms    | react-hook-form + zod                                          |
| HTTP     | Axios                                                          |
| Docs     | Swagger (OpenAPI)                                              |

---

## 3. Monorepo Structure

```
AgriConnect/
├── apps/
│   ├── web/                    # Next.js 15 Frontend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   └── [locale]/
│   │   │   │       ├── layout.tsx
│   │   │   │       ├── page.tsx
│   │   │   │       └── not-found.tsx
│   │   │   ├── styles/
│   │   │   │   └── globals.css
│   │   │   └── types/
│   │   │       └── css.d.ts
│   │   ├── next.config.mjs
│   │   ├── tailwind.config.ts
│   │   ├── postcss.config.mjs
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── api/                    # NestJS Backend
│       ├── prisma/
│       │   ├── schema.prisma          # <-- Database schema
│       │   └── migrations/            # <-- Auto-generated
│       ├── src/
│       │   ├── main.ts                # Bootstrap + Swagger + ValidationPipe
│       │   ├── app/
│       │   │   ├── app.module.ts
│       │   │   └── health/
│       │   │       └── health.controller.ts
│       │   ├── config/
│       │   │   ├── config.module.ts
│       │   │   └── config.service.ts
│       │   ├── prisma/
│       │   │   ├── prisma.module.ts
│       │   │   └── prisma.service.ts
│       │   └── modules/
│       │       └── authentication/    # <-- Auth Module
│       │           ├── auth.controller.ts
│       │           ├── auth.service.ts
│       │           ├── auth.module.ts
│       │           ├── dto/
│       │           │   ├── register.dto.ts
│       │           │   ├── login.dto.ts
│       │           │   └── refresh.dto.ts
│       │           ├── guards/
│       │           │   └── jwt-auth.guard.ts
│       │           ├── decorators/
│       │           │   ├── current-user.decorator.ts
│       │           │   └── public.decorator.ts
│       │           ├── strategies/
│       │           │   └── jwt.strategy.ts
│       │           └── interfaces/
│       │               ├── jwt-payload.interface.ts
│       │               └── auth-response.interface.ts
│       ├── .env
│       ├── tsconfig.json
│       └── package.json
├── packages/
│   ├── ui/                     # Shared UI components
│   │   ├── src/index.ts
│   │   └── package.json
│   ├── types/                  # Shared TypeScript types
│   │   ├── src/index.ts
│   │   └── package.json
│   └── config/                 # ESLint, Prettier, tsconfig presets
│       ├── src/index.ts
│       └── package.json
├── .husky/
│   ├── pre-commit
│   └── commit-msg
├── .editorconfig
├── .gitignore
├── .prettierrc
├── .commitlintrc.cjs
├── turbo.json
├── package.json                # Root workspace
├── pnpm-workspace.yaml
└── README.md
```

---

## 4. Prisma Database Schema (All Models)

```prisma
// apps/api/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ========== AUTHENTICATION MODULE ==========

// Registered user accounts
model User {
  id                String          @id @default(uuid()) @db.Uuid
  email             String          @unique @db.VarChar(255)
  passwordHash      String          @db.VarChar(255)
  fullName          String?         @db.VarChar(100)
  role              String          @default("farmer") @db.VarChar(20)
  mobileNumber      String?         @unique @db.VarChar(15)
  preferredLanguage String?         @default("english") @db.VarChar(20)
  stateId           String?         @db.Uuid
  districtId        String?         @db.Uuid
  talukaId          String?         @db.Uuid
  villageId         String?         @db.Uuid
  latitude          Float?
  longitude         Float?
  isVerified        Boolean         @default(false)
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  // Relationships
  state          State?          @relation(fields: [stateId], references: [id])
  district       District?       @relation(fields: [districtId], references: [id])
  taluka         Taluka?         @relation(fields: [talukaId], references: [id])
  village        Village?        @relation(fields: [villageId], references: [id])
  otps           Otp[]
  refreshTokens  RefreshToken[]

  @@index([email])
  @@index([mobileNumber])
  @@map("users")
}

// OTPs for authentication
model Otp {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @db.Uuid
  hashedOtp String   @db.VarChar(255)
  expiresAt DateTime
  attempts  Int      @default(0)
  isUsed    Boolean  @default(false)
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
  @@map("otps")
}

// JWT Refresh Tokens
model RefreshToken {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @db.Uuid
  token     String   @unique @db.VarChar(500)
  expiresAt DateTime
  isRevoked Boolean  @default(false)
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@map("refresh_tokens")
}

// ========== GEOGRAPHY MODELS (for location) ==========

model State {
  id        String     @id @default(uuid()) @db.Uuid
  name      String     @unique @db.VarChar(100)
  districts District[]
  users     User[]
  @@map("states")
}

model District {
  id      String   @id @default(uuid()) @db.Uuid
  stateId String   @db.Uuid
  name    String   @db.VarChar(100)
  state   State    @relation(fields: [stateId], references: [id], onDelete: Cascade)
  talukas Taluka[]
  users   User[]
  @@unique([stateId, name])
  @@index([stateId])
  @@map("districts")
}

model Taluka {
  id         String   @id @default(uuid()) @db.Uuid
  districtId String   @db.Uuid
  name       String   @db.VarChar(100)
  district   District @relation(fields: [districtId], references: [id], onDelete: Cascade)
  villages   Village[]
  users      User[]
  @@unique([districtId, name])
  @@index([districtId])
  @@map("talukas")
}

model Village {
  id       String @id @default(uuid()) @db.Uuid
  talukaId String @db.Uuid
  name     String @db.VarChar(100)
  taluka   Taluka @relation(fields: [talukaId], references: [id], onDelete: Cascade)
  users    User[]
  @@unique([talukaId, name])
  @@index([talukaId])
  @@map("villages")
}
```

**Database Tables:**

| Table            | Description                      |
| ---------------- | -------------------------------- |
| `users`          | User accounts (farmer/buyer)     |
| `otps`           | One-time passwords for auth      |
| `refresh_tokens` | JWT refresh tokens (hashed)      |
| `states`         | Indian states                    |
| `districts`      | Districts within states          |
| `talukas`        | Talukas/Tehsils within districts |
| `villages`       | Villages within talukas          |

---

## 5. Backend Architecture (NestJS)

### Design Pattern: Module-based Clean Architecture

```
src/
├── main.ts                    # Entry point (Swagger, CORS, ValidationPipe)
├── app/
│   ├── app.module.ts          # Root module (imports Config, Prisma, Auth)
│   └── health/
│       └── health.controller.ts  # GET /health
├── config/
│   ├── config.module.ts       # Global config provider
│   └── config.service.ts      # Reads process.env
├── prisma/
│   ├── prisma.module.ts       # Global Prisma provider
│   └── prisma.service.ts      # Prisma client (connects to PostgreSQL)
└── modules/
    └── authentication/        # Auth module (module-based)
        ├── auth.module.ts     # Wires Passport + JWT + Prisma + Config
        ├── auth.controller.ts # REST controller (5 endpoints)
        ├── auth.service.ts    # Business logic (register, login, refresh, logout, profile)
        ├── dto/               # Request validation DTOs
        ├── guards/            # JWT auth guard
        ├── decorators/        # @Public(), @CurrentUser()
        ├── strategies/        # Passport JWT strategy
        └── interfaces/        # TypeScript interfaces
```

### Key Files Content

#### `main.ts`

```typescript
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('AgriConnect API')
    .setDescription('Smart Agricultural Marketplace API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);
}
bootstrap();
```

#### `config.service.ts`

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  get(key: string): string | undefined {
    return process.env[key];
  }

  getOrThrow(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Environment variable "${key}" is not defined`);
    }
    return value;
  }
}
```

#### `prisma.service.ts`

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Successfully connected to PostgreSQL database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

---

## 6. Frontend Architecture (Next.js 15)

```
apps/web/src/
├── app/
│   └── [locale]/              # next-intl locale routing
│       ├── layout.tsx         # Root layout (locale-based)
│       ├── page.tsx           # Home page
│       └── not-found.tsx      # 404 page
├── styles/
│   └── globals.css            # Tailwind + shadcn CSS variables
├── types/
│   └── css.d.ts               # CSS module types
└── lib/                       # (future: API client, i18n config, utils)
```

---

## 7. Authentication Module — Complete Details

### 1. `auth.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '@/prisma/prisma.module';
import { ConfigModule } from '@/config/config.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    PrismaModule,
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  exports: [AuthService, JwtStrategy, JwtAuthGuard, PassportModule],
})
export class AuthModule {}
```

### 2. `auth.controller.ts` — 5 Endpoints

```typescript
import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user (farmer or buyer)' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user with email and password' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using a valid refresh token' })
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user and revoke refresh token' })
  async logout(@CurrentUser('id') userId: string, @Body() dto?: RefreshDto) {
    await this.authService.logout(userId, dto?.refreshToken);
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the profile of the authenticated user' })
  async profile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }
}
```

### 3. `auth.service.ts` — Business Logic (register, login, refresh, logout, profile)

```typescript
import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '@/prisma/prisma.service';
import { ConfigService } from '@/config/config.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) throw new ConflictException('A user with this email already exists');

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName ?? null,
        role: dto.role,
        mobileNumber: dto.mobileNumber ?? null,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isVerified: user.isVerified,
      },
      tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid email or password');

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isVerified: user.isVerified,
      },
      tokens,
    };
  }

  async refresh(dto: RefreshDto) {
    const candidateTokens = await this.prisma.refreshToken.findMany({
      where: { isRevoked: false, expiresAt: { gt: new Date() } },
      include: { user: true },
    });

    let matchedToken = null;
    for (const candidate of candidateTokens) {
      const isMatch = await bcrypt.compare(dto.refreshToken, candidate.token);
      if (isMatch) {
        matchedToken = candidate;
        break;
      }
    }
    if (!matchedToken) throw new UnauthorizedException('Invalid or revoked refresh token');

    // Revoke old token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: matchedToken.id },
      data: { isRevoked: true },
    });

    return this.generateTokens(
      matchedToken.user.id,
      matchedToken.user.email,
      matchedToken.user.role,
    );
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { userId, token: refreshToken, isRevoked: false },
        data: { isRevoked: true },
      });
    } else {
      await this.prisma.refreshToken.updateMany({
        where: { userId, isRevoked: false },
        data: { isRevoked: true },
      });
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        mobileNumber: true,
        preferredLanguage: true,
        isVerified: true,
        createdAt: true,
        state: { select: { name: true } },
        district: { select: { name: true } },
        taluka: { select: { name: true } },
        village: { select: { name: true } },
      },
    });
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow('JWT_ACCESS_SECRET'),
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: { userId, token: hashedRefreshToken, expiresAt },
    });

    return { accessToken, refreshToken };
  }
}
```

### 4. `register.dto.ts` — Input Validation

```typescript
import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  IsMobilePhone,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  FARMER = 'farmer',
  BUYER = 'buyer',
}

export class RegisterDto {
  @ApiProperty({ example: 'farmer@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({ example: 'SecurePass@123' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(100)
  password: string;

  @ApiProperty({ example: 'Ramesh Kumar', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  fullName?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.FARMER })
  @IsEnum(UserRole, { message: 'Role must be either farmer or buyer' })
  role: UserRole;

  @ApiProperty({ example: '+919876543210', required: false })
  @IsString()
  @IsOptional()
  @IsMobilePhone('en-IN', {}, { message: 'Please provide a valid Indian mobile number' })
  mobileNumber?: string;
}
```

### 5. `login.dto.ts`

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'farmer@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({ example: 'SecurePass@123' })
  @IsString()
  @MinLength(1, { message: 'Password is required' })
  password: string;
}
```

### 6. `refresh.dto.ts`

```typescript
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshDto {
  @ApiProperty({ description: 'Valid refresh token issued at login' })
  @IsString()
  refreshToken: string;
}
```

### 7. `jwt.strategy.ts`

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '@/prisma/prisma.service';
import { ConfigService } from '@/config/config.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException('User not found');
    return { id: user.id, email: user.email, role: user.role };
  }
}
```

### 8. `jwt-auth.guard.ts`

```typescript
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
```

### 9. `public.decorator.ts`

```typescript
import { SetMetadata } from '@nestjs/common';
export const Public = () => SetMetadata('isPublic', true);
```

### 10. `current-user.decorator.ts`

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
```

### 11. Interfaces

```typescript
// jwt-payload.interface.ts
export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

// auth-response.interface.ts
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName: string | null;
    role: string;
    isVerified: boolean;
  };
  tokens: AuthTokens;
}
```

### Security Features Implemented

- ✅ Passwords hashed with **bcryptjs** (12 salt rounds)
- ✅ Refresh tokens hashed with **bcrypt** (10 rounds) before DB storage
- ✅ **Token rotation**: old refresh token revoked on refresh
- ✅ JWT `sub` validated against existing user in database
- ✅ Access token expires in **15 minutes**
- ✅ Refresh token expires in **7 days**
- ✅ Class-validator input validation on all DTOs
- ✅ `UnauthorizedException` for invalid/expired/revoked tokens
- ✅ Global `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, `transform`
- ✅ Swagger documented with `@ApiBearerAuth()`
- ✅ `@Public()` decorator to skip auth on specific endpoints

---

## 8. Environment Variables

### Root `.env.example`

```env
NODE_ENV=development
TURBO_TEAM=agriconnect
```

### Backend `apps/api/.env`

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agriconnect
JWT_ACCESS_SECRET=6xNSG1sPtDDNKhzy9TWpVhWqJ6dXFukN62TBS/FStADeJTkgHh6c1/D2vU4kPe76nb2E33mLTxOCChhS1nGioQ==
JWT_REFRESH_SECRET=46/6DzfSG6ilJjJlJDJwczIbhxGmpx9GOSfZQpObXHDNxgbwaBQgQP8AS7vqGGZSgW3iCtSdZ9XNKHG9c46dTw==
PORT=3001
NODE_ENV=development
```

### Frontend `apps/web/.env` (future)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 9. API Endpoints (Swagger)

| Method | Endpoint         | Auth Required | Description                      |
| ------ | ---------------- | ------------- | -------------------------------- |
| GET    | `/health`        | ❌            | Health check                     |
| POST   | `/auth/register` | ❌            | Register new user (farmer/buyer) |
| POST   | `/auth/login`    | ❌            | Login with email + password      |
| POST   | `/auth/refresh`  | ❌            | Refresh access token             |
| POST   | `/auth/logout`   | ✅ Bearer JWT | Revoke refresh token(s)          |
| GET    | `/auth/profile`  | ✅ Bearer JWT | Get authenticated user profile   |

**Swagger UI:** http://localhost:3001/api

---

## 10. Quick Setup Commands

### Prerequisites

```bash
# Install pnpm (if not installed)
npm install -g pnpm

# Start PostgreSQL
brew services start postgresql@15

# Create database
psql -d postgres -c "CREATE DATABASE agriconnect;"
```

### Install Dependencies

```bash
# From repo root
cd /Users/harshgondaliya/Documents/B/7th\ Sem/SGP/AgriConnect
pnpm install
```

### Setup Backend Environment

```bash
# Create .env file
cat > apps/api/.env << 'EOF'
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agriconnect
JWT_ACCESS_SECRET=6xNSG1sPtDDNKhzy9TWpVhWqJ6dXFukN62TBS/FStADeJTkgHh6c1/D2vU4kPe76nb2E33mLTxOCChhS1nGioQ==
JWT_REFRESH_SECRET=46/6DzfSG6ilJjJlJDJwczIbhxGmpx9GOSfZQpObXHDNxgbwaBQgQP8AS7vqGGZSgW3iCtSdZ9XNKHG9c46dTw==
PORT=3001
NODE_ENV=development
EOF
```

### Run Prisma Migrations

```bash
cd apps/api
pnpm prisma migrate dev --name init_auth
```

### Generate Prisma Client

```bash
pnpm prisma generate
```

### Type Check (should show 0 errors)

```bash
npx tsc --noEmit
```

### Start Backend Server

```bash
cd apps/api
pnpm run dev
```

### Start Frontend (separate terminal)

```bash
cd apps/web
pnpm run dev
```

### Prisma Studio (optional, DB browser)

```bash
cd apps/api
pnpm prisma studio
```

Opens at: **http://localhost:5555**

### Reset Database (if needed)

```bash
psql -d postgres -c "DROP DATABASE IF EXISTS agriconnect;"
psql -d postgres -c "CREATE DATABASE agriconnect;"
cd apps/api
pnpm prisma migrate dev --name init_auth
pnpm run dev
```

---

## 11. Postman Testing Guide

### Test Sequence

#### 1️⃣ Register a Farmer

```
POST http://localhost:3001/auth/register
Content-Type: application/json

{
  "email": "farmer1@test.com",
  "password": "Test@123",
  "fullName": "Rajesh Kumar",
  "role": "farmer",
  "mobileNumber": "+919876543210"
}
```

✅ **Expected:** `201 Created` with `user` + `tokens`

#### 2️⃣ Login

```
POST http://localhost:3001/auth/login
Content-Type: application/json

{
  "email": "farmer1@test.com",
  "password": "Test@123"
}
```

✅ **Expected:** `200 OK` with `user` + `tokens`

#### 3️⃣ Get Profile (authenticated)

```
GET http://localhost:3001/auth/profile
Authorization: Bearer <access_token_from_login>
```

✅ **Expected:** `200 OK` with user profile

#### 4️⃣ Refresh Token

```
POST http://localhost:3001/auth/refresh
Content-Type: application/json

{
  "refreshToken": "<refresh_token_from_login>"
}
```

✅ **Expected:** `200 OK` with new `accessToken` + `refreshToken`

#### 5️⃣ Logout

```
POST http://localhost:3001/auth/logout
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "refreshToken": "<refresh_token_to_revoke>"
}
```

✅ **Expected:** `200 OK` — `{ "message": "Logged out successfully" }`

---

## 12. Coding Standards & Naming Conventions

| Item                | Convention                                                  |
| ------------------- | ----------------------------------------------------------- |
| **Folders**         | `kebab-case` (e.g., `auth-guard`, `jwt.strategy`)           |
| **Files**           | `kebab-case` (e.g., `auth.service.ts`, `jwt-auth.guard.ts`) |
| **Classes**         | `PascalCase` (e.g., `AuthService`, `JwtAuthGuard`)          |
| **Interfaces**      | `PascalCase` (e.g., `JwtPayload`, `AuthResponse`)           |
| **DTOs**            | `PascalCase` + `.dto.ts` suffix                             |
| **Enums**           | `PascalCase` (e.g., `UserRole`)                             |
| **Constants**       | `UPPER_SNAKE_CASE`                                          |
| **Variables**       | `camelCase`                                                 |
| **Functions**       | `camelCase`                                                 |
| **API Routes**      | `kebab-case` (e.g., `/auth/register`, `/auth/refresh`)      |
| **Database Tables** | `snake_case` (e.g., `users`, `refresh_tokens`)              |
| **Database Fields** | `camelCase` in Prisma -> `snake_case` in DB via `@map()`    |
| **Commit Messages** | Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`    |

---

## 13. Git Workflow

### Branch Strategy

```
main               # Production-ready code
├── develop        # Development branch
│   ├── feature/authentication   # Feature branches
│   ├── feature/marketplace
│   └── bugfix/xxx
```

### Commit Convention (Conventional Commits)

```
feat: add user registration endpoint
fix: correct password validation regex
chore: update dependencies
docs: add API documentation
refactor: extract JWT generation to service
```

### Husky + lint-staged

- **pre-commit:** Runs `eslint --fix` + `prettier --write` on staged files
- **commit-msg:** Validates commit message against Conventional Commits via `commitlint`

### Recommended Workflow

```bash
# Start new feature
git checkout -b feature/authentication

# Make changes + commit
git add .
git commit -m "feat: add authentication module with JWT"

# Push and create PR
git push origin feature/authentication
# Open PR → merge to develop → merge to main
```

---

## 🎯 Summary: What Is Built (Module 1: Authentication)

### ✅ Backend API (NestJS)

- [x] 5 REST endpoints: register, login, refresh, logout, profile
- [x] JWT access/refresh token flow with rotation
- [x] bcrypt password hashing (12 rounds)
- [x] bcrypt refresh token hashing (10 rounds)
- [x] Input validation via class-validator
- [x] Swagger documentation with Bearer auth
- [x] Global ValidationPipe
- [x] Prisma ORM with PostgreSQL
- [x] Database migrations: 7 tables (users, otps, refresh_tokens, states, districts, talukas, villages)
- [x] TypeScript: 0 errors in `tsc --noEmit`
- [x] Server runs on port 3001

### ✅ Frontend UI (Next.js 15)

- [x] Basic project scaffolding
- [x] next-intl locale routing (en, hi)
- [x] Tailwind CSS setup
- [x] shadcn/ui compatible CSS variables
- [x] Home page with responsive layout
- [ ] ❌ **Authentication UI pages (login, register) — NOT YET BUILT**

### ✅ Tooling

- [x] pnpm workspaces monorepo
- [x] Turborepo pipeline
- [x] ESLint + Prettier
- [x] Husky + lint-staged + commitlint
- [x] `.editorconfig`
- [x] `.gitignore`
- [x] Path aliases (`@/`, `@agri/*`)

---

## 🔮 What's Next (Future Modules)

| #   | Module                  | Status      |
| --- | ----------------------- | ----------- |
| 1   | Authentication (API)    | ✅ Complete |
| 2   | Authentication (UI)     | 🔜 Next     |
| 3   | Marketplace             | ⏳          |
| 4   | Nearby Listings         | ⏳          |
| 5   | Market Prices           | ⏳          |
| 6   | Crop Information        | ⏳          |
| 7   | Seasonal Crop Calendar  | ⏳          |
| 8   | Government Schemes      | ⏳          |
| 9   | Buyer Requirement Board | ⏳          |
| 10  | Transport Directory     | ⏳          |
| 11  | Agri Shop Directory     | ⏳          |
| 12  | Multi-language          | ⏳          |
| 13  | Notifications           | ⏳          |
| 14  | Farmer Dashboard        | ⏳          |
| 15  | Admin Dashboard         | ⏳          |
# AgriConnect
