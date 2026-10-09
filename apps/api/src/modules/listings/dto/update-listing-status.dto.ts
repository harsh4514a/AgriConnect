import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateListingStatusDto {
  @ApiProperty({ enum: ['active', 'sold', 'inactive'] })
  @IsIn(['active', 'sold', 'inactive'])
  status: 'active' | 'sold' | 'inactive';
}
