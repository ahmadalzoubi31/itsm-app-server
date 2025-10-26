// src/modules/email/dto/update-email-channel.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
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

export class UpdateEmailChannelDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() businessLineId?: string;
  @ApiPropertyOptional({ enum: ['smtp', 'imap', 'pop3'] })
  @IsOptional()
  @IsIn(['smtp', 'imap', 'pop3'])
  kind?: 'smtp' | 'imap' | 'pop3';
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() fromAddress?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() replyTo?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() host?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) port?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() secure?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() username?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() password?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() enabled?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isDefault?: boolean;
}
