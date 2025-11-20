// src/modules/catalog/dto/create-request-card.dto.ts
import {
  IsUUID,
  IsString,
  IsBoolean,
  IsOptional,
  IsObject,
  IsArray,
  ValidateNested,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export class CreateRequestCardDto {
  @ApiProperty({ example: 'service-uuid' })
  @IsUUID()
  serviceId!: string;

  @ApiProperty({ example: 'new-laptop' })
  @IsString()
  key!: string;

  @ApiProperty({ example: 'New Laptop Request' })
  @IsString()
  name!: string;

  @ApiProperty({
    example: {
      type: 'object',
      properties: { model: { type: 'string' } },
      required: ['model'],
    },
  })
  @IsObject()
  @Type(() => Object)
  jsonSchema!: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  @Type(() => Object)
  uiSchema?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  @Type(() => Object)
  defaults?: any;

  @ApiProperty()
  @IsUUID()
  defaultAssignmentGroupId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  @Transform(({ value }) => (value === '' ? null : value))
  workflowId?: string | null;

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  approvalGroupId?: string;

  @ApiProperty({ required: false, enum: ['manager', 'direct', 'group'] })
  @IsOptional()
  @IsString()
  approvalType?: 'manager' | 'direct' | 'group'; // Deprecated - use approvalSteps instead

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  @Type(() => Object)
  approvalConfig?: {
    userId?: string;
    groupId?: string;
    requireAll?: boolean;
  }; // Deprecated - use approvalSteps instead

  @ApiProperty({
    required: false,
    description: 'Ordered list of approval steps',
    example: [
      { order: 1, type: 'manager' },
      { order: 2, type: 'direct', config: { userId: 'user-uuid' } },
      {
        order: 3,
        type: 'group',
        config: { groupId: 'group-uuid', requireAll: false },
      },
    ],
  })
  @IsOptional()
  @IsArray()
  approvalSteps?: Array<{
    order: number;
    type: 'manager' | 'direct' | 'group';
    config?: {
      userId?: string;
      groupId?: string;
      requireAll?: boolean;
    };
  }>;
}

// Helper class for validation (optional but recommended)
export class ApprovalStepsDto {
  @IsNumber()
  order!: number;

  @IsEnum(['manager', 'direct', 'group'])
  type!: 'manager' | 'direct' | 'group';

  @IsOptional()
  @IsObject()
  config?: {
    userId?: string;
    groupId?: string;
    requireAll?: boolean;
  };
}
