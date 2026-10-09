import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getHealth() {
    if (!(await this.prisma.isConnected())) {
      throw new ServiceUnavailableException('Service is not ready');
    }

    return { status: 'ok' };
  }
}
