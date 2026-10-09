import { Module } from '@nestjs/common';
import { CropGuidesController } from './crop-guides.controller';
import { CropGuidesService } from './crop-guides.service';

@Module({
  controllers: [CropGuidesController],
  providers: [CropGuidesService],
  exports: [CropGuidesService],
})
export class CropGuidesModule {}
