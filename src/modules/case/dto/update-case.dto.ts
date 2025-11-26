import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  CASE_PRIORITY_VALUES,
  CASE_STATUS_VALUES,
  CasePriority,
  CaseStatus,
} from '@shared/constants';
import { IsOptional, IsString, IsIn, IsUUID, Length } from 'class-validator';

export class UpdateCaseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(3, 200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: CASE_STATUS_VALUES })
  @IsOptional()
  @IsIn(CASE_STATUS_VALUES)
  status?: CaseStatus;

  @ApiPropertyOptional({ enum: CASE_PRIORITY_VALUES })
  @IsOptional()
  @IsIn(CASE_PRIORITY_VALUES)
  priority?: CasePriority;

  @ApiPropertyOptional({ description: 'Assignee userId' })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional({ description: 'Assignment group id' })
  @IsOptional()
  @IsUUID()
  assignmentGroupId?: string;

  @ApiPropertyOptional({ description: 'Case category id' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Case subcategory id' })
  @IsOptional()
  @IsUUID()
  subcategoryId?: string;
}
