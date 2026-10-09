import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import { CurrentAdmin } from '../auth/decorators/current-admin.decorator';
import { AdminProfileResponse } from '../auth/interfaces/admin-auth-response.interface';
import { AdminCropGuideDto } from './dto/admin-crop-guide.dto';
import { AdminCropGuideQueryDto } from './dto/admin-crop-guide-query.dto';
import { AdminCropGuideStatusDto } from './dto/admin-crop-guide-status.dto';
import { AdminCropGuidesService } from './admin-crop-guides.service';
import {
  AdminCropGuideDetails,
  AdminCropGuideFiltersResponse,
  AdminCropGuidesResponse,
} from './interfaces/admin-crop-guides-response.interface';

@ApiTags('Admin Crop Guides')
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard)
@Controller('admin/crop-guides')
export class AdminCropGuidesController {
  constructor(private readonly service: AdminCropGuidesService) {}

  @Get('filters')
  @ApiOperation({ summary: 'Get crop guide filter options for administrators' })
  getFilters(): Promise<AdminCropGuideFiltersResponse> {
    return this.service.getFilters();
  }

  @Get()
  @ApiOperation({ summary: 'List crop guides for administrators' })
  findAll(@Query() query: AdminCropGuideQueryDto): Promise<AdminCropGuidesResponse> {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a crop guide with localized content' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<AdminCropGuideDetails> {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a crop guide with localized content' })
  create(
    @Body() dto: AdminCropGuideDto,
    @CurrentAdmin() admin: AdminProfileResponse,
  ): Promise<AdminCropGuideDetails> {
    return this.service.create(dto, admin);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a crop guide and supplied localized content' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AdminCropGuideDto,
    @CurrentAdmin() admin: AdminProfileResponse,
  ): Promise<AdminCropGuideDetails> {
    return this.service.update(id, dto, admin);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish or unpublish a crop guide' })
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AdminCropGuideStatusDto,
    @CurrentAdmin() admin: AdminProfileResponse,
  ): Promise<{ id: string; isPublished: boolean }> {
    return this.service.updateStatus(id, dto, admin);
  }
}
