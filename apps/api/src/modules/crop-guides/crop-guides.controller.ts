import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '../authentication/decorators/public.decorator';
import { CropGuidesService } from './crop-guides.service';
import { QueryCropGuidesDto } from './dto/query-crop-guides.dto';

@Controller('crop-guides')
export class CropGuidesController {
  constructor(private readonly cropGuidesService: CropGuidesService) {}

  @Public()
  @Get()
  findAll(@Query() query: QueryCropGuidesDto) {
    return this.cropGuidesService.findAll(query);
  }

  @Public()
  @Get(':slug')
  findOne(@Param('slug') slug: string, @Query('locale') locale?: string) {
    return this.cropGuidesService.findOne(slug, locale);
  }
}
