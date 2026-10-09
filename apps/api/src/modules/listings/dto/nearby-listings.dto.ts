import { Type } from 'class-transformer';

import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';

const CROP_KEYS = [
  'cotton',
  'groundnut',
  'wheat',
  'rice',
  'tomato',
  'onion',
  'potato',
  'chili',
  'maize',
  'bajra',
  'other',
] as const;

export class NearbyListingsQueryDto {
  /**
   * Maximum distance from the user's saved profile location.
   *
   * Default: 10 km
   *
   * We allow up to 50 km on the dedicated Nearby page.
   */
  @ApiPropertyOptional({
    description:
      'Maximum distance from the authenticated user in kilometres.',
    default: 10,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  radius?: number = 10;

  /**
   * Optional crop filter.
   */
  @ApiPropertyOptional({
    enum: CROP_KEYS,
  })
  @IsOptional()
  @IsIn(CROP_KEYS)
  cropKey?: (typeof CROP_KEYS)[number];

  /**
   * Optional search query.
   *
   * Searches:
   * - farmer name
   * - crop
   * - village
   * - taluka
   * - district
   * - variety
   * - custom crop name
   */
  @ApiPropertyOptional({
    description:
      'Search by crop, farmer, village, taluka, district or variety.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  /**
   * Pagination.
   */
  @ApiPropertyOptional({
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    default: 12,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 12;
}