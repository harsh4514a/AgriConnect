import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  IsIn,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class AdminUserQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @Transform(({ value }) => value === undefined ? undefined : Number(value))
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Transform(({ value }) => value === undefined ? undefined : Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined) return undefined;
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsUUID()
  districtId?: string;

  @IsOptional()
  @IsDateString()
  registeredFrom?: string;

  @IsOptional()
  @IsDateString()
  registeredTo?: string;

  @IsOptional()
  @IsIn(['newest', 'oldest'])
  sort: 'newest' | 'oldest' = 'newest';
}
