// src/modules/iam/roles/dto/update-role.dto.ts
import { IsOptional, IsString, Length } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: 'Agent', description: 'Display name.' })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @ApiPropertyOptional({
    example: 'Work assigned cases',
    description: 'Optional description.',
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;
}

