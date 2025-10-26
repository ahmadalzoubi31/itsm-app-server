// src/modules/case/dto/assign-case.dto.ts
import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
export class AssignCaseDto {
  @ApiPropertyOptional({ description: 'Assignee userId', required: false })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;
  @ApiPropertyOptional({ description: 'Assignment group id', required: false })
  @IsOptional()
  @IsUUID()
  assignmentGroupId!: string;
}
