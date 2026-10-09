import { IsBoolean } from 'class-validator';

export class AdminCropGuideStatusDto {
  @IsBoolean()
  isPublished!: boolean;
}
