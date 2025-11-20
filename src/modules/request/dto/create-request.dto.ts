import { ApiProperty } from '@nestjs/swagger';
import { CASE_PRIORITY_VALUES, CasePriority } from '@shared/constants';
import { REQUEST_TYPE_VALUES, RequestType } from '@shared/constants';
import {
  IsUUID,
  IsString,
  IsOptional,
  IsIn,
  Length,
  IsEnum,
} from 'class-validator';

export class CreateRequestDto {
  @ApiProperty({ example: 'Email not working' })
  @IsString()
  @Length(3, 200)
  title!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: REQUEST_TYPE_VALUES,
    example: RequestType.SERVICE_REQUEST,
  })
  @IsEnum(RequestType)
  type!: RequestType;

  @ApiProperty({
    enum: CASE_PRIORITY_VALUES,
    default: CasePriority.MEDIUM,
  })
  @IsOptional()
  @IsIn(CASE_PRIORITY_VALUES)
  priority: CasePriority = CasePriority.MEDIUM;

  @ApiProperty({
    description: 'Business line id',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  businessLineId!: string;

  @ApiProperty({
    required: false,
    description: 'Affected service ID',
    example: '550e8400-e29b-41d4-a716-446655440010',
  })
  @IsOptional()
  @IsUUID()
  affectedServiceId?: string;

  @ApiProperty({
    required: false,
    description: 'Service card ID (from catalog)',
    example: '550e8400-e29b-41d4-a716-446655440020',
  })
  @IsOptional()
  @IsUUID()
  requestCardId?: string;

  @ApiProperty({
    required: false,
    description: 'Additional metadata',
  })
  @IsOptional()
  metadata?: any;

  @ApiProperty({
    description: 'Requester user ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  requesterId!: string;

  @ApiProperty({
    required: false,
    description: 'Created by user ID (for audit trail)',
  })
  @IsOptional()
  @IsUUID()
  createdById?: string;

  @ApiProperty({
    required: false,
    description: 'Created by user name (for audit trail)',
  })
  @IsOptional()
  @IsString()
  createdByName?: string;
}
