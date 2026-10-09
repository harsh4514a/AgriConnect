import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { AdminCropGuideContentDto } from './admin-crop-guide-content.dto';

export class AdminCropGuideDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must contain lowercase letters, numbers and hyphens only',
  })
  @MaxLength(80)
  slug!: string;

  @IsString()
  @MaxLength(300)
  image!: string;

  @IsString()
  @MaxLength(200)
  imageAlt!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  category!: string;

  @IsArray()
  @IsString({ each: true })
  @MaxLength(20, { each: true })
  seasonKeys!: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100000)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsString()
  @MaxLength(200)
  sourceName!: string;

  @IsUrl({ require_tld: false })
  @MaxLength(500)
  sourceUrl!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminCropGuideContentDto)
  contents!: AdminCropGuideContentDto[];
}
