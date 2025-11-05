import { ApiProperty } from '@nestjs/swagger';
import { CASE_PRIORITY_VALUES, CasePriority } from '@shared/constants';
import { REQUEST_STATUS_VALUES, RequestStatus } from '@shared/constants';
import { IsOptional, IsString, IsIn, IsUUID, Length } from 'class-validator';

export class UpdateRequestDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(3, 200)
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, enum: REQUEST_STATUS_VALUES })
  @IsOptional()
  @IsIn(REQUEST_STATUS_VALUES)
  status?: RequestStatus;

  @ApiProperty({ required: false, enum: CASE_PRIORITY_VALUES })
  @IsOptional()
  @IsIn(CASE_PRIORITY_VALUES)
  priority?: CasePriority;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  assignmentGroupId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  resolution?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: any;
}
