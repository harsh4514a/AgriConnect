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
import { AdminMarketplaceQueryDto } from './dto/admin-marketplace-query.dto';
import { AdminMarketplaceStatusDto } from './dto/admin-marketplace-status.dto';
import { AdminMarketplaceService } from './admin-marketplace.service';
import {
  AdminMarketplaceDetails,
  AdminMarketplaceFiltersResponse,
  AdminMarketplaceResponse,
} from './interfaces/admin-marketplace-response.interface';

@ApiTags('Admin Marketplace')
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard)
@Controller('admin/marketplace')
export class AdminMarketplaceController {
  constructor(private readonly service: AdminMarketplaceService) {}

  @Get('filters')
  @ApiOperation({ summary: 'Get marketplace filter options for administrators' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Marketplace filter options' })
  getFilters(): Promise<AdminMarketplaceFiltersResponse> {
    return this.service.getFilters();
  }

  @Get()
  @ApiOperation({ summary: 'List marketplace listings for administrators' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Paginated marketplace listings' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Admin authentication required' })
  findAll(@Query() query: AdminMarketplaceQueryDto): Promise<AdminMarketplaceResponse> {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get marketplace listing details for administrators' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Marketplace listing details' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Listing not found' })
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<AdminMarketplaceDetails> {
    return this.service.findOne(id);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update marketplace listing status as an administrator' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Listing status updated' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Listing not found' })
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AdminMarketplaceStatusDto,
    @CurrentAdmin() admin: AdminProfileResponse,
  ): Promise<{ id: string; status: string }> {
    return this.service.updateStatus(id, dto, admin);
  }
}
