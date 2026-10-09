import { Module } from '@nestjs/common';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { ConfigModule } from '../../config/config.module';
import { AuthModule } from '../authentication/auth.module';
import { ListingImagesService } from './listing-images.service';


@Module({
  imports: [AuthModule, ConfigModule, NotificationsModule],
  controllers: [ListingsController],
  providers: [ListingsService, ListingImagesService],
  exports: [ListingsService],
})
export class ListingsModule {}
