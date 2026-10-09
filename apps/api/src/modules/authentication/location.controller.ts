import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from './decorators/public.decorator';
import { LocationService } from './location.service';

@ApiTags('Locations')
@Public()
@Controller('locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get('states')
  @ApiOperation({ summary: 'Get all states' })
  @ApiResponse({ status: 200, description: 'List of states' })
  @ApiQuery({ name: 'locale', required: false, enum: ['en', 'gu', 'hi'] })
  async getStates(@Query('locale') locale?: string) {
    return this.locationService.getStates(locale);
  }

  @Get('districts')
  @ApiQuery({ name: 'stateId', required: true })
  @ApiOperation({ summary: 'Get districts by state' })
  @ApiResponse({ status: 200, description: 'List of districts' })
  @ApiQuery({ name: 'locale', required: false, enum: ['en', 'gu', 'hi'] })
  async getDistricts(@Query('stateId') stateId: string, @Query('locale') locale?: string) {
    return this.locationService.getDistricts(stateId, locale);
  }

  @Get('talukas')
  @ApiQuery({ name: 'districtId', required: true })
  @ApiOperation({ summary: 'Get talukas by district' })
  @ApiResponse({ status: 200, description: 'List of talukas' })
  @ApiQuery({ name: 'locale', required: false, enum: ['en', 'gu', 'hi'] })
  async getTalukas(@Query('districtId') districtId: string, @Query('locale') locale?: string) {
    return this.locationService.getTalukas(districtId, locale);
  }

  @Get('villages')
  @ApiQuery({ name: 'talukaId', required: true })
  @ApiOperation({ summary: 'Get villages by taluka' })
  @ApiResponse({ status: 200, description: 'List of villages' })
  @ApiQuery({ name: 'locale', required: false, enum: ['en', 'gu', 'hi'] })
  async getVillages(@Query('talukaId') talukaId: string, @Query('locale') locale?: string) {
    return this.locationService.getVillages(talukaId, locale);
  }
}
