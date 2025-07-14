import {
  IsString,
  IsBoolean,
  IsEnum,
  IsArray,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { EmailTemplateTypeEnum } from '../enums';

export class CreateEmailTemplateDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsEnum(EmailTemplateTypeEnum)
  type: EmailTemplateTypeEnum;

  @IsString()
  @MaxLength(998)
  subject: string;

  @IsString()
  htmlBody: string;

  @IsString()
  textBody: string;

  @IsArray()
  @IsString({ each: true })
  variables: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  language?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdateEmailTemplateDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEnum(EmailTemplateTypeEnum)
  type?: EmailTemplateTypeEnum;

  @IsOptional()
  @IsString()
  @MaxLength(998)
  subject?: string;

  @IsOptional()
  @IsString()
  htmlBody?: string;

  @IsOptional()
  @IsString()
  textBody?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  variables?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  language?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
} 