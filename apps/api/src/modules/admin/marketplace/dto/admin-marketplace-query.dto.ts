import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsISO8601, IsOptional, IsString, Max, Min } from 'class-validator';

export class AdminMarketplaceQueryDto {
  @ApiPropertyOptional({ description: 'Search crop, farmer, mobile number, variety or location' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by crop key' })
  @IsOptional()
  @IsString()
  cropKey?: string;

  @ApiPropertyOptional({ description: 'Filter by district name' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ enum: ['active', 'sold', 'inactive'] })
  @IsOptional()
  @IsIn(['active', 'sold', 'inactive'])
  status?: 'active' | 'sold' | 'inactive';

  @ApiPropertyOptional({ description: 'Include listings created on/after this ISO date' })
  @IsOptional()
  @IsISO8601()
  listedFrom?: string;

  @ApiPropertyOptional({ description: 'Include listings created before this ISO date' })
  @IsOptional()
  @IsISO8601()
  listedTo?: string;

  @ApiPropertyOptional({ enum: ['newest', 'oldest'], default: 'newest' })
  @IsOptional()
  @IsIn(['newest', 'oldest'])
  sort?: 'newest' | 'oldest';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}
