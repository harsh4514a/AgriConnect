import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class AdminLoginDto {
  @ApiProperty({
    description: 'Unique administrator username',
    example: 'admin',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message: 'Username may contain only letters, numbers, dots, underscores, and hyphens',
  })
  @MaxLength(50, { message: 'Username cannot exceed 50 characters' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  username!: string;

  @ApiProperty({
    description: 'Administrator account password',
    example: 'Admin@Agri2026',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(12, { message: 'Password must be at least 12 characters long' })
  @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
  password!: string;
}
