import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const TRANSPORT_VEHICLE_TYPES = [
  'tractor',
  'tractor_trailer',
  'pickup',
  'mini_truck',
  'truck',
  'other',
] as const;

export type TransportVehicleType = (typeof TRANSPORT_VEHICLE_TYPES)[number];

export class QueryTransportDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsUUID('4')
  districtId?: string;

  @IsOptional()
  @IsUUID('4')
  talukaId?: string;

  @IsOptional()
  @IsUUID('4')
  villageId?: string;

  @IsOptional()
  @IsIn(TRANSPORT_VEHICLE_TYPES)
  vehicleType?: TransportVehicleType;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  available?: boolean;

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
