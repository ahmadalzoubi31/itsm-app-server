// src/modules/email/dto/create-email-channel.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateEmailChannelDto {
  @ApiProperty() @IsUUID() businessLineId!: string;
  @ApiProperty({ enum: ['smtp', 'imap', 'pop3'] })
  @IsIn(['smtp', 'imap', 'pop3'])
  kind!: 'smtp' | 'imap' | 'pop3';
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsEmail() fromAddress!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() replyTo?: string;
  @ApiProperty() @IsString() host!: string;
  @ApiProperty() @IsInt() @Min(1) port!: number;
  @ApiProperty() @IsBoolean() secure!: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() username?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() password?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() enabled?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isDefault?: boolean;
}
