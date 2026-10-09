import {
  IsBoolean,
  IsNotEmpty,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { TRANSPORT_VEHICLE_TYPES } from './query-transport.dto';

export class CreateTransportDto {
  @IsIn(TRANSPORT_VEHICLE_TYPES)
  vehicleType!: (typeof TRANSPORT_VEHICLE_TYPES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(100)
  customVehicleType?: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(?:\+91)?[6-9]\d{9}$/, {
    message: 'Invalid Indian mobile number',
  })
  phoneNumber!: string;

  @IsUUID('4')
  districtId!: string;

  @IsUUID('4')
  talukaId!: string;

  @IsUUID('4')
  villageId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  additionalDetails?: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
}
