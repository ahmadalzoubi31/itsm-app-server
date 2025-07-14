import {
  IsString,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsArray,
  IsOptional,
  IsEmail,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  EmailProtocolEnum,
  NotificationTypeEnum,
} from '../enums';

export class OutgoingEmailEngineDto {
  @IsBoolean()
  enabled: boolean;

  @IsEnum(EmailProtocolEnum)
  protocol: EmailProtocolEnum;

  @IsString()
  host: string;

  @IsNumber()
  @Min(1)
  @Max(65535)
  port: number;

  @IsBoolean()
  secure: boolean;

  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsEmail()
  fromEmail: string;

  @IsString()
  fromName: string;

  @IsOptional()
  @IsEmail()
  replyTo?: string;

  @IsNumber()
  @Min(1000)
  @Max(300000)
  timeout: number;

  @IsNumber()
  @Min(1000)
  @Max(300000)
  connectionTimeout: number;

  @IsNumber()
  @Min(1)
  @Max(100)
  maxConnections: number;

  @IsNumber()
  @Min(1)
  @Max(1000)
  rateLimitPerSecond: number;
}

export class IncomingEmailEngineDto {
  @IsBoolean()
  enabled: boolean;

  @IsEnum(EmailProtocolEnum)
  protocol: EmailProtocolEnum;

  @IsString()
  host: string;

  @IsNumber()
  @Min(1)
  @Max(65535)
  port: number;

  @IsBoolean()
  secure: boolean;

  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsNumber()
  @Min(1)
  @Max(1440)
  pollInterval: number;

  @IsBoolean()
  autoProcessIncidents: boolean;

  @IsOptional()
  @IsString()
  autoAssignTo?: string;

  @IsString()
  defaultPriority: string;

  @IsArray()
  emailToIncidentMapping: Array<{
    subjectRegex: string;
    bodyRegex: string;
    categoryMapping: string;
    priorityMapping: string;
  }>;
}

export class NotificationSettingsDto {
  @IsBoolean()
  enabled: boolean;

  @IsArray()
  @IsEnum(NotificationTypeEnum, { each: true })
  notificationTypes: NotificationTypeEnum[];

  @IsArray()
  @IsEmail({}, { each: true })
  defaultRecipients: string[];

  @IsArray()
  @IsEmail({}, { each: true })
  urgentRecipients: string[];

  @IsArray()
  @IsEmail({}, { each: true })
  ccRecipients: string[];

  @IsArray()
  @IsEmail({}, { each: true })
  bccRecipients: string[];

  @IsString()
  @Max(50)
  subjectPrefix: string;

  @IsBoolean()
  includeAttachments: boolean;

  @IsNumber()
  @Min(1)
  @Max(100)
  maxAttachmentSize: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  retryAttempts: number;

  @IsNumber()
  @Min(1)
  @Max(3600)
  retryDelay: number;

  @IsNumber()
  @Min(1)
  @Max(1000)
  batchSize: number;

  @IsNumber()
  @Min(1)
  @Max(10000)
  throttleLimit: number;
}

export class EmailSettingsDto {
  @ValidateNested()
  @Type(() => OutgoingEmailEngineDto)
  outgoing: OutgoingEmailEngineDto;

  @ValidateNested()
  @Type(() => IncomingEmailEngineDto)
  incoming: IncomingEmailEngineDto;

  @ValidateNested()
  @Type(() => NotificationSettingsDto)
  notifications: NotificationSettingsDto;

  @IsOptional()
  @IsEmail()
  testEmail?: string;
} 