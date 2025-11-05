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

export class CreateWorkflowDto {
  @ApiProperty({ example: 'it-support-workflow' })
  @IsString()
  @Length(2, 50)
  key!: string;

  @ApiProperty({ example: 'IT Support Workflow' })
  @IsString()
  @Length(2, 200)
  name!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: Object.values(WorkflowTargetType),
    example: WorkflowTargetType.CASE,
  })
  @IsEnum(WorkflowTargetType)
  targetType!: WorkflowTargetType;

  @ApiProperty({
    description: 'Business line id',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  businessLineId!: string;

  @ApiProperty({
    description: 'Default assignment group id',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsUUID()
  defaultAssignmentGroupId!: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean = true;

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

  @ApiProperty({ required: false, default: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(999)
  evaluationOrder?: number = 100;
}
