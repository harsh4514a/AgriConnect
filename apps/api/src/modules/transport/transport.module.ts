import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { TransportController } from './transport.controller';
import { TransportService } from './transport.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [TransportController],
  providers: [TransportService],
})
export class TransportModule {}
