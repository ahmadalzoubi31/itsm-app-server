import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsOptional,
  Length,
  IsEnum,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { WorkflowTargetType } from '../entities/workflow.entity';

export class UpdateWorkflowDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(2, 200)
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, enum: Object.values(WorkflowTargetType) })
  @IsOptional()
  @IsEnum(WorkflowTargetType)
  targetType?: WorkflowTargetType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  businessLineId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  defaultAssignmentGroupId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  priorityRules?: Record<string, string>;

  @ApiProperty({ required: false })
  @IsOptional()
  conditions?: {
    field: string;
    operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan';
    value: any;
  }[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(999)
  evaluationOrder?: number;
}
