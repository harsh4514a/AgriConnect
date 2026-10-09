import { IsArray, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class AdminGovernmentSchemeContentDto {
  @IsIn(['en', 'gu', 'hi'])
  locale!: 'en' | 'gu' | 'hi';

  @IsString()
  @MaxLength(200)
  name!: string;

  @IsString()
  @MaxLength(500)
  shortDescription!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  benefits?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  eligibility?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documents?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicationSteps?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  conditions?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];
}
