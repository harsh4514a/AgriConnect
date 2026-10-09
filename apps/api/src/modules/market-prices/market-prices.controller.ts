import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { MarketPricesService } from './market-prices.service';
import { Public } from '../authentication/decorators/public.decorator';
import {
  QueryMarketPricesDto,
  QueryMarketPriceBrowseDto,
} from './dto/query-market-prices.dto';

@Controller('market-prices')
export class MarketPricesController {
  constructor(
    private readonly marketPricesService: MarketPricesService,
  ) {}

  /**
   * Get paginated Gujarat market-price records.
   *
   * GET /market-prices
   */
  @Public()
  @Get()
  async findAll(@Query() query: QueryMarketPricesDto) {
    return this.marketPricesService.findAll(query);
  }

  /**
   * Get available Gujarat market-price filters.
   *
   * GET /market-prices/filters
   */
  @Public()
  @Get('filters')
  async getFilters() {
    return this.marketPricesService.getFilters();
  }

  /**
   * Get the configured AgriConnect Gujarat regions.
   *
   * GET /market-prices/regions
   */
  @Public()
  @Get('regions')
  async getRegions() {
    return this.marketPricesService.getRegions();
  }

  /**
   * Find duplicate market-yard identities.
   *
   * GET /market-prices/duplicates
   */
  @Public()
  @Get('duplicates')
  async findDuplicateMarketYards() {
    return this.marketPricesService.findDuplicateMarketYards();
  }

  /**
   * Get market yards belonging to a Gujarat region.
   *
   * GET /market-prices/regions/:region/markets
   */
  @Public()
  @Get('regions/:region/markets')
  async getMarketsByRegion(
    @Param('region') region: string,
    @Query() query: QueryMarketPriceBrowseDto,
  ) {
    return this.marketPricesService.getMarketsByRegion(
      region,
      query,
    );
  }

  /**
   * Get prices for a particular market yard.
   *
   * GET /market-prices/markets/:market/prices
   */
  @Public()
  @Get('markets/:market/prices')
  async getMarketPrices(
    @Param('market') market: string,
    @Query() query: QueryMarketPriceBrowseDto,
  ) {
    return this.marketPricesService.getMarketPrices(
      market,
      query,
    );
  }

  /**
   * Get available crops in Gujarat.
   *
   * GET /market-prices/crops
   */
  @Public()
  @Get('crops')
  async getCrops(@Query('search') search?: string) {
    return this.marketPricesService.getCrops(search);
  }

  /**
   * Compare one crop across Gujarat market yards.
   *
   * GET /market-prices/crops/:commodity/compare
   */
  @Public()
  @Get('crops/:commodity/compare')
  async getCropMarketComparison(
    @Param('commodity') commodity: string,
    @Query() query: QueryMarketPriceBrowseDto,
  ) {
    return this.marketPricesService.getCropMarketComparison(
      commodity,
      query,
    );
  }
}
