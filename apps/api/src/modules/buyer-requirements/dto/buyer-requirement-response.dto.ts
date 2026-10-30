import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BuyerRequirementResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() buyerId!: string;
  @ApiProperty() cropKey!: string;
  @ApiPropertyOptional() customCropName?: string;
  @ApiPropertyOptional() variety?: string;
  @ApiProperty() quantity!: number;
  @ApiProperty() unit!: string;
  @ApiProperty()
  district!: string;

  @ApiPropertyOptional({ description: 'Returned to signed-in users only.' })
  taluka?: string;

  @ApiPropertyOptional({ description: 'Returned to signed-in users only.' })
  village?: string;

  @ApiPropertyOptional()
  additionalRequirements?: string;
  @ApiProperty() status!: string;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
  @ApiPropertyOptional() postedBy?: {
    firstName?: string;
    lastName?: string;
    isVerified: boolean;
  };
  @ApiPropertyOptional({
    description: 'Only returned by authenticated endpoints when the contact number is appropriate to expose.',
  })
  contact?: {
    phoneNumber: string;
    displayName: string;
  };
}

export class BuyerRequirementListResponseDto {
  @ApiProperty({ type: [BuyerRequirementResponseDto] })
  items!: BuyerRequirementResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() totalPages!: number;
}
