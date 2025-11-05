import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsIn,
  IsUUID,
  IsInt,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { REQUEST_STATUS_VALUES, RequestStatus } from '@shared/constants';
import { REQUEST_TYPE_VALUES, RequestType } from '@shared/constants';
import { CASE_PRIORITY_VALUES } from '@shared/constants';

export class ListRequestsQuery {
  @ApiProperty({ required: false, description: 'Search query' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiProperty({ required: false, enum: REQUEST_STATUS_VALUES })
  @IsOptional()
  @IsIn(REQUEST_STATUS_VALUES)
  status?: RequestStatus;

  @ApiProperty({ required: false, enum: REQUEST_TYPE_VALUES })
  @IsOptional()
  @IsIn(REQUEST_TYPE_VALUES)
  type?: RequestType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  businessLineId?: string;

  @ApiProperty({ required: false, enum: CASE_PRIORITY_VALUES })
  @IsOptional()
  @IsIn(CASE_PRIORITY_VALUES)
  priority?: string;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  pageSize?: number = 20;

  @ApiProperty({ required: false, default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiProperty({ required: false, default: 'DESC' })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortDir?: 'ASC' | 'DESC' = 'DESC';
}
