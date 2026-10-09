import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class AdminCropGuideQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  season?: string;

  @IsOptional()
  @IsIn(['en', 'gu', 'hi'])
  locale?: 'en' | 'gu' | 'hi';

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsIn(['newest', 'oldest', 'name'])
  sort?: 'newest' | 'oldest' | 'name';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Max(50)
  @Min(1)
  pageSize?: number;
}
