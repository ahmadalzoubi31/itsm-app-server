// src/modules/iam/groups/dto/create-group.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, Length, IsOptional, IsUUID, IsIn } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({ example: 'IT Tier 1' })
  @IsString()
  @Length(2, 120)
  name!: string;

  @ApiProperty({ example: 'help-desk' })
  @IsString()
  @IsIn(['help-desk', 'tier-1', 'tier-2', 'tier-3'])
  type!: 'help-desk' | 'tier-1' | 'tier-2' | 'tier-3';

  @ApiPropertyOptional({ description: 'Group description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    required: true,
    description: 'Business line ID (IT, HR, Finance, etc.)',
  })
  @IsUUID()
  businessLineId!: string;
}

export class UpdateGroupDto {
  @ApiPropertyOptional({ example: 'IT Tier 1' })
  @IsOptional()
  @IsString()
  @Length(2, 120)
  name?: string;

  @ApiPropertyOptional({ example: 'help-desk' })
  @IsOptional()
  @IsString()
  @IsIn(['help-desk', 'tier-1', 'tier-2', 'tier-3'])
  type?: 'help-desk' | 'tier-1' | 'tier-2' | 'tier-3';

  @ApiPropertyOptional({ description: 'Group description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Business line ID (IT, HR, Finance, etc.)',
  })
  @IsOptional()
  @IsUUID()
  businessLineId?: string;
}
