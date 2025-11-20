// src/modules/catalog/dto/approval-step.dto.ts
import {
  IsUUID,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsOptional,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApprovalStepsType } from '../entities/approval-step.entity';

export class CreateApprovalStepsDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  order!: number;

  @ApiProperty({ enum: ApprovalStepsType, example: ApprovalStepsType.MANAGER })
  @IsEnum(ApprovalStepsType)
  type!: ApprovalStepsType;

  @ApiPropertyOptional({ example: 'user-uuid' })
  @IsOptional()
  @IsUUID()
  @ValidateIf((o) => o.type === ApprovalStepsType.DIRECT)
  userId?: string;

  @ApiPropertyOptional({ example: 'group-uuid' })
  @IsOptional()
  @IsUUID()
  @ValidateIf((o) => o.type === ApprovalStepsType.GROUP)
  groupId?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  @ValidateIf((o) => o.type === ApprovalStepsType.GROUP)
  requireAll?: boolean;
}

export class UpdateApprovalStepsDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiPropertyOptional({ enum: ApprovalStepsType })
  @IsOptional()
  @IsEnum(ApprovalStepsType)
  type?: ApprovalStepsType;

  @ApiPropertyOptional({ example: 'user-uuid' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ example: 'group-uuid' })
  @IsOptional()
  @IsUUID()
  groupId?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  requireAll?: boolean;
}
