import { IsString, IsMobilePhone } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
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
}

