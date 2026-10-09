import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

const LEVELS = ['central', 'state'] as const;
const STATUSES = ['active', 'closed', 'upcoming'] as const;
const LOCALES = ['en', 'hi', 'gu'] as const;

export class QueryGovernmentSchemesDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsIn(LEVELS)
  governmentLevel?: (typeof LEVELS)[number];

  @IsOptional()
  @IsIn(STATUSES)
  status?: (typeof STATUSES)[number];

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsIn(LOCALES)
  locale?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
