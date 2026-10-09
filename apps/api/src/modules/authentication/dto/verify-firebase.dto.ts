import { IsString, IsMobilePhone, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyFirebaseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6...',
    description: 'Firebase ID Token obtained after Firebase Phone Auth succeeds',
  })
  @IsString()
  @MinLength(10, { message: 'idToken is too short' })
  idToken: string;

  @ApiProperty({
    example: '+919876543210',
    description: 'Indian mobile number with country code (must match the token phone_number)',
  })
  @IsString()
  @IsMobilePhone(
    'en-IN',
    {},
    { message: 'Please provide a valid Indian mobile number' },
  )
  mobileNumber: string;
}

