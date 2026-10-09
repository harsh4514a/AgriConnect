import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import { CurrentAdmin } from '../auth/decorators/current-admin.decorator';
import { AdminProfileResponse } from '../auth/interfaces/admin-auth-response.interface';
import { AdminTransportQueryDto } from './dto/admin-transport-query.dto';
import { AdminTransportStatusDto } from './dto/admin-transport-status.dto';
import { AdminTransportService } from './admin-transport.service';
import {
  AdminTransportDetails,
  AdminTransportFiltersResponse,
  AdminTransportsResponse,
} from './interfaces/admin-transport-response.interface';

@ApiTags('Admin Transport')
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard)
@Controller('admin/transport')
export class AdminTransportController {
  constructor(private readonly service: AdminTransportService) {}

  @Get('filters')
  @ApiOperation({ summary: 'Get transport filter options for administrators' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Available transport filter options' })
  getFilters(): Promise<AdminTransportFiltersResponse> {
    return this.service.getFilters();
  }

  @Get()
  @ApiOperation({ summary: 'List transport services for administrators' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Paginated transport services' })
  findAll(@Query() query: AdminTransportQueryDto): Promise<AdminTransportsResponse> {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a transport service detail for administrators' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Transport service details' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Transport service not found' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<AdminTransportDetails> {
    return this.service.findOne(id);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate or deactivate a transport service as an administrator' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Transport service status updated' })
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AdminTransportStatusDto,
    @CurrentAdmin() admin: AdminProfileResponse,
  ): Promise<{ id: string; isActive: boolean }> {
    return this.service.updateStatus(id, dto, admin);
  }
}
