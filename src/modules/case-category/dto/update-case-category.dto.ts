// src/modules/case-category/dto/update-case-category.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateCaseCategoryDto {
  @ApiPropertyOptional({
    description: 'Display name of the case category',
    example: 'Incident',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the case category',
    example: 'An unplanned interruption to an IT service or reduction in the quality of an IT service',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether this case category is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

