import { IsOptional, IsString, IsIn, IsInt, Min, Max, IsNumber, IsBoolean, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryListingsDto {
  @ApiPropertyOptional({ description: 'Filter by crop key (e.g. wheat, cotton)' })
  @IsOptional()
  @IsString()
  cropKey?: string;

  @ApiPropertyOptional({ description: 'Filter by district name' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ description: 'Search crop, farmer, variety or location text' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by village name' })
  @IsOptional()
  @IsString()
  village?: string;

  @ApiPropertyOptional({ enum: ['newest', 'nearest', 'lowestPrice', 'highestPrice', 'mostQty'] })
  @IsOptional()
  @IsIn(['newest', 'nearest', 'lowestPrice', 'highestPrice', 'mostQty'])
  sort?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  verified?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => parseFloat(value as string))
  @IsNumber()
  @Min(0)
  priceMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => parseFloat(value as string))
  @IsNumber()
  @Min(0)
  priceMax?: number;

  @ApiPropertyOptional({ description: 'Quantity bound in quintals' })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value as string))
  @IsNumber()
  @Min(0)
  quantityMin?: number;

  @ApiPropertyOptional({ description: 'Quantity bound in quintals' })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value as string))
  @IsNumber()
  @Min(0)
  quantityMax?: number;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ['active', 'sold', 'inactive'],
  })
  @IsOptional()
  @IsIn(['active', 'sold', 'inactive'])
  status?: string;

  @ApiPropertyOptional({ description: 'Page number (1-based)', default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of results per page', default: 50 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}
