import { Type } from 'class-transformer';
import {
  IsIn,
  IsMobilePhone,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const BUYER_REQUIREMENT_CROP_KEYS = [
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

export const BUYER_REQUIREMENT_UNITS = ['kg', 'quintal', 'ton'] as const;

export class CreateBuyerRequirementDto {
  @ApiProperty({ enum: BUYER_REQUIREMENT_CROP_KEYS })
  @IsIn(BUYER_REQUIREMENT_CROP_KEYS)
  cropKey!: (typeof BUYER_REQUIREMENT_CROP_KEYS)[number];

  @ApiPropertyOptional({ description: 'Required only when cropKey is other' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  customCropName?: string;

  @ApiPropertyOptional({ example: 'Shankar-6' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  variety?: string;

  @ApiProperty({ example: 500 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @ApiProperty({ enum: BUYER_REQUIREMENT_UNITS })
  @IsIn(BUYER_REQUIREMENT_UNITS)
  unit!: (typeof BUYER_REQUIREMENT_UNITS)[number];

  @ApiProperty({ example: 'Rajkot' })
  @IsString()
  @MaxLength(100)
  district!: string;

  @ApiPropertyOptional({ example: 'Jetpur' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  taluka?: string;

  @ApiPropertyOptional({ example: 'Jetpur' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  village?: string;

  @ApiProperty({
    example: '+919876543210',
    description: 'Indian mobile number with country code',
  })
  @IsMobilePhone('en-IN', {}, {
    message: 'Please provide a valid Indian mobile number',
  })
  contactNumber!: string;

  @ApiPropertyOptional({
    example: 'Good quality wheat required.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  additionalRequirements?: string;

  @ApiPropertyOptional({
    description: 'Client generated key used to make retries idempotent.',
    maxLength: 64,
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  submissionKey?: string;
}
