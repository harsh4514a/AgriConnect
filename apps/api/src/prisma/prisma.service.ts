import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to PostgreSQL database');
    } catch {
      if (process.env.NODE_ENV === 'production') {
        this.logger.error(
          'Database connection failed during startup. The API cannot serve requests without the database.',
        );
        throw new Error(
          'Database connection failed. Check database availability and DATABASE_URL configuration.',
        );
      }

      this.logger.warn(
        'Could not connect to PostgreSQL database. The app will still run, but database features will be unavailable.',
      );
      this.logger.warn(
        'Make sure PostgreSQL is running and the DATABASE_URL env variable is configured correctly.',
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.$disconnect();
      this.logger.log('Disconnected from PostgreSQL database');
    } catch {
      // ignore disconnect errors
    }
  }

  /**
   * Ensures the database connection is available before executing queries.
   * Safe to call even if the connection was never established.
   */
  async isConnected(): Promise<boolean> {
    try {
      if (!this.$connect) return false;
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
