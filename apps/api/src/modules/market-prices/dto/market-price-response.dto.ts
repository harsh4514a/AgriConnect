import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MarketPriceResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() state!: string;
  @ApiProperty() district!: string;
  @ApiProperty() market!: string;
  @ApiProperty() commodity!: string;
  @ApiProperty() variety!: string;
  @ApiProperty() grade!: string;
  @ApiProperty() dataDate!: string;
  @ApiProperty() minimumPrice!: number;
  @ApiProperty() maximumPrice!: number;
  @ApiProperty() modalPrice!: number;
  @ApiProperty() source!: string;
  @ApiProperty() fetchedAt!: string;
}

export class MarketPriceListResponseDto {
  @ApiProperty({ type: [MarketPriceResponseDto] }) items!: MarketPriceResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() totalPages!: number;
  @ApiPropertyOptional() latestAvailableDate?: string;
}

export class MarketPriceFiltersResponseDto {
  @ApiProperty({ type: [String] }) districts!: string[];
  @ApiProperty({ type: [String] }) markets!: string[];
  @ApiProperty() marketYardCount!: number;
  @ApiProperty({ type: [String] }) commodities!: string[];
  @ApiProperty({ type: [String] }) varieties!: string[];
  @ApiPropertyOptional() latestAvailableDate?: string;
}

export class MarketPriceRegionDto {
  @ApiProperty() name!: string;
  @ApiProperty() marketCount!: number;
  @ApiProperty() districtCount!: number;
}

export class MarketPriceRegionMarketDto {
  @ApiProperty() market!: string;
  @ApiProperty() district!: string;
}

export class MarketPriceMarketListResponseDto {
  @ApiProperty({ type: [MarketPriceRegionMarketDto] }) items!: MarketPriceRegionMarketDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() totalPages!: number;
}

export class MarketPriceMarketSummaryDto {
  @ApiProperty() market!: string;
  @ApiProperty() district!: string;
  @ApiProperty() commodity!: string;
  @ApiProperty() variety!: string;
  @ApiProperty() grade!: string;
  @ApiProperty() minimumPrice!: number;
  @ApiProperty() maximumPrice!: number;
  @ApiProperty() modalPrice!: number;
  @ApiProperty() dataDate!: string;
}

export class MarketPriceMarketPriceListResponseDto {
  @ApiProperty({ type: [MarketPriceMarketSummaryDto] }) items!: MarketPriceMarketSummaryDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() totalPages!: number;
  @ApiPropertyOptional() latestAvailableDate?: string;
}

export class MarketPriceCropDto {
  @ApiProperty() name!: string;
  @ApiProperty() marketCount!: number;
}

export class MarketPriceCropListResponseDto {
  @ApiProperty({ type: [MarketPriceCropDto] }) items!: MarketPriceCropDto[];
  @ApiProperty() total!: number;
}

export class MarketPriceCropMarketComparisonDto {
  @ApiProperty() market!: string;
  @ApiProperty() district!: string;
  @ApiProperty({ description: 'Highest maximumPrice for this market on the selected data date.' }) highestPrice!: number;
  @ApiProperty({ description: 'Average modalPrice for this market on the selected data date.' }) averagePrice!: number;
  @ApiProperty({ description: 'Lowest minimumPrice for this market on the selected data date.' }) lowestPrice!: number;
  @ApiProperty() recordCount!: number;
  @ApiProperty({ type: [String] }) varieties!: string[];
  @ApiProperty() dataDate!: string;
}

export class MarketPriceCropMarketComparisonResponseDto {
  @ApiProperty({ type: [MarketPriceCropMarketComparisonDto] }) items!: MarketPriceCropMarketComparisonDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() totalPages!: number;
  @ApiPropertyOptional() latestAvailableDate?: string;
}
