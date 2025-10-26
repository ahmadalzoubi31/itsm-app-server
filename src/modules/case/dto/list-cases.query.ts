import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CaseStatus,
  CASE_STATUS_VALUES,
  CasePriority,
  CASE_PRIORITY_VALUES,
  SortBy,
  SORT_BY_VALUES,
  SortDirection,
  SORT_DIRECTION_VALUES,
} from '../../../shared/constants';

export class ListCasesQuery {
  @ApiPropertyOptional({ enum: CASE_STATUS_VALUES })
  @IsOptional()
  @IsIn(CASE_STATUS_VALUES)
  status?: CaseStatus;

  @ApiPropertyOptional({ enum: CASE_PRIORITY_VALUES })
  @IsOptional()
  @IsIn(CASE_PRIORITY_VALUES)
  priority?: CasePriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  requesterId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignmentGroupId!: string;

  @ApiPropertyOptional({ description: 'Filter by business line' })
  @IsOptional()
  @IsUUID()
  businessLineId?: string;

  @ApiPropertyOptional({ description: 'search in title/number' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize: number = 20;

  @ApiPropertyOptional({
    enum: SORT_BY_VALUES,
    default: SortBy.CREATED_AT,
  })
  @IsOptional()
  @IsIn(SORT_BY_VALUES)
  sortBy?: SortBy = SortBy.CREATED_AT;

  @ApiPropertyOptional({
    enum: SORT_DIRECTION_VALUES,
    default: SortDirection.DESC,
  })
  @IsOptional()
  @IsIn(SORT_DIRECTION_VALUES)
  sortDir?: SortDirection = SortDirection.DESC;
}
