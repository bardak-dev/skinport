import {IsBoolean, IsEmail, IsOptional, IsString, MaxLength, MinLength} from 'class-validator';
import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';

export class PurchaseItemDto {
  @IsString()
  @ApiProperty({required: true})
  readonly item!: string;
}
