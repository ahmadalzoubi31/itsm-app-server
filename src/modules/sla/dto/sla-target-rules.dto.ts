// src/modules/sla/dto/sla-target-rules.dto.ts
import { IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SlaTriggerDto } from './sla-trigger.dto';

export class SlaTargetRulesDto {
  @ApiProperty({ type: [SlaTriggerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SlaTriggerDto)
  startTriggers!: SlaTriggerDto[];

  @ApiProperty({ type: [SlaTriggerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SlaTriggerDto)
  stopTriggers!: SlaTriggerDto[];

  @ApiProperty({ type: [SlaTriggerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SlaTriggerDto)
  pauseTriggers!: SlaTriggerDto[];

  @ApiProperty({ type: [SlaTriggerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SlaTriggerDto)
  resumeTriggers!: SlaTriggerDto[];
}
