import { IsBoolean } from 'class-validator';

export class AdminGovernmentSchemeStatusDto {
  @IsBoolean()
  isPublished!: boolean;
}
