// src/modules/business-line/dto/create-business-line.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class CreateBusinessLineDto {
  @ApiProperty({
    description: 'Unique key identifier (lowercase, kebab-case)',
    example: 'it',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Key must be lowercase alphanumeric with hyphens only',
  })
  key!: string;

  @ApiProperty({
    description: 'Display name of the business line',
    example: 'Information Technology',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the business line',
    example: 'Manages all IT services, infrastructure, and support',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
