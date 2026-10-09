import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  Min,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompleteProfileDto {
  @ApiProperty({
    example: 'Ramesh',
    description: 'First name of the user',
  })
  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters' })
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  firstName: string;

  @ApiProperty({
    example: 'Kumar',
    description: 'Last name of the user',
  })
  @IsString()
  @MinLength(2, { message: 'Last name must be at least 2 characters' })
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  lastName: string;

  @ApiProperty({
    example: 'english',
    description: 'Preferred language (english, hindi, gujarati)',
  })
  @IsString()
  @MaxLength(20)
  preferredLanguage: string;

  @ApiProperty({
    description:
      'Registration token issued after OTP verification (required for new users)',
  })
  @IsString()
  registrationToken: string;

  @ApiPropertyOptional({
    example: 'uuid-of-state',
    description: 'State UUID from the states table',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Invalid state ID' })
  stateId?: string;

  @ApiPropertyOptional({
    example: 'uuid-of-district',
    description: 'District UUID from the districts table',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Invalid district ID' })
  districtId?: string;

  @ApiPropertyOptional({
    example: 'uuid-of-taluka',
    description: 'Taluka UUID from the talukas table',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Invalid taluka ID' })
  talukaId?: string;

  @ApiPropertyOptional({
    example: 'uuid-of-village',
    description: 'Village UUID from the villages table',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Invalid village ID' })
  villageId?: string;

  @ApiPropertyOptional({
    example: 23.0225,
    description: 'Latitude from browser geolocation',
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({
    example: 72.5714,
    description: 'Longitude from browser geolocation',
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
}

