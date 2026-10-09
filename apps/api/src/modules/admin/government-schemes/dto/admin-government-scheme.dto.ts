import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
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
import { AdminGovernmentSchemeContentDto } from './admin-government-scheme-content.dto';

export class AdminGovernmentSchemeDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must contain lowercase letters, numbers and hyphens only',
  })
  @MaxLength(100)
  slug!: string;

  @IsString()
  @IsIn(['central', 'state'])
  @MaxLength(20)
  governmentLevel!: 'central' | 'state';

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  department!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  category!: string;

  @IsString()
  @IsIn(['active', 'closed', 'upcoming'])
  @MaxLength(20)
  status!: 'active' | 'closed' | 'upcoming';

  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  availableStates!: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  applicationUrl?: string | null;

  @IsString()
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  sourceUrl!: string;

  @IsOptional()
  @IsDateString()
  lastVerifiedAt?: string | null;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100000)
  sortOrder?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminGovernmentSchemeContentDto)
  contents!: AdminGovernmentSchemeContentDto[];
}
