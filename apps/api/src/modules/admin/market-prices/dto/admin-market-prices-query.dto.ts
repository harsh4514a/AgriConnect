import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class AdminMarketPricesQueryDto {
  @ApiPropertyOptional({ description: 'Full-text search: commodity, variety, market, district, grade' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by district name (exact, canonical)' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ description: 'Filter by market name (exact)' })
  @IsOptional()
  @IsString()
  market?: string;

  @ApiPropertyOptional({ description: 'Filter by commodity name (exact)' })
  @IsOptional()
  @IsString()
  commodity?: string;

  @ApiPropertyOptional({ description: 'Filter by variety name (exact)' })
  @IsOptional()
  @IsString()
  variety?: string;

  @ApiPropertyOptional({ description: 'Filter by data date (YYYY-MM-DD). Defaults to the latest available date.' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    enum: ['commodity', 'market', 'district', 'modalPrice', 'dataDate'],
    description: 'Sort field. Whitelisted to prevent arbitrary column access.',
  })
  @IsOptional()
  @IsIn(['commodity', 'market', 'district', 'modalPrice', 'dataDate'])
  sortBy?: 'commodity' | 'market' | 'district' | 'modalPrice' | 'dataDate';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDir?: 'asc' | 'desc';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 25, maximum: 100 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 25;
}
