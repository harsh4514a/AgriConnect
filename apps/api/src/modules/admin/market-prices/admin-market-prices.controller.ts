import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import { AdminMarketPricesQueryDto } from './dto/admin-market-prices-query.dto';
import { AdminMarketPricesService } from './admin-market-prices.service';
import type {
  AdminMarketPriceListItem,
  AdminMarketPricesFiltersResponse,
  AdminMarketPricesResponse,
} from './interfaces/admin-market-prices-response.interface';

@ApiTags('Admin Market Prices')
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard)
@Controller('admin/market-prices')
export class AdminMarketPricesController {
  constructor(private readonly service: AdminMarketPricesService) {}

  /**
   * GET /admin/market-prices/filters
   * Distinct filter options for the Admin Market Prices page.
   */
  @Get('filters')
  @ApiOperation({ summary: 'Get filter options for Admin Market Prices' })
  @ApiResponse({ status: 200, description: 'Filter options returned successfully.' })
  getFilters(): Promise<AdminMarketPricesFiltersResponse> {
    return this.service.getFilters();
  }

  /**
   * GET /admin/market-prices
   * Paginated, searchable, filterable market-price records.
   */
  @Get()
  @ApiOperation({ summary: 'List market-price records for administrators' })
  @ApiResponse({ status: 200, description: 'Paginated market-price list.' })
  @ApiResponse({ status: 401, description: 'Admin authentication required.' })
  findAll(@Query() query: AdminMarketPricesQueryDto): Promise<AdminMarketPricesResponse> {
    return this.service.findAll(query);
  }

  /**
   * GET /admin/market-prices/:id
   * Full details for a single market-price record.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a single market-price record by ID' })
  @ApiResponse({ status: 200, description: 'Market-price record details.' })
  @ApiResponse({ status: 401, description: 'Admin authentication required.' })
  @ApiResponse({ status: 404, description: 'Record not found.' })
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<AdminMarketPriceListItem> {
    const record = await this.service.findOne(id);
    if (!record) {
      throw new NotFoundException('Market price record not found');
    }
    return record;
  }
}
