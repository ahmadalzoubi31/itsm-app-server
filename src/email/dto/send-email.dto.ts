import {
  IsString,
  IsBoolean,
  IsEnum,
  IsArray,
  IsOptional,
  IsEmail,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EmailPriorityEnum } from '../enums';

export class AttachmentDto {
  @IsString()
  filename: string;

  @IsString()
  content: string;

  @IsString()
  contentType: string;
}

export class SendEmailDto {
  @IsArray()
  @IsEmail({}, { each: true })
  recipients: string[];

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  cc?: string[];

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  bcc?: string[];

  @IsString()
  @MaxLength(998)
  subject: string;

  @IsString()
  htmlBody: string;

  @IsOptional()
  @IsString()
  textBody?: string;

  @IsOptional()
  @IsEnum(EmailPriorityEnum)
  priority?: EmailPriorityEnum;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  templateData?: Record<string, any>;

  @IsOptional()
  scheduledAt?: Date;
}

export class TestEmailDto {
  @IsEmail()
  to: string;

  @IsString()
  @MaxLength(998)
  subject: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsBoolean()
  isHtml?: boolean;
}

export class SendTemplateEmailDto {
  @IsArray()
  @IsEmail({}, { each: true })
  recipients: string[];

  @IsString()
  templateId: string;

  templateData: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  cc?: string[];

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  bcc?: string[];

  @IsOptional()
  @IsEnum(EmailPriorityEnum)
  priority?: EmailPriorityEnum;

  @IsOptional()
  scheduledAt?: Date;
} 