import {IsBoolean, IsEmail, IsOptional, IsString, MaxLength, MinLength} from 'class-validator';
import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';

export class AuthSignInDto {
  @IsEmail()
  @ApiProperty({required: true})
  readonly email!: string;
  @IsString()
  @ApiProperty({required: true})
  readonly password!: string;
}

export class AuthSignUpDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  readonly firstName?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  readonly lastName?: string;
  @IsEmail()
  @ApiProperty({required: true})
  readonly email!: string;
  @IsString()
  @MinLength(6)
  @ApiProperty({required: true})
  readonly password!: string;
}

export class AuthRecoverDto {
  @IsString()
  @MaxLength(256)
  @ApiProperty({required: true})
  readonly login?: string;
}
