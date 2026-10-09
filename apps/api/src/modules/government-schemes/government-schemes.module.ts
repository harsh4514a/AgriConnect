import { Module } from '@nestjs/common';
import { GovernmentSchemesController } from './government-schemes.controller';
import { GovernmentSchemesService } from './government-schemes.service';

@Module({
  controllers: [GovernmentSchemesController],
  providers: [GovernmentSchemesService],
})
export class GovernmentSchemesModule {}
