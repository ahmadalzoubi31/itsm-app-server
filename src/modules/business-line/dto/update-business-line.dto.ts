// src/modules/business-line/dto/update-business-line.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateBusinessLineDto {
  @ApiPropertyOptional({
    description: 'Display name of the business line',
    example: 'Information Technology',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the business line',
    example: 'Manages all IT services, infrastructure, and support',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether this business line is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
