import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryMarketPricesDto {
  @IsOptional() @IsString() district?: string;
  @IsOptional() @IsString() market?: string;
  @IsOptional() @IsString() commodity?: string;
  @IsOptional() @IsString() variety?: string;
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}

export class QueryMarketPriceBrowseDto {
  @IsOptional() @IsString() district?: string;
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @IsString() variety?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}
