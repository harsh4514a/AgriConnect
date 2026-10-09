import { IsIn, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export const SUPPORTED_LANGUAGE_CODES = ['en', 'gu', 'hi'] as const;
export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGE_CODES)[number];

export class UpdateLanguageDto {
  @ApiProperty({
    example: 'gu',
    description: 'Preferred language code (en, gu, hi)',
    enum: SUPPORTED_LANGUAGE_CODES,
  })
  @IsString()
  @IsIn(SUPPORTED_LANGUAGE_CODES, {
    message: 'preferredLanguage must be one of: en, gu, hi',
  })
  preferredLanguage: SupportedLanguageCode;
}

