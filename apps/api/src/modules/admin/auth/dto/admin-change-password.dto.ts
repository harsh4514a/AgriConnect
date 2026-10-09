import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';

export class AdminChangePasswordDto {
  @ApiProperty({
    description: 'Current administrator password for verification',
    example: 'OldPass@2024!',
  })
  @IsString()
  @IsNotEmpty({ message: 'Current password is required' })
  @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
  currentPassword!: string;

  @ApiProperty({
    description: 'New password to set',
    example: 'NewStrong@Pass99',
  })
  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(12, { message: 'New password must be at least 12 characters long' })
  @MaxLength(128, { message: 'New password cannot exceed 128 characters' })
  @Matches(/(?=.*[A-Z])/, {
    message: 'New password must contain at least one uppercase letter',
  })
  @Matches(/(?=.*[a-z])/, {
    message: 'New password must contain at least one lowercase letter',
  })
  @Matches(/(?=.*\d)/, {
    message: 'New password must contain at least one number',
  })
  @Matches(/(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/, {
    message: 'New password must contain at least one special character',
  })
  newPassword!: string;

  @ApiProperty({
    description: 'Confirmation of the new password',
    example: 'NewStrong@Pass99',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password confirmation is required' })
  @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
  confirmPassword!: string;
}
