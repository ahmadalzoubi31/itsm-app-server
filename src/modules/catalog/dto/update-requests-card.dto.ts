// src/modules/catalog/dto/update-requests-card.dto.ts
import {
  IsUUID,
  IsString,
  IsBoolean,
  IsOptional,
  IsObject,
  IsArray,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export class UpdateRequestCardDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  @Type(() => Object)
  jsonSchema?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  @Type(() => Object)
  uiSchema?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  @Type(() => Object)
  defaults?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  defaultAssignmentGroupId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  @Transform(({ value }) => (value === '' ? null : value))
  workflowId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  approvalGroupId?: string;

  @ApiPropertyOptional({ enum: ['manager', 'direct', 'group'] })
  @IsOptional()
  @IsString()
  approvalType?: 'manager' | 'direct' | 'group'; // Deprecated - use approvalSteps instead

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  @Type(() => Object)
  approvalConfig?: {
    userId?: string;
    groupId?: string;
    requireAll?: boolean;
  }; // Deprecated - use approvalSteps instead

  @ApiPropertyOptional({
    description: 'Ordered list of approval steps',
    example: [
      { order: 1, type: 'manager' },
      { order: 2, type: 'direct', config: { userId: 'user-uuid' } },
      { order: 3, type: 'group', config: { groupId: 'group-uuid', requireAll: false } },
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
