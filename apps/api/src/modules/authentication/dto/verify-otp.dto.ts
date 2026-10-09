import { IsString, IsMobilePhone, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({
    example: '+919876543210',
    description: 'Indian mobile number with country code',
  })
  @IsString()
  @IsMobilePhone(
    'en-IN',
    {},
    { message: 'Please provide a valid Indian mobile number' },
  )
  mobileNumber: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit OTP received on mobile',
  })
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  otp: string;
}

