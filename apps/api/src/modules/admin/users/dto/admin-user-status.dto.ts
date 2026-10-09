import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class AdminUserStatusDto {
  @ApiProperty({
    description: 'Whether the AgriConnect user account is active.',
    example: true,
  })
  @IsBoolean()
  isActive!: boolean;
}
