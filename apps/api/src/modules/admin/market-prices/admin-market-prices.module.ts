import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { AdminMarketPricesController } from './admin-market-prices.controller';
import { AdminMarketPricesService } from './admin-market-prices.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminMarketPricesController],
  providers: [AdminMarketPricesService],
  exports: [AdminMarketPricesService],
})
export class AdminMarketPricesModule {}
