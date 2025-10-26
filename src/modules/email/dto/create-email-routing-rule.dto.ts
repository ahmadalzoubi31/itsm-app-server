// src/modules/email/dto/create-email-routing-rule.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateEmailRoutingRuleDto {
  @ApiProperty({ description: 'Business line ID' })
  @IsUUID()
  businessLineId!: string;

  @ApiPropertyOptional({ description: 'Email channel ID (optional)' })
  @IsOptional()
  @IsUUID()
  channelId?: string;

  // Matchers (all provided must match)
  @ApiPropertyOptional({
    description: 'Email must be sent to address containing this text',
  })
  @IsOptional()
  @IsString()
  toContains?: string;

  @ApiPropertyOptional({ description: 'Email subject must include this text' })
  @IsOptional()
  @IsString()
  subjectIncludes?: string;

  @ApiPropertyOptional({
    description: 'Email must be from this domain (e.g., "company.com")',
  })
  @IsOptional()
  @IsString()
  fromDomain?: string;

  // Actions
  @ApiPropertyOptional({
    description: 'Assignment group ID to assign new cases to',
  })
  @IsOptional()
  @IsUUID()
  assignGroupId?: string;

  @ApiPropertyOptional({ description: 'Template ID for auto-responses' })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional({
    description: 'Priority level for new cases',
    enum: ['low', 'medium', 'high', 'urgent'],
  })
  @IsOptional()
  @IsString()
  priority?: 'low' | 'medium' | 'high' | 'urgent';

  @ApiPropertyOptional({ description: 'Label to apply to new cases' })
  @IsOptional()
  @IsString()
  label?: string;
}
