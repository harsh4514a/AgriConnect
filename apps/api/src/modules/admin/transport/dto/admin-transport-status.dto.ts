import { IsBoolean } from 'class-validator';

export class AdminTransportStatusDto {
  @IsBoolean()
  isActive!: boolean;
}
