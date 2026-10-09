import { Module } from '@nestjs/common';
import { BuyerRequirementsController } from './buyer-requirements.controller';
import { BuyerRequirementsService } from './buyer-requirements.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [BuyerRequirementsController],
  providers: [BuyerRequirementsService],
  exports: [BuyerRequirementsService],
})
export class BuyerRequirementsModule {}
