// src/modules/case/dto/change-status.dto.ts
import { CASE_STATUS_VALUES } from '@shared/constants';
import { IsEnum, IsIn } from 'class-validator';
import { CaseStatus } from '@shared/constants';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeStatusDto {
  @ApiProperty({ enum: CASE_STATUS_VALUES })
  @IsEnum(CASE_STATUS_VALUES)
  status!: CaseStatus;
}
