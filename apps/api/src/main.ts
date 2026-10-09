import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';

import { AppModule } from './app/app.module';

const DEVELOPMENT_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000'];

function getAllowedCorsOrigins(): Set<string> {
  const isProduction = process.env.NODE_ENV === 'production';
  const configuredOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (isProduction && configuredOrigins.length === 0) {
    throw new Error('CORS_ORIGINS must list the production frontend origin.');
  }

  const origins = isProduction
    ? configuredOrigins
    : [...DEVELOPMENT_ORIGINS, ...configuredOrigins];

  return new Set(
    origins.map((value) => {
      if (value === '*') {
        throw new Error('CORS_ORIGINS cannot contain a wildcard origin.');
      }

      let parsed: URL;
      try {
        parsed = new URL(value);
      } catch {
        throw new Error('CORS_ORIGINS must contain valid absolute origins.');
      }

      const normalizedInput = value.endsWith('/') ? value.slice(0, -1) : value;
      if (parsed.origin !== normalizedInput) {
        throw new Error('CORS_ORIGINS entries must contain only scheme, host, and port.');
      }

      if (isProduction) {
        const localHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]']);
        if (parsed.protocol !== 'https:' || localHosts.has(parsed.hostname.toLowerCase())) {
          throw new Error('Production CORS_ORIGINS must use HTTPS public origins.');
        }
      }

      return parsed.origin;
    }),
  );
}

function validateProductionEnvironment(): void {
  if (process.env.NODE_ENV !== 'production') return;

  const required = [
    'DATABASE_URL',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'JWT_REGISTRATION_SECRET',
    'JWT_ADMIN_ACCESS_SECRET',
    'JWT_ADMIN_REFRESH_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ];

  if ((process.env.MARKET_PRICE_SYNC_ENABLED ?? 'true').trim().toLowerCase() !== 'false') {
    required.push('DATA_GOV_IN_API_KEY');
  }

  const missing = required.filter((name) => !process.env[name]?.trim());
  if (missing.length > 0) {
    throw new Error(`Missing production environment variables: ${missing.join(', ')}`);
  }

  if (process.env.OTP_PROVIDER?.trim().toLowerCase() !== 'firebase') {
    throw new Error('OTP_PROVIDER must be set to firebase in production.');
  }

  const firebaseCredentials = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
  ];
  const missingFirebaseCredentials = firebaseCredentials.filter(
    (name) => !process.env[name]?.trim(),
  );
  if (missingFirebaseCredentials.length > 0) {
    throw new Error(
      `Missing production Firebase Admin variables: ${missingFirebaseCredentials.join(', ')}`,
    );
  }

  const jwtSecrets = [
    process.env.JWT_ACCESS_SECRET!,
    process.env.JWT_REFRESH_SECRET!,
    process.env.JWT_REGISTRATION_SECRET!,
    process.env.JWT_ADMIN_ACCESS_SECRET!,
    process.env.JWT_ADMIN_REFRESH_SECRET!,
  ];

  if (jwtSecrets.some((secret) => secret.length < 32)) {
    throw new Error('Production JWT secrets must each contain at least 32 characters.');
  }

  if (new Set(jwtSecrets).size !== jwtSecrets.length) {
    throw new Error('Each production JWT secret must be unique.');
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const isProduction = process.env.NODE_ENV === 'production';
  validateProductionEnvironment();

  const allowedOrigins = getAllowedCorsOrigins();
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.use((_request: Request, response: Response, next: NextFunction) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');

    if (isProduction) {
      response.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000',
      );
      response.setHeader(
        'Content-Security-Policy',
        "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
      );
    }

    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('AgriConnect API')
      .setDescription('Smart Agricultural Marketplace API')
      .setVersion('0.1.0')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api', app, document);
  }

  const rawPort = process.env.PORT ?? '3001';
  const port = Number(rawPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid TCP port number.');
  }

  app.enableShutdownHooks();
  const logger = new Logger('Bootstrap');
  await app.listen(port);
  logger.log(`Application is listening on port ${port}.`);
  if (!isProduction) logger.log(`Swagger documentation is available at /api.`);
}

void bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap');
  const message = error instanceof Error ? error.message : 'Unknown startup error';
  logger.error(`Application startup failed: ${message}`);
  process.exit(1);
});
