import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class QueryMyListingsManagementDto {
  @ApiPropertyOptional({ description: 'Filter by listing status' })
  @IsOptional()
  @IsIn(['active', 'sold', 'inactive'])
  status?: 'active' | 'sold' | 'inactive';

  @ApiPropertyOptional({ description: 'Search crop, variety, or location text', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ description: 'Page number (1-based)', default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsInt()
  @Min(1)
  @Max(10000)
  page = 1;

  @ApiPropertyOptional({ description: 'Number of listings per page', default: 12 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 12;
}
