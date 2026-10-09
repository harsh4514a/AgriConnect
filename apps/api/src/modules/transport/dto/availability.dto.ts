import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateTransportAvailabilityDto {
  @ApiProperty()
  @IsBoolean()
  isAvailable!: boolean;
}
