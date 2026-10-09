import {
  Body,
  Controller,
  Delete,
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
import { AdminGovernmentSchemeDto } from './dto/admin-government-scheme.dto';
import { AdminGovernmentSchemeQueryDto } from './dto/admin-government-scheme-query.dto';
import { AdminGovernmentSchemeStatusDto } from './dto/admin-government-scheme-status.dto';
import { AdminGovernmentSchemesService } from './admin-government-schemes.service';
import {
  AdminGovernmentSchemeDetails,
  AdminGovernmentSchemeFiltersResponse,
  AdminGovernmentSchemesResponse,
} from './interfaces/admin-government-schemes-response.interface';

@ApiTags('Admin Government Schemes')
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard)
@Controller('admin/government-schemes')
export class AdminGovernmentSchemesController {
  constructor(private readonly service: AdminGovernmentSchemesService) {}

  @Get('filters')
  @ApiOperation({ summary: 'Get government scheme filter options for administrators' })
  getFilters(): Promise<AdminGovernmentSchemeFiltersResponse> {
    return this.service.getFilters();
  }

  @Get()
  @ApiOperation({ summary: 'List government schemes for administrators' })
  findAll(@Query() query: AdminGovernmentSchemeQueryDto): Promise<AdminGovernmentSchemesResponse> {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a government scheme with localized content' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<AdminGovernmentSchemeDetails> {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a government scheme with localized content' })
  create(
    @Body() dto: AdminGovernmentSchemeDto,
    @CurrentAdmin() admin: AdminProfileResponse,
  ): Promise<AdminGovernmentSchemeDetails> {
    return this.service.create(dto, admin);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a government scheme and supplied localized content' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AdminGovernmentSchemeDto,
    @CurrentAdmin() admin: AdminProfileResponse,
  ): Promise<AdminGovernmentSchemeDetails> {
    return this.service.update(id, dto, admin);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish or unpublish a government scheme' })
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AdminGovernmentSchemeStatusDto,
    @CurrentAdmin() admin: AdminProfileResponse,
  ): Promise<{ id: string; isPublished: boolean }> {
    return this.service.updateStatus(id, dto, admin);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a government scheme and its localized contents' })
  delete(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentAdmin() admin: AdminProfileResponse,
  ): Promise<{ id: string; slug: string; deleted: boolean }> {
    return this.service.delete(id, admin);
  }
}
