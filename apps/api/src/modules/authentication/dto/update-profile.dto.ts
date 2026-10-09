import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Ramesh' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'First name must be at least 2 characters' })
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  firstName!: string;

  @ApiProperty({ example: 'Patel' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Last name must be at least 2 characters' })
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  lastName!: string;

  @ApiProperty({ description: 'District UUID' })
  @IsUUID('4', { message: 'Invalid district' })
  districtId!: string;

  @ApiProperty({ description: 'Taluka UUID belonging to the selected district' })
  @IsUUID('4', { message: 'Invalid taluka' })
  talukaId!: string;

  @ApiProperty({ description: 'Village UUID belonging to the selected taluka' })
  @IsUUID('4', { message: 'Invalid village' })
  villageId!: string;
}
