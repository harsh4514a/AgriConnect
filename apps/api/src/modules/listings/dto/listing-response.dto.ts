import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Shape returned for every listing.
 * Fields mirror the CropListing TypeScript interface in the web app
 * so the frontend can consume responses without transformation.
 */
export class ListingResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() cropKey: string;
  @ApiProperty() image: string;
  @ApiProperty() imageAlt: string;
  @ApiPropertyOptional() farmerName?: string;
  @ApiPropertyOptional() farmerNameShort?: string;
  @ApiProperty() district: string;
  @ApiPropertyOptional() village?: string;
  @ApiPropertyOptional() taluka?: string;
  @ApiProperty() state: string;
  @ApiProperty() quantity: number;
  @ApiProperty() unit: string;
  @ApiProperty() price: number;
  @ApiProperty() primaryUnit: string;
  @ApiProperty() secondaryUnit: string;
  @ApiProperty() marketPrice: number;
  @ApiProperty() distanceKm: number;
  @ApiProperty() postedHoursAgo: number;
  @ApiProperty() availability: string;
  @ApiProperty() verified: boolean;
  @ApiPropertyOptional() mobileNumber?: string;
  @ApiPropertyOptional() phoneLabel?: string;
  @ApiProperty() readyToSell: boolean;
  @ApiPropertyOptional() lat?: number;
  @ApiPropertyOptional() lng?: number;
  @ApiPropertyOptional({ description: 'True when exact listing GPS coordinates were explicitly captured' })
  coordinatesVerified?: boolean;
  @ApiPropertyOptional({ description: 'True when distanceKm is calculated from validated locations' })
  locationDistanceVerified?: boolean;
  @ApiPropertyOptional() description?: string | null;
  @ApiPropertyOptional() variety?: string | null;
  @ApiPropertyOptional() customCropName?: string | null;
  @ApiPropertyOptional() qualityGrade?: string | null;
  @ApiPropertyOptional() cropDate?: string | null;
  @ApiPropertyOptional() farmerMemberSince?: number | null;
  @ApiPropertyOptional() farmerListingCount?: number | null;
  @ApiPropertyOptional() additionalImages?: string[] | null;
  @ApiProperty() status: string;
  @ApiProperty() isUserCreated: boolean;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class PaginatedListingsDto {
  @ApiProperty({ type: [ListingResponseDto] })
  listings: ListingResponseDto[];

  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
  @ApiPropertyOptional() locationAvailable?: boolean;
  @ApiPropertyOptional() unlocatedCount?: number;
}
