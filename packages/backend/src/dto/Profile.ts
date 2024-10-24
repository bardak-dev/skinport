import {IsEmail, IsOptional, IsString, Matches, MaxLength} from 'class-validator';
import {ApiPropertyOptional} from '@nestjs/swagger';

export class UpdateProfileDto {
  @IsOptional()
  @IsEmail()
  @ApiPropertyOptional()
  readonly email?: string;
  @IsOptional()
  @IsString()
  @MaxLength(256)
  @ApiPropertyOptional()
  readonly name?: string;
  @IsOptional()
  @IsString()
  @MaxLength(256)
  @ApiPropertyOptional()
  @Matches(/^[a-zA-Z0-9_.-]{2,20}$/)
  readonly username?: string;
  @IsOptional()
  @IsString()
  @MaxLength(256)
  @ApiPropertyOptional()
  readonly password?: string;
}
