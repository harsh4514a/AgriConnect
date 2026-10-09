import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class AdminMarketplaceStatusDto {
  @ApiProperty({ enum: ['active', 'sold', 'inactive'] })
  @IsIn(['active', 'sold', 'inactive'])
  status!: 'active' | 'sold' | 'inactive';
}
