import { ApiProperty } from '@nestjs/swagger';
import { CASE_PRIORITY_VALUES, CasePriority } from '@shared/constants';
import { IsUUID, IsString, IsOptional, IsIn, Length } from 'class-validator';

export class CreateCaseDto {
  @ApiProperty({ example: 'Email not working' })
  @IsString()
  @Length(3, 200)
  title!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: CASE_PRIORITY_VALUES,
    default: CasePriority.MEDIUM,
  })
  @IsIn(CASE_PRIORITY_VALUES)
  priority: CasePriority = CasePriority.MEDIUM;

  @ApiProperty({
    description: 'Requester userId',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  requesterId!: string;

  @ApiProperty({ required: false, description: 'Assignee userId' })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiProperty({
    required: true,
    description: 'Assignment group id',
    example: '9cf29e1c-f949-4844-a14a-28af66caf856',
  })
  @IsUUID()
  assignmentGroupId!: string;

  @ApiProperty({
    required: true,
    description: 'Business line id (IT, HR, Finance, etc.)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  businessLineId!: string;
}
