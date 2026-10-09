import { IsOptional, IsString, IsIn, IsInt, Min, Max } from 'class-validator';
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
