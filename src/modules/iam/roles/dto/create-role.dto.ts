// src/modules/iam/roles/dto/create-role.dto.ts
import { IsOptional, IsString, Length, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({
    example: 'agent',
    description: 'Stable key (lowercase, digits, dash, underscore).',
  })
  @IsString()
  @Matches(/^[a-z0-9-_]+$/)
  @Length(2, 50)
  key!: string;

  @ApiProperty({ example: 'Agent', description: 'Display name.' })
  @IsString()
  @Length(2, 100)
  name!: string;

  @ApiPropertyOptional({
    example: 'Work assigned cases',
    description: 'Optional description.',
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;
}

