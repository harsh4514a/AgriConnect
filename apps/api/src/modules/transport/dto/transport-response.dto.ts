import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransportLocationDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;
}

export class TransportProviderResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  businessName!: string;

  @ApiPropertyOptional()
  contactName?: string;

  @ApiProperty()
  phoneNumber!: string;

  @ApiProperty()
  vehicleType!: string;

  @ApiPropertyOptional()
  customVehicleType?: string;

  @ApiPropertyOptional()
  additionalDetails?: string;

  @ApiProperty()
  district!: TransportLocationDto;

  @ApiProperty()
  taluka!: TransportLocationDto | null;

  @ApiProperty()
  village!: TransportLocationDto | null;

  @ApiPropertyOptional({ nullable: true })
  latitude?: number | null;

  @ApiPropertyOptional({ nullable: true })
  longitude?: number | null;

  @ApiProperty()
  isAvailable!: boolean;

  @ApiProperty()
  isVerified!: boolean;

  @ApiProperty()
  isActive!: boolean;
}

export class TransportListResponseDto {
  @ApiProperty({ type: [TransportProviderResponseDto] })
  items!: TransportProviderResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;
}
