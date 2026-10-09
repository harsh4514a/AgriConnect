import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '../authentication/decorators/public.decorator';
import { GovernmentSchemesService } from './government-schemes.service';
import { QueryGovernmentSchemesDto } from './dto/query-government-schemes.dto';

@Controller('government-schemes')
export class GovernmentSchemesController {
  constructor(private readonly service: GovernmentSchemesService) {}

  @Public()
  @Get()
  findAll(@Query() query: QueryGovernmentSchemesDto) {
    return this.service.findAll(query);
  }

  @Public()
  @Get(':slug')
  findOne(@Param('slug') slug: string, @Query('locale') locale?: string) {
    return this.service.findOne(slug, locale);
  }
}
