// src/modules/sla/dto/create-target.dto.ts (admin)
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
  IsBoolean,
  IsArray,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ReferenceModule } from '@shared/constants';
import { SlaTargetRulesDto } from './sla-target-rules.dto';

export class CreateSlaTargetDto {
  @ApiProperty({ example: 'respond' })
  @IsString()
  key!: string;

  @ApiProperty({ example: 'Respond in 4h' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 14400000 })
  @IsInt()
  @Min(1)
  goalMs!: number; // e.g., 14400000

  @ApiProperty({
    example: ReferenceModule.CASE,
    enum: ReferenceModule,
    description: 'The module this SLA target applies to',
  })
  @IsEnum(ReferenceModule)
  @IsNotEmpty()
  referenceModule!: ReferenceModule;

  @ApiProperty({
    type: SlaTargetRulesDto,
    example: {
      startTriggers: [{ event: 'case.created', action: 'start' }],
      stopTriggers: [
        {
          event: 'case.status.changed',
          conditions: [
            { field: 'status', operator: 'not_equals', value: '$null$' },
          ],
          action: 'stop',
        },
      ],
      pauseTriggers: [
        {
          event: 'case.status.changed',
          conditions: [
            { field: 'status', operator: 'equals', value: 'Pending' },
          ],
          action: 'pause',
        },
      ],
      resumeTriggers: [
        {
          event: 'case.status.changed',
          conditions: [
            { field: 'status', operator: 'equals', value: 'InProgress' },
          ],
          action: 'resume',
        },
      ],
    },
  })
  @ValidateNested()
  @Type(() => SlaTargetRulesDto)
  rules!: SlaTargetRulesDto;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  businessLineId!: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
