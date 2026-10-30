import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Small, bounded listing shape for the signed-in user's dashboard preview. */
export class RecentListingResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() cropKey: string;
  @ApiProperty() image: string;
  @ApiProperty() imageAlt: string;
  @ApiPropertyOptional() customCropName?: string | null;
  @ApiProperty() price: number;
  @ApiProperty() quantity: number;
  @ApiProperty() unit: string;
  @ApiProperty() village: string;
  @ApiProperty() district: string;
  @ApiProperty() createdAt: Date;
}
