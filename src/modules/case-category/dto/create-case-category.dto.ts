// src/modules/case-category/dto/create-case-category.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class CreateCaseCategoryDto {
  @ApiProperty({
    description: 'Unique key identifier (lowercase, kebab-case)',
    example: 'incident',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Key must be lowercase alphanumeric with hyphens only',
  })
  key!: string;

  @ApiProperty({
    description: 'Display name of the case category',
    example: 'Incident',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the case category',
    example: 'An unplanned interruption to an IT service or reduction in the quality of an IT service',
  })
  @IsString()
  @IsOptional()
  description?: string;
}

