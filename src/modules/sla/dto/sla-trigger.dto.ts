// src/modules/sla/dto/sla-trigger.dto.ts
import {
  IsString,
  IsArray,
  IsEnum,
  ValidateNested,
  IsOptional,
  Allow,
  IsNotEmpty,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { fromNullPrefix } from '@shared/utils/null-prefix.util';

export class SlaConditionDto {
  @ApiProperty({ example: 'status' })
  @IsString()
  field!: string;

  @ApiProperty({
    example: 'equals',
    enum: ['equals', 'not_equals', 'in', 'not_in', 'contains'],
  })
  @IsEnum(['equals', 'not_equals', 'in', 'not_in', 'contains'])
  operator!: 'equals' | 'not_equals' | 'in' | 'not_in' | 'contains';

  @ApiProperty({
    example: 'Resolved',
    description:
      'Value to compare against. Use $null$ for null/empty/undefined values',
  })
  @Allow()
  @Transform(({ value }) => fromNullPrefix(value))
  value!: any;
}

export class SlaTriggerDto {
  @ApiProperty({ example: 'case.created' })
  @IsString()
  event!: string;

  @ApiPropertyOptional({ type: [SlaConditionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SlaConditionDto)
  conditions?: SlaConditionDto[];

  @ApiProperty({ example: 'start', enum: ['start', 'stop', 'pause', 'resume'] })
  @IsEnum(['start', 'stop', 'pause', 'resume'])
  action!: 'start' | 'stop' | 'pause' | 'resume';
}
