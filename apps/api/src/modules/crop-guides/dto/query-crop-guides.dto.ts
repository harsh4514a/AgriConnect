import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

const CROP_GUIDE_SEASONS = ['kharif', 'rabi', 'summer', 'yearRound'] as const;

export class QueryCropGuidesDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsIn(CROP_GUIDE_SEASONS)
  season?: (typeof CROP_GUIDE_SEASONS)[number];

  @IsOptional()
  @IsIn(['en', 'hi', 'gu'])
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
