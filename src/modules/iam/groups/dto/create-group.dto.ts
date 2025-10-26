// src/modules/iam/groups/dto/create-group.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, Length, IsOptional, IsUUID } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({ example: 'IT.Tier1' })
  @IsString()
  @Length(2, 80)
  key!: string;

  @ApiProperty({ example: 'IT Tier 1' })
  @IsString()
  @Length(2, 120)
  name!: string;

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
  @ApiPropertyOptional({ example: 'IT.Tier1' })
  @IsOptional()
  @IsString()
  @Length(2, 80)
  key?: string;

  @ApiPropertyOptional({ example: 'IT Tier 1' })
  @IsOptional()
  @IsString()
  @Length(2, 120)
  name?: string;

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
