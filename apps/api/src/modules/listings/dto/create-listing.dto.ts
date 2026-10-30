import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

/** The client-provided fields needed to publish a marketplace listing. */
export class CreateListingDto {
  @ApiProperty({ enum: CROP_KEYS })
  @IsIn(CROP_KEYS)
  cropKey: (typeof CROP_KEYS)[number];

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiProperty({ enum: ['quintal', 'ton', 'kg'] })
  @IsIn(['quintal', 'ton', 'kg'])
  unit: 'quintal' | 'ton' | 'kg';

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  price: number;

  @ApiProperty()
  @IsString()
  @MaxLength(40)
  primaryUnit: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  district: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  taluka: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  village: string;

  @ApiPropertyOptional({ description: 'GPS latitude captured for this listing location' })
  @IsOptional()
  @Transform(({ value }) => value === null || value === '' ? null : Number(value))
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number | null;

  @ApiPropertyOptional({ description: 'GPS longitude captured for this listing location' })
  @IsOptional()
  @Transform(({ value }) => value === null || value === '' ? null : Number(value))
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number | null;

  @ApiPropertyOptional({ default: 'Gujarat' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiProperty()
  @IsDateString()
  cropDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  variety?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  customCropName?: string;

  @ApiPropertyOptional({ default: 'A Grade' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  qualityGrade?: string;

  /** A Cloudinary secure URL or a local crop asset path. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^(?!blob:)/i, {
    message: 'Temporary browser image URLs cannot be saved to listings',
  })
  @MaxLength(300)
  image?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  imageAlt?: string;

  @ApiPropertyOptional({ type: [String], maxItems: 4 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @IsString({ each: true })
  @Matches(/^(?!blob:)/i, {
    each: true,
    message: 'Temporary browser image URLs cannot be saved to listings',
  })
  @MaxLength(300, { each: true })
  additionalImages?: string[];
}
