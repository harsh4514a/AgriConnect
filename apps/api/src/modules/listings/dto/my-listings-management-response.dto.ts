import { ApiProperty } from '@nestjs/swagger';
import { ListingResponseDto } from './listing-response.dto';

export class MyListingsManagementStatsDto {
  @ApiProperty() total: number;
  @ApiProperty() active: number;
  @ApiProperty() sold: number;
  @ApiProperty() inactive: number;
}

export class MyListingsManagementResponseDto {
  @ApiProperty({ type: [ListingResponseDto] }) listings: ListingResponseDto[];
  @ApiProperty({ type: MyListingsManagementStatsDto }) stats: MyListingsManagementStatsDto;
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}
