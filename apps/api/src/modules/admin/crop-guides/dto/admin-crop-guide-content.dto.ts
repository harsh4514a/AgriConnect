import { IsArray, IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class AdminCropGuideContentDto {
  @IsIn(['en', 'gu', 'hi'])
  locale!: 'en' | 'gu' | 'hi';

  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  aliases?: string[];

  @IsString()
  @MaxLength(500)
  shortDescription!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  suitableSeason?: string | null;

  @IsObject()
  sections!: Record<string, string[]>;
}
